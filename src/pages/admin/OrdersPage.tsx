import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useOrdersPaginated, useUpdateOrderStatus, useSettings } from '@/hooks/useSupabaseData';
import { formatBengaliPrice, toBengaliNum } from '@/lib/bengali';
import { Search, Filter, Truck, FileText, CheckCircle2, Package, Loader2, Eye, X, CreditCard, AlertTriangle, ShieldCheck, ShieldX, ShieldQuestion, RefreshCw } from 'lucide-react';
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

// Manual Fraud Check Modal
const FraudCheckModal = ({ phone, onClose }: { phone: string; onClose: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runCheck = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: invokeErr } = await supabase.functions.invoke('check-fraud', {
        body: { phone: phone.replace(/[\s-]/g, '') },
      });
      if (invokeErr) {
        setError('API কল ব্যর্থ হয়েছে');
        return;
      }
      if (data?.flag === 'check_failed') {
        setError(data.error_message || 'API চেক ব্যর্থ');
      }
      setResult(data);
    } catch {
      setError('নেটওয়ার্ক ত্রুটি');
    } finally {
      setLoading(false);
    }
  }, [phone]);

  // Auto-run on mount
  React.useEffect(() => { runCheck(); }, [runCheck]);

  return (
    <div className="fixed inset-0 z-[100] bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-card rounded-sm border border-border/30 shadow-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/20">
          <div>
            <h3 className="font-bold text-sm text-foreground">ম্যানুয়াল ফ্রড চেক</h3>
            <p className="text-xs text-muted-foreground font-inter mt-0.5">{phone}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={runCheck} disabled={loading} className="p-1.5 rounded-sm hover:bg-muted transition-colors text-muted-foreground disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-sm hover:bg-muted transition-colors text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          {loading && !result && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gold" />
              <span className="ml-2 text-sm text-muted-foreground">চেক হচ্ছে...</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-sm bg-destructive/5 border border-destructive/15 mb-3">
              <p className="text-xs text-destructive font-medium flex items-center gap-1.5">
                <ShieldX className="h-3.5 w-3.5" />
                {error}
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              {/* Risk Badge */}
              <div className="flex items-center gap-2">
                {result.flag === 'good' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold border bg-success/10 text-success border-success/20">
                    <ShieldCheck className="h-3.5 w-3.5" /> নিরাপদ কাস্টমার
                  </span>
                )}
                {result.flag === 'low_success' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold border bg-destructive/10 text-destructive border-destructive/20">
                    <ShieldX className="h-3.5 w-3.5" /> ঝুঁকিপূর্ণ কাস্টমার
                  </span>
                )}
                {result.flag === 'new_customer' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold border bg-warning/10 text-warning border-warning/20">
                    <AlertTriangle className="h-3.5 w-3.5" /> নতুন কাস্টমার
                  </span>
                )}
                {result.flag === 'check_failed' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold border bg-destructive/10 text-destructive border-destructive/20">
                    <ShieldX className="h-3.5 w-3.5" /> চেক ব্যর্থ
                  </span>
                )}
              </div>

              {/* Overview Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-muted/20 rounded-sm border border-border/20 p-3 text-center">
                  <p className="text-lg font-bold text-foreground font-inter">{toBengaliNum(result.total_parcels || 0)}</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">মোট পার্সেল</p>
                </div>
                <div className="bg-success/5 rounded-sm border border-success/15 p-3 text-center">
                  <p className="text-lg font-bold text-success font-inter">{toBengaliNum(result.total_delivered || 0)}</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">ডেলিভারড</p>
                </div>
                <div className="bg-destructive/5 rounded-sm border border-destructive/15 p-3 text-center">
                  <p className="text-lg font-bold text-destructive font-inter">{toBengaliNum(result.total_cancel || 0)}</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">ক্যানসেলড</p>
                </div>
              </div>

              {/* Success Rate Bar */}
              {result.success_rate !== null && (
                <div className="bg-muted/10 rounded-sm border border-border/20 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-muted-foreground">সাকসেস রেট</span>
                    <span className={`text-sm font-bold font-inter ${result.success_rate >= 60 ? 'text-success' : 'text-destructive'}`}>
                      {Math.round(result.success_rate)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted/30 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${result.success_rate >= 60 ? 'bg-success' : 'bg-destructive'}`}
                      style={{ width: `${Math.min(100, result.success_rate)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Courier-wise Breakdown */}
              {result.apis && Object.keys(result.apis).length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold">কুরিয়ার ভিত্তিক বিবরণ</p>
                  {Object.entries(result.apis).map(([courier, stats]: [string, any]) => {
                    const courierRate = stats.total_parcels > 0 ? Math.round((stats.total_delivered_parcels / stats.total_parcels) * 100) : 0;
                    return (
                      <div key={courier} className="bg-muted/10 rounded-sm border border-border/20 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-foreground">{courier}</span>
                          <span className={`text-xs font-bold font-inter ${courierRate >= 60 ? 'text-success' : 'text-destructive'}`}>
                            {courierRate}%
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 text-center">
                          <div>
                            <p className="text-sm font-bold text-foreground font-inter">{toBengaliNum(stats.total_parcels || 0)}</p>
                            <p className="text-[9px] text-muted-foreground">পার্সেল</p>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-success font-inter">{toBengaliNum(stats.total_delivered_parcels || 0)}</p>
                            <p className="text-[9px] text-muted-foreground">ডেলিভারড</p>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-destructive font-inter">{toBengaliNum(stats.total_cancelled_parcels || 0)}</p>
                            <p className="text-[9px] text-muted-foreground">ক্যানসেলড</p>
                          </div>
                        </div>
                        <div className="w-full bg-muted/30 rounded-full h-1 mt-2">
                          <div
                            className={`h-1 rounded-full transition-all ${courierRate >= 60 ? 'bg-success' : 'bg-destructive'}`}
                            style={{ width: `${Math.min(100, courierRate)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const OrdersPage = () => {
  const [filter, setFilter] = useState<OrderStatus | undefined>();
  const [paymentFilter, setPaymentFilter] = useState<'cod' | 'online' | undefined>();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [fraudCheckPhone, setFraudCheckPhone] = useState<string | null>(null);

  // Debounce search input (400ms)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const { data: result, isLoading, isFetching } = useOrdersPaginated({
    page,
    pageSize,
    statusFilter: filter,
    paymentFilter,
    search: debouncedSearch,
  });

  const orders = result?.data ?? [];
  const totalCount = result?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

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

      const resultData = await res.json();

      if (!res.ok) {
        const errorMsg = resultData?.details?.message || resultData?.details || resultData?.error || 'কুরিয়ার বুক করতে সমস্যা হয়েছে';
        toast({
          title: `❌ ${providerNames[courierProvider]} API ত্রুটি!`,
          description: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg),
          variant: 'destructive',
          duration: 8000,
        });
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['orders_paginated'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      const modeLabel = resultData.mode === 'sandbox' ? ' (🧪 TEST)' : '';
      const apiMessage = resultData?.redx_response?.message 
        || resultData?.pathao_response?.message 
        || resultData?.steadfast_response?.message 
        || resultData?.api_response?.message
        || null;
      const description = apiMessage 
        ? `${apiMessage} — ট্র্যাকিং: ${resultData.tracking_id}${resultData.mode === 'sandbox' ? ' (টেস্ট)' : ''}`
        : `${customerName} — ট্র্যাকিং আইডি: ${resultData.tracking_id}${resultData.mode === 'sandbox' ? ' (টেস্ট অর্ডার)' : ''}`;
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

    queryClient.invalidateQueries({ queryKey: ['orders_paginated'] });
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

  const paged = orders;

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

  // Helper to get risk level info
  const getRiskBadge = (o: any) => {
    const flag = o.fraud_flag;
    const rate = o.fraud_success_rate;
    const errorMsg = o.fraud_error_message;

    if (flag === 'check_failed') {
      return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm text-[9px] font-bold border bg-destructive/10 text-destructive border-destructive/20 cursor-help" title={errorMsg || 'চেক ব্যর্থ'}>
          <ShieldX className="w-2.5 h-2.5" />
          ব্যর্থ
        </span>
      );
    }
    if (flag === 'new_customer') {
      return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm text-[9px] font-bold border bg-warning/10 text-warning border-warning/20">
          <AlertTriangle className="w-2.5 h-2.5" />
          নতুন
        </span>
      );
    }
    if (flag === 'low_success' && rate !== null && rate !== undefined) {
      return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm text-[9px] font-bold border bg-destructive/10 text-destructive border-destructive/20">
          {Math.round(rate)}%
        </span>
      );
    }
    if (flag === 'good' && rate !== null && rate !== undefined) {
      return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm text-[9px] font-bold border bg-success/10 text-success border-success/20">
          {Math.round(rate)}%
        </span>
      );
    }
    // No fraud data
    return <span className="text-muted-foreground text-[10px]">—</span>;
  };

  return (
    <div className="space-y-5 w-full">
      {/* Manual Fraud Check Modal */}
      {fraudCheckPhone && (
        <FraudCheckModal phone={fraudCheckPhone} onClose={() => setFraudCheckPhone(null)} />
      )}

      {/* ─── Bento Filter/Search Header ─── */}
      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5 md:p-6">
        {/* Title & Search Row */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">সকল অর্ডার</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">মোট {toBengaliNum(totalCount)} টি অর্ডার পাওয়া গেছে {isFetching && !isLoading ? '⟳' : ''}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto">
            {/* Courier Provider */}
            <div className="flex items-center gap-2 bg-muted/30 border border-border/40 rounded-sm px-3 py-2.5">
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
            <div className="flex items-center gap-2 bg-muted/30 border border-border/40 rounded-sm px-3 py-2.5 flex-1 lg:min-w-[280px]">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="text" value={search} onChange={e => { setSearch(e.target.value); }}
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
                className={`px-3.5 py-1.5 rounded-sm text-xs font-medium transition-all duration-200 border ${
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
            {[undefined, 'cod', 'online'].map((f) => (
              <button
                key={f ?? 'all'}
                onClick={() => { setPaymentFilter(f as 'cod' | 'online' | undefined); setPage(0); }}
                className={`px-3.5 py-1.5 rounded-sm text-xs font-medium transition-all duration-200 border ${
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
        <div className="bg-surface dark:bg-card rounded-sm border border-border/30 overflow-hidden shadow-sm">
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
                   <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 w-[50px]">#</TableHead>
                   <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">কাস্টমার</TableHead>
                   <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">ঠিকানা</TableHead>
                   <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">ফোন</TableHead>
                   <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">রিস্ক</TableHead>
                   <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">মডেল</TableHead>
                   <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 text-center whitespace-nowrap">পরিমাণ</TableHead>
                   <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">মোট</TableHead>
                   <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">TrxID</TableHead>
                   <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">পেমেন্ট</TableHead>
                   <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">ট্র্যাকিং</TableHead>
                   <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">ট্র্যাক স্ট্যাটাস</TableHead>
                   <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">এলাকা</TableHead>
                   <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">তারিখ</TableHead>
                   <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">স্ট্যাটাস</TableHead>
                   <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 text-right whitespace-nowrap">অ্যাকশন</TableHead>
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
                        {((o as any).upazila || (o as any).district) && (
                          <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">
                            {(o as any).upazila && <span>{(o as any).upazila}</span>}
                            {(o as any).district && <span>, {(o as any).district}</span>}
                            {(o as any).division && <span> ({(o as any).division})</span>}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="font-inter text-sm tabular-nums text-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{o.phone}</span>
                          <button
                            onClick={() => setFraudCheckPhone(o.phone)}
                            className="p-0.5 rounded-sm hover:bg-muted transition-colors text-muted-foreground/50 hover:text-gold"
                            title="ম্যানুয়াল ফ্রড চেক"
                          >
                            <ShieldQuestion className="w-3 h-3" />
                          </button>
                        </div>
                      </TableCell>
                      {/* Risk Level */}
                      <TableCell className="whitespace-nowrap">
                        {getRiskBadge(o)}
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
                        <TableCell colSpan={17} className="py-4 px-6">
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
            totalItems={totalCount}
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
