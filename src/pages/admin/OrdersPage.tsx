import React, { useState, useMemo, useCallback } from 'react';
import { useOrders, useUpdateOrderStatus, useSettings } from '@/hooks/useSupabaseData';
import { formatBengaliPrice, toBengaliNum } from '@/lib/bengali';
import { Search, Filter, ChevronLeft, ChevronRight, Truck, FileText, CheckCircle2, Package, Loader2, Eye, X, MapPin, CreditCard, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';
import AdminPagination from '@/components/admin/AdminPagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import LiveTracking from '@/components/admin/LiveTracking';
import jsPDF from 'jspdf';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import type { Database } from '@/integrations/supabase/types';

type OrderStatus = Database['public']['Enums']['order_status'];

const statusLabels: Record<OrderStatus, string> = {
  pending: 'পেন্ডিং', processing: 'প্রসেসিং', shipped: 'শিপড', completed: 'সম্পন্ন', cancelled: 'ক্যানসেল', returned: 'রিটার্ন',
};

const statusStyles: Record<OrderStatus, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  processing: 'bg-info/10 text-info border-info/20',
  shipped: 'bg-accent/10 text-accent border-accent/20',
  completed: 'bg-success/10 text-success border-success/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
  returned: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
};

const OrdersPage = () => {
  const [filter, setFilter] = useState<OrderStatus | undefined>();
  const [paymentFilter, setPaymentFilter] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const { data: orders, isLoading } = useOrders(filter);
  const { data: settings } = useSettings();
  const updateStatus = useUpdateOrderStatus();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [courierProvider, setCourierProvider] = useState<'redx' | 'pathao' | 'steadfast'>('redx');
  const [bookingInProgress, setBookingInProgress] = useState<string | null>(null);

  const providerNames: Record<string, string> = { redx: 'RedX', pathao: 'Pathao', steadfast: 'Steadfast' };

  const bookCourier = useCallback(async (orderId: string, customerName: string) => {
    setBookingInProgress(orderId);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        toast({ title: 'ত্রুটি!', description: 'আপনি লগইন করা নেই', variant: 'destructive' });
        return;
      }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const functionName = `book-${courierProvider}-courier`;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${functionName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ order_id: orderId }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        const errorMsg = result?.details?.message || result?.details || result?.error || 'কুরিয়ার বুক করতে সমস্যা হয়েছে';
        toast({
          title: `❌ ${providerNames[courierProvider]} API ত্রুটি!`,
          description: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg),
          variant: 'destructive',
          duration: 8000,
        });
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['orders'] });
      const modeLabel = result.mode === 'sandbox' ? ' (🧪 TEST)' : '';
      // Show the raw API response message from the courier
      const apiMessage = result?.redx_response?.message 
        || result?.pathao_response?.message 
        || result?.steadfast_response?.message 
        || result?.api_response?.message
        || null;
      const description = apiMessage 
        ? `${apiMessage} — ট্র্যাকিং: ${result.tracking_id}${result.mode === 'sandbox' ? ' (টেস্ট)' : ''}`
        : `${customerName} — ট্র্যাকিং আইডি: ${result.tracking_id}${result.mode === 'sandbox' ? ' (টেস্ট অর্ডার)' : ''}`;
      toast({
        title: `✅ ${providerNames[courierProvider]} কুরিয়ার বুক সফল!${modeLabel}`,
        description,
        duration: 8000,
      });
    } catch (err: any) {
      toast({
        title: '❌ নেটওয়ার্ক ত্রুটি!',
        description: err?.message || `${providerNames[courierProvider]} সার্ভারে সংযোগ করা যায়নি`,
        variant: 'destructive',
      });
    } finally {
      setBookingInProgress(null);
    }
  }, [toast, queryClient, courierProvider]);

  const bulkBookCourier = useCallback(async (ids: string[]) => {
    const unbookedIds = ids.filter(id => {
      const order = orders?.find(o => o.id === id);
      return order && !(order as any).courier_booked;
    });
    if (!unbookedIds.length) {
      toast({ title: '⚠️ কোনো নতুন অর্ডার নেই', description: 'সিলেক্ট করা সব অর্ডার ইতিমধ্যে কুরিয়ারে বুক হয়েছে' });
      return;
    }

    setBookingInProgress('bulk');
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
      toast({ title: 'ত্রুটি!', description: 'আপনি লগইন করা নেই', variant: 'destructive' });
      setBookingInProgress(null);
      return;
    }

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    let successCount = 0;
    let failCount = 0;

    for (const id of unbookedIds) {
      try {
        const functionName = `book-${courierProvider}-courier`;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/${functionName}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({ order_id: id }),
          }
        );
        if (res.ok) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }

    queryClient.invalidateQueries({ queryKey: ['orders'] });
    setSelectedIds(new Set());
    setBookingInProgress(null);
    toast({
      title: successCount > 0 ? '✅ বাল্ক কুরিয়ার বুক সম্পন্ন!' : '❌ বাল্ক বুক ব্যর্থ!',
      description: `সফল: ${toBengaliNum(successCount)}, ব্যর্থ: ${toBengaliNum(failCount)}`,
      duration: 8000,
    });
  }, [orders, toast, queryClient, courierProvider]);

  const downloadInvoice = useCallback((order: any) => {
    const brandName = settings?.brand_name || 'Kronos Premium Watch';
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(brandName, 15, 22);
    doc.setFontSize(10);
    doc.text('INVOICE', 15, 32);
    
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    const orderId = order.id.slice(0, 8).toUpperCase();
    doc.text(`Invoice #: INV-${orderId}`, 140, 22);
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString('en-GB')}`, 140, 28);
    
    let y = 55;
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text('Bill To:', 15, y);
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    y += 8;
    doc.text(`Name: ${order.customer_name}`, 15, y);
    y += 6;
    doc.text(`Phone: ${order.phone}`, 15, y);
    y += 6;
    doc.text(`Address: ${order.address}`, 15, y);
    y += 6;
    doc.text(`Area: ${order.delivery_location === 'dhaka' ? 'Dhaka' : 'Outside Dhaka'}`, 15, y);
    
    y += 15;
    doc.setFillColor(245, 245, 245);
    doc.rect(15, y - 5, 180, 10, 'F');
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    doc.text('Product', 18, y + 1);
    doc.text('Qty', 110, y + 1);
    doc.text('Price', 135, y + 1);
    doc.text('Total', 165, y + 1);
    
    y += 12;
    doc.setTextColor(60, 60, 60);
    doc.text(order.watch_model, 18, y);
    doc.text(String(order.quantity), 110, y);
    const unitPrice = (order.total_price - order.delivery_charge) / order.quantity;
    doc.text(`Tk ${unitPrice.toLocaleString()}`, 135, y);
    doc.text(`Tk ${(order.total_price - order.delivery_charge).toLocaleString()}`, 165, y);
    
    y += 15;
    doc.setDrawColor(220, 220, 220);
    doc.line(110, y, 195, y);
    y += 8;
    doc.text('Subtotal:', 110, y);
    doc.text(`Tk ${(order.total_price - order.delivery_charge).toLocaleString()}`, 165, y);
    y += 7;
    doc.text('Delivery Charge:', 110, y);
    doc.text(`Tk ${order.delivery_charge.toLocaleString()}`, 165, y);
    y += 7;
    doc.text(`Payment: ${order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method.toUpperCase()}`, 110, y);
    if (order.trx_id) {
      y += 7;
      doc.text(`TrxID: ${order.trx_id}`, 110, y);
    }
    y += 3;
    doc.line(110, y, 195, y);
    y += 8;
    doc.setFontSize(13);
    doc.setTextColor(30, 30, 30);
    doc.text('Grand Total:', 110, y);
    doc.text(`Tk ${order.total_price.toLocaleString()}`, 165, y);
    
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your purchase!', 105, 280, { align: 'center' });
    doc.text(`${brandName} | Generated on ${new Date().toLocaleDateString('en-GB')}`, 105, 285, { align: 'center' });
    
    doc.save(`invoice-${orderId}.pdf`);
    toast({ title: '📄 PDF ইনভয়েস ডাউনলোড হয়েছে' });
  }, [toast, settings]);

  const filtered = useMemo(() => {
    if (!orders) return [];
    let list = orders;
    if (paymentFilter) {
      if (paymentFilter === 'cod') {
        list = list.filter(o => o.payment_method === 'cod');
      } else {
        list = list.filter(o => o.payment_method !== 'cod');
      }
    }
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(o =>
      o.customer_name.toLowerCase().includes(q) ||
      o.phone.includes(q) ||
      o.watch_model.toLowerCase().includes(q) ||
      (o.trx_id && o.trx_id.toLowerCase().includes(q))
    );
  }, [orders, search, paymentFilter]);

  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const allPageSelected = paged.length > 0 && paged.every(o => selectedIds.has(o.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allPageSelected) {
      const newSet = new Set(selectedIds);
      paged.forEach(o => newSet.delete(o.id));
      setSelectedIds(newSet);
    } else {
      const newSet = new Set(selectedIds);
      paged.forEach(o => newSet.add(o.id));
      setSelectedIds(newSet);
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  return (
    <div className="space-y-5 w-full">
      {/* ─── Bento Filter/Search Header ─── */}
      <div className="bg-white dark:bg-card rounded-sm border border-border/30 shadow-sm p-5 md:p-6">
        {/* Title & Search Row */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">সকল অর্ডার</h2>
            <p className="text-xs text-muted-foreground mt-1">মোট {toBengaliNum(filtered.length)} টি অর্ডার পাওয়া গেছে</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto">
            {/* Courier Provider */}
            <div className="flex items-center gap-2 bg-muted/20 dark:bg-muted/10 border border-border/30 rounded-lg px-3.5 py-2.5">
              <Truck className="h-4 w-4 text-gold shrink-0" />
              <select
                value={courierProvider}
                onChange={e => setCourierProvider(e.target.value as 'redx' | 'pathao' | 'steadfast')}
                className="bg-transparent border-none outline-none text-sm font-medium text-foreground cursor-pointer"
              >
                <option value="redx">RedX</option>
                <option value="pathao">Pathao</option>
                <option value="steadfast">Steadfast</option>
              </select>
            </div>
            {/* Search */}
            <div className="flex items-center gap-2.5 bg-muted/20 dark:bg-muted/10 border border-border/30 rounded-lg px-3.5 py-2.5 flex-1 lg:min-w-[280px]">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                placeholder="নাম, ফোন বা TrxID দিয়ে খুঁজুন..."
                className="bg-transparent border-none outline-none w-full text-sm text-foreground placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="space-y-3 pt-4 border-t border-border/15">
          {/* Status Filter */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 mr-1">
              <Filter className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-semibold">স্ট্যাটাস:</span>
            </div>
            {[undefined, 'pending', 'processing', 'shipped', 'completed', 'returned'].map((s) => (
              <button
                key={s ?? 'all'}
                onClick={() => { setFilter(s as OrderStatus | undefined); setPage(0); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                  filter === s
                    ? 'gradient-gold text-white border-transparent shadow-sm'
                    : 'bg-muted/15 dark:bg-muted/10 text-muted-foreground border-border/30 hover:border-gold/30 hover:text-gold'
                }`}
              >
                {s ? statusLabels[s as OrderStatus] : 'সব'}
              </button>
            ))}
          </div>

          {/* Payment Type Filter */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 mr-1">
              <CreditCard className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-semibold">পেমেন্ট:</span>
            </div>
            {[undefined, 'cod', 'online'].map(f => (
              <button
                key={f ?? 'all'}
                onClick={() => { setPaymentFilter(f); setPage(0); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                  paymentFilter === f
                    ? 'gradient-gold text-white border-transparent shadow-sm'
                    : 'bg-muted/15 dark:bg-muted/10 text-muted-foreground border-border/30 hover:border-gold/30 hover:text-gold'
                }`}
              >
                {f === 'cod' ? 'ক্যাশ অন ডেলিভারি' : f === 'online' ? 'অনলাইন পেমেন্ট' : 'সব'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Bulk Actions Bar ─── */}
      {someSelected && (
        <div className="flex items-center gap-3 bg-gold/5 border border-gold/20 rounded-sm px-4 py-3">
          <span className="text-sm font-semibold text-foreground">
            {toBengaliNum(selectedIds.size)} টি সিলেক্ট করা হয়েছে
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => bulkBookCourier(Array.from(selectedIds))}
              className="flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-semibold gradient-gold text-white hover:opacity-90 transition-all shadow-sm"
              style={{ boxShadow: '0 4px 12px -4px hsl(var(--gold) / 0.3)' }}
            >
              <Package className="h-3.5 w-3.5" />
              সব কুরিয়ারে যুক্ত করুন
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2 rounded-sm text-xs font-medium text-muted-foreground hover:bg-muted transition-colors border border-border/40"
            >
              বাতিল
            </button>
          </div>
        </div>
      )}

      {/* ─── Order Table ─── */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-sm" />)}
        </div>
      ) : !paged.length ? (
        <div className="bg-surface dark:bg-card rounded-sm border border-border/30 p-16 text-center text-muted-foreground shadow-sm">
          কোনো অর্ডার পাওয়া যায়নি।
        </div>
      ) : (
        <div className="bg-white dark:bg-card rounded-sm border border-border/30 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/40">
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={allPageSelected}
                      onCheckedChange={toggleSelectAll}
                      className="border-muted-foreground/40"
                    />
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 w-[50px]">#</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">কাস্টমার</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">ঠিকানা</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">ফোন</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">মডেল</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 text-center whitespace-nowrap">পরিমাণ</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">মোট</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">TrxID</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">পেমেন্ট</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">ট্র্যাকিং</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">ট্র্যাক স্ট্যাটাস</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">এলাকা</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">তারিখ</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">স্ট্যাটাস</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 text-right whitespace-nowrap">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((o, index) => {
                  const serial = page * pageSize + index + 1;
                  const courierBooked = (o as any).courier_booked === true;
                    return (
                    <React.Fragment key={o.id}>
                    <TableRow className={`group hover:bg-gold/[0.03] transition-colors duration-200 border-b border-border/20 ${selectedIds.has(o.id) ? 'bg-gold/5' : ''}`}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(o.id)}
                          onCheckedChange={() => toggleSelect(o.id)}
                          className="border-muted-foreground/40"
                        />
                      </TableCell>
                      <TableCell className="font-inter text-xs font-semibold text-muted-foreground tabular-nums">
                        {toBengaliNum(serial)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <p className="font-medium text-sm text-foreground">{o.customer_name}</p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground max-w-[250px]">
                        <p className="truncate">{o.address}</p>
                      </TableCell>
                      <TableCell className="font-inter text-sm tabular-nums text-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {o.phone}
                          {(o as any).fraud_success_rate !== null && (o as any).fraud_success_rate !== undefined ? (
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm text-[9px] font-bold border ${
                              (o as any).fraud_success_rate >= 60
                                ? 'bg-success/10 text-success border-success/20'
                                : 'bg-destructive/10 text-destructive border-destructive/20'
                            }`}>
                              {Math.round((o as any).fraud_success_rate)}%
                            </span>
                          ) : (o as any).fraud_flag === 'new_customer' ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm text-[9px] font-bold border bg-warning/10 text-warning border-warning/20">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              নতুন
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-foreground whitespace-nowrap">
                        <span>{o.watch_model}</span>
                        {(o as any).selected_color && (
                          <span className="ml-2 text-[11px] text-gold font-medium">🎨 {(o as any).selected_color}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-inter text-sm text-foreground">{toBengaliNum(o.quantity)}</TableCell>
                      <TableCell className="font-semibold text-gold font-inter text-sm whitespace-nowrap">
                        ৳{formatBengaliPrice(o.total_price)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {o.trx_id ? (
                          <span className="bg-gold/10 text-gold px-2 py-1 rounded-sm text-[11px] font-mono font-semibold border border-gold/15">
                            {o.trx_id}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">COD</span>
                        )}
                      </TableCell>
                      {/* Payment Status */}
                      <TableCell className="whitespace-nowrap">
                        {o.payment_method === 'cod' ? (
                          <span className="text-[10px] font-semibold px-2 py-1 rounded-sm border bg-muted/20 text-muted-foreground border-border/20 whitespace-nowrap">ক্যাশ অন ডেলিভারি</span>
                        ) : (o as any).payment_type === 'full_payment' ? (
                          <div>
                            <span className="text-[10px] font-semibold px-2 py-1 rounded-sm border bg-success/10 text-success border-success/20 whitespace-nowrap">পেমেন্ট সম্পন্ন ✓</span>
                            <p className="text-[10px] text-success/70 mt-0.5 font-inter whitespace-nowrap">৳{formatBengaliPrice((o as any).advance_amount || 0)}</p>
                          </div>
                        ) : (o as any).payment_type === 'delivery_charge_only' ? (
                          <div>
                            <span className="text-[10px] font-semibold px-2 py-1 rounded-sm border bg-warning/10 text-warning border-warning/20 whitespace-nowrap">ডেলিভারি চার্জ দেওয়া</span>
                            <p className="text-[10px] text-warning/70 mt-0.5 font-inter whitespace-nowrap">বাকি: ৳{formatBengaliPrice(o.total_price - ((o as any).advance_amount || 0))}</p>
                          </div>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-1 rounded-sm border bg-info/10 text-info border-info/20 whitespace-nowrap">অনলাইন</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {(o as any).tracking_id ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="bg-success/10 text-success px-2 py-1 rounded-sm text-[11px] font-mono font-semibold border border-success/15 whitespace-nowrap">
                              {(o as any).tracking_id}
                            </span>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {(o as any).courier_provider === 'pathao' ? 'Pathao' : (o as any).courier_provider === 'steadfast' ? 'Steadfast' : 'RedX'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">—</span>
                        )}
                      </TableCell>
                      {/* Tracking Status Badge */}
                      <TableCell className="whitespace-nowrap">
                        {courierBooked ? (
                          <button
                            onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                              o.status === 'completed'
                                ? 'bg-success/10 text-success border-success/20'
                                : o.status === 'shipped'
                                ? 'bg-info/10 text-info border-info/20'
                                : o.status === 'returned'
                                ? 'bg-destructive/10 text-destructive border-destructive/20'
                                : 'bg-warning/10 text-warning border-warning/20'
                            }`}
                          >
                            <Eye className="h-2.5 w-2.5" />
                            {o.status === 'completed' ? 'ডেলিভারড' : o.status === 'shipped' ? 'ট্রানজিট' : o.status === 'returned' ? 'রিটার্ন' : 'পেন্ডিং'}
                          </button>
                        ) : (
                          <span className="text-muted-foreground text-[10px]">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-[11px] text-foreground whitespace-nowrap">
                        {o.delivery_location === 'dhaka' ? 'ঢাকা' : 'ঢাকার বাইরে'}
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground font-inter tabular-nums whitespace-nowrap">
                        {new Date(o.created_at).toLocaleDateString('bn-BD')}
                      </TableCell>
                      <TableCell>
                        <select
                          value={o.status}
                          onChange={(e) => updateStatus.mutate({ id: o.id, status: e.target.value as OrderStatus })}
                          className={`text-[11px] font-semibold px-3 py-1.5 rounded-sm border cursor-pointer appearance-none transition-colors ${statusStyles[o.status]}`}
                        >
                          {Object.entries(statusLabels).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1.5">
                          {courierBooked ? (
                            <span 
                              className="p-1.5 rounded-sm text-success cursor-help" 
                              title={`✅ কুরিয়ার: ${(o as any).courier_provider || 'N/A'} | ট্র্যাকিং: ${(o as any).tracking_id || 'N/A'}`}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </span>
                          ) : (
                            <button
                              onClick={() => bookCourier(o.id, o.customer_name)}
                              disabled={bookingInProgress === o.id || bookingInProgress === 'bulk'}
                              className="p-1.5 rounded-sm text-gold/70 hover:text-gold hover:bg-gold/10 transition-all disabled:opacity-50"
                              title="কুরিয়ার বুক"
                            >
                              {bookingInProgress === o.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Truck className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => downloadInvoice(o)}
                            className="p-1.5 rounded-sm text-gold/70 hover:text-gold hover:bg-gold/10 transition-all"
                            title="ইনভয়েস ডাউনলোড"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {/* Expandable Live Tracking Row */}
                    {expandedOrderId === o.id && (
                      <TableRow className="bg-muted/10 hover:bg-muted/10">
                        <TableCell colSpan={15} className="py-4 px-6">
                          <div className="flex items-start justify-between">
                            <LiveTracking
                              orderId={o.id}
                              trackingId={(o as any).tracking_id}
                              courierProvider={(o as any).courier_provider}
                            />
                            <button
                              onClick={() => setExpandedOrderId(null)}
                              className="p-1.5 rounded-sm hover:bg-muted text-muted-foreground"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
                })}
              </TableBody>
            </Table>
          </div>

           {/* Pagination */}
          <AdminPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={s => { setPageSize(s); setPage(0); }}
          />
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
