import { useState, useMemo, useCallback } from 'react';
import { useOrders, useUpdateOrderStatus, useSettings } from '@/hooks/useSupabaseData';
import { formatBengaliPrice, toBengaliNum } from '@/lib/bengali';
import { Search, Filter, ChevronLeft, ChevronRight, Truck, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import jsPDF from 'jspdf';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
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
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 15;
  const { data: orders, isLoading } = useOrders(filter);
  const { data: settings } = useSettings();
  const updateStatus = useUpdateOrderStatus();
  const { toast } = useToast();

  const bookCourier = useCallback((orderId: string, customerName: string) => {
    const mockTrackingId = `TRK-${Date.now().toString(36).toUpperCase()}`;
    toast({
      title: 'কুরিয়ার বুক হয়েছে!',
      description: `${customerName} — ট্র্যাকিং: ${mockTrackingId}`,
    });
  }, [toast]);

  const downloadInvoice = useCallback((order: any) => {
    const brandName = settings?.brand_name || 'Kronos Premium Watch';
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    
    // Header
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(brandName, 15, 22);
    doc.setFontSize(10);
    doc.text('INVOICE', 15, 32);
    
    // Invoice details
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    const orderId = order.id.slice(0, 8).toUpperCase();
    doc.text(`Invoice #: INV-${orderId}`, 140, 22);
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString('en-GB')}`, 140, 28);
    
    // Customer info
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
    
    // Table header
    y += 15;
    doc.setFillColor(245, 245, 245);
    doc.rect(15, y - 5, 180, 10, 'F');
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    doc.text('Product', 18, y + 1);
    doc.text('Qty', 110, y + 1);
    doc.text('Price', 135, y + 1);
    doc.text('Total', 165, y + 1);
    
    // Table row
    y += 12;
    doc.setTextColor(60, 60, 60);
    doc.text(order.watch_model, 18, y);
    doc.text(String(order.quantity), 110, y);
    const unitPrice = (order.total_price - order.delivery_charge) / order.quantity;
    doc.text(`Tk ${unitPrice.toLocaleString()}`, 135, y);
    doc.text(`Tk ${(order.total_price - order.delivery_charge).toLocaleString()}`, 165, y);
    
    // Summary
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
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your purchase!', 105, 280, { align: 'center' });
    doc.text(`${brandName} | Generated on ${new Date().toLocaleDateString('en-GB')}`, 105, 285, { align: 'center' });
    
    doc.save(`invoice-${orderId}.pdf`);
    toast({ title: 'PDF ইনভয়েস ডাউনলোড হয়েছে' });
  }, [toast, settings]);

  const filtered = useMemo(() => {
    if (!orders) return [];
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter(o =>
      o.customer_name.toLowerCase().includes(q) ||
      o.phone.includes(q) ||
      o.watch_model.toLowerCase().includes(q) ||
      (o.trx_id && o.trx_id.toLowerCase().includes(q))
    );
  }, [orders, search]);

  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">সকল অর্ডার</h2>
          <p className="text-[11px] text-muted-foreground">মোট {toBengaliNum(filtered.length)} টি অর্ডার</p>
        </div>
        <div className="flex items-center gap-2 glass-card rounded-xl px-3 py-2 min-w-[240px]">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="নাম, ফোন বা TrxID দিয়ে খুঁজুন..."
            className="bg-transparent border-none outline-none w-full text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {[undefined, 'pending', 'processing', 'shipped', 'completed', 'returned'].map((s) => (
          <button
            key={s ?? 'all'}
            onClick={() => { setFilter(s as OrderStatus | undefined); setPage(0); }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
              filter === s
                ? 'bg-foreground text-background border-foreground shadow-sm'
                : 'bg-card text-muted-foreground border-border hover:border-foreground/20 hover:bg-muted'
            }`}
          >
            {s ? statusLabels[s as OrderStatus] : 'সব'}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      ) : !paged.length ? (
        <div className="glass-card rounded-2xl p-16 text-center text-muted-foreground">
          কোনো অর্ডার পাওয়া যায়নি।
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/60">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">কাস্টমার</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">ফোন</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">মডেল</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center">পরিমাণ</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">মোট</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">TrxID</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">এলাকা</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">তারিখ</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">স্ট্যাটাস</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((o) => (
                  <TableRow key={o.id} className="group hover:bg-muted/30 transition-colors duration-200 border-b border-border/40">
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm text-foreground">{o.customer_name}</p>
                        <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{o.address}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-inter text-sm tabular-nums text-foreground">{o.phone}</TableCell>
                    <TableCell className="text-sm text-foreground">{o.watch_model}</TableCell>
                    <TableCell className="text-center font-inter text-sm text-foreground">{toBengaliNum(o.quantity)}</TableCell>
                    <TableCell className="font-semibold text-accent font-inter text-sm">
                      ৳{formatBengaliPrice(o.total_price)}
                    </TableCell>
                    <TableCell>
                      {o.trx_id ? (
                        <span className="bg-accent/10 text-accent px-2 py-1 rounded-lg text-[11px] font-mono font-semibold">
                          {o.trx_id}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">COD</span>
                      )}
                    </TableCell>
                    <TableCell className="text-[11px] text-foreground">
                      {o.delivery_location === 'dhaka' ? 'ঢাকা' : 'ঢাকার বাইরে'}
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground font-inter tabular-nums">
                      {new Date(o.created_at).toLocaleDateString('bn-BD')}
                    </TableCell>
                    <TableCell>
                      <select
                        value={o.status}
                        onChange={(e) => updateStatus.mutate({ id: o.id, status: e.target.value as OrderStatus })}
                        className={`text-[11px] font-medium px-3 py-1.5 rounded-full border cursor-pointer appearance-none transition-colors ${statusStyles[o.status]}`}
                      >
                        {Object.entries(statusLabels).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => bookCourier(o.id, o.customer_name)}
                          className="p-1.5 rounded-lg text-info/70 hover:text-info hover:bg-info/10 transition-all"
                          title="কুরিয়ার বুক"
                        >
                          <Truck className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => downloadInvoice(o)}
                          className="p-1.5 rounded-lg text-accent/70 hover:text-accent hover:bg-accent/10 transition-all"
                          title="ইনভয়েস ডাউনলোড"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border/60 bg-muted/20">
              <p className="text-[11px] text-muted-foreground">
                পৃষ্ঠা {toBengaliNum(page + 1)} / {toBengaliNum(totalPages)}
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-card border border-border hover:bg-muted disabled:opacity-40 transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> পূর্ববর্তী
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-card border border-border hover:bg-muted disabled:opacity-40 transition-colors flex items-center gap-1"
                >
                  পরবর্তী <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
