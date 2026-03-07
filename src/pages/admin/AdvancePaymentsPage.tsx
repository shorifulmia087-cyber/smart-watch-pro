import { useMemo, useState } from 'react';
import { useOrdersLite } from '@/hooks/useSupabaseData';
import { formatBengaliPrice, toBengaliNum } from '@/lib/bengali';
import { Search, Banknote, CheckCircle2, Clock, CreditCard } from 'lucide-react';
import AdminPagination from '@/components/admin/AdminPagination';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';

const paymentTypeLabels: Record<string, { text: string; style: string }> = {
  full_payment: { text: 'সম্পূর্ণ পেমেন্ট', style: 'bg-success/10 text-success border-success/20' },
  delivery_charge_only: { text: 'শুধু ডেলিভারি চার্জ', style: 'bg-warning/10 text-warning border-warning/20' },
};

const AdvancePaymentsPage = () => {
  const { data: orders, isLoading } = useOrders();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [typeFilter, setTypeFilter] = useState<string | undefined>();

  const advanceOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter((o: any) => o.payment_method !== 'cod' && o.advance_amount > 0);
  }, [orders]);

  const filtered = useMemo(() => {
    let list = advanceOrders;
    if (typeFilter) list = list.filter((o: any) => o.payment_type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((o: any) =>
        o.customer_name.toLowerCase().includes(q) ||
        o.phone.includes(q) ||
        (o.trx_id && o.trx_id.toLowerCase().includes(q))
      );
    }
    return list;
  }, [advanceOrders, search, typeFilter]);

  const summary = useMemo(() => {
    const totalAdvance = advanceOrders.reduce((s: number, o: any) => s + (o.advance_amount || 0), 0);
    const fullPayCount = advanceOrders.filter((o: any) => o.payment_type === 'full_payment').length;
    const deliveryOnly = advanceOrders.filter((o: any) => o.payment_type === 'delivery_charge_only').length;
    return { total: advanceOrders.length, totalAdvance, fullPayCount, deliveryOnly };
  }, [advanceOrders]);

  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <div className="space-y-5 w-full">
      {/* Header */}
      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-4 md:p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">অগ্রিম পেমেন্ট</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              মোট {toBengaliNum(summary.total)} টি অগ্রিম পেমেন্ট — মোট ৳{formatBengaliPrice(summary.totalAdvance)}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-muted/30 border border-border/40 rounded-sm px-3 py-2 min-w-[240px]">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="নাম, ফোন বা TrxID দিয়ে খুঁজুন..."
              className="bg-transparent border-none outline-none w-full text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 flex-wrap mt-4 pt-4 border-t border-border/20">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          {[undefined, 'full_payment', 'delivery_charge_only'].map(f => (
            <button
              key={f ?? 'all'}
              onClick={() => { setTypeFilter(f); setPage(0); }}
              className={`px-3.5 py-1.5 rounded-sm text-xs font-medium transition-all duration-200 border ${
                typeFilter === f
                  ? 'gradient-gold text-white border-transparent shadow-sm'
                  : 'bg-transparent text-muted-foreground border-border/40 hover:border-gold/30 hover:text-gold'
              }`}
            >
              {f === 'full_payment' ? 'সম্পূর্ণ পেমেন্ট' : f === 'delivery_charge_only' ? 'শুধু ডেলিভারি চার্জ' : 'সব'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard icon={Banknote} label="মোট অগ্রিম" value={`৳${formatBengaliPrice(summary.totalAdvance)}`} variant="accent" />
        <SummaryCard icon={CreditCard} label="মোট পেমেন্ট" value={toBengaliNum(summary.total)} variant="info" />
        <SummaryCard icon={CheckCircle2} label="সম্পূর্ণ পেমেন্ট" value={toBengaliNum(summary.fullPayCount)} variant="success" />
        <SummaryCard icon={Clock} label="শুধু ডেলিভারি চার্জ" value={toBengaliNum(summary.deliveryOnly)} variant="warning" />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-sm" />)}
        </div>
      ) : !paged.length ? (
        <div className="bg-surface dark:bg-card rounded-sm border border-border/30 p-16 text-center text-muted-foreground shadow-sm">
          কোনো অগ্রিম পেমেন্ট পাওয়া যায়নি।
        </div>
      ) : (
        <div className="bg-surface dark:bg-card rounded-sm border border-border/30 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/40">
                  <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 w-[50px]">#</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">কাস্টমার</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">ফোন</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">পেমেন্ট মেথড</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">TrxID</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">পেমেন্ট ধরন</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">অগ্রিম</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">মোট মূল্য</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">বাকি</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">তারিখ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((o: any, index: number) => {
                  const serial = page * pageSize + index + 1;
                  const remaining = o.total_price - o.advance_amount;
                  const pt = paymentTypeLabels[o.payment_type] || { text: o.payment_type, style: 'bg-muted/10 text-muted-foreground border-border/20' };
                  return (
                    <TableRow key={o.id} className="hover:bg-gold/[0.03] transition-colors border-b border-border/20">
                      <TableCell className="font-inter text-xs font-semibold text-muted-foreground tabular-nums">{toBengaliNum(serial)}</TableCell>
                      <TableCell>
                        <p className="font-medium text-sm text-foreground">{o.customer_name}</p>
                        <p className="text-[11px] text-muted-foreground">{o.watch_model}</p>
                      </TableCell>
                      <TableCell className="font-inter text-sm tabular-nums text-foreground">{o.phone}</TableCell>
                      <TableCell>
                        <span className="text-xs font-semibold uppercase text-gold">
                          {o.payment_method === 'bkash' ? 'বিকাশ' : o.payment_method === 'nagad' ? 'নগদ' : 'রকেট'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="bg-gold/10 text-gold px-2 py-1 rounded-sm text-[11px] font-mono font-semibold border border-gold/15">
                          {o.trx_id}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-sm border ${pt.style}`}>
                          {pt.text}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-success font-inter text-sm">৳{formatBengaliPrice(o.advance_amount)}</TableCell>
                      <TableCell className="font-semibold text-gold font-inter text-sm">৳{formatBengaliPrice(o.total_price)}</TableCell>
                      <TableCell>
                        {remaining > 0 ? (
                          <span className="font-semibold text-warning font-inter text-sm">৳{formatBengaliPrice(remaining)}</span>
                        ) : (
                          <span className="text-success text-[11px] font-semibold">পরিশোধিত ✓</span>
                        )}
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground font-inter tabular-nums">
                        {new Date(o.created_at).toLocaleDateString('bn-BD')}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
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

const variantMap: Record<string, { bg: string; color: string }> = {
  info: { bg: 'bg-info/10', color: 'text-info' },
  accent: { bg: 'bg-accent/10', color: 'text-accent' },
  success: { bg: 'bg-success/10', color: 'text-success' },
  warning: { bg: 'bg-warning/10', color: 'text-warning' },
};

const SummaryCard = ({ icon: Icon, label, value, variant }: { icon: any; label: string; value: string; variant: string }) => {
  const v = variantMap[variant] || variantMap.info;
  return (
    <div className="bg-surface dark:bg-card rounded-sm border border-border/30 p-4 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-sm flex items-center justify-center ${v.bg}`}>
          <Icon className={`h-4 w-4 ${v.color}`} />
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className="text-lg font-bold font-inter text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default AdvancePaymentsPage;
