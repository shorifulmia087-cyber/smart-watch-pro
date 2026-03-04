import { useState, useMemo } from 'react';
import { useOrders, useUpdateOrderStatus } from '@/hooks/useSupabaseData';
import { formatBengaliPrice, toBengaliNum } from '@/lib/bengali';
import { Search, Filter, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import type { Database } from '@/integrations/supabase/types';

type OrderStatus = Database['public']['Enums']['order_status'];

const statusLabels: Record<OrderStatus, string> = {
  pending: 'পেন্ডিং', processing: 'প্রসেসিং', shipped: 'শিপড', completed: 'সম্পন্ন',
};

const statusStyles: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  processing: 'bg-blue-100 text-blue-700 border-blue-200',
  shipped: 'bg-purple-100 text-purple-700 border-purple-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const OrdersPage = () => {
  const [filter, setFilter] = useState<OrderStatus | undefined>();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 15;
  const { data: orders, isLoading } = useOrders(filter);
  const updateStatus = useUpdateOrderStatus();

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
          <h2 className="text-lg font-semibold">সকল অর্ডার</h2>
          <p className="text-xs text-muted-foreground">মোট {toBengaliNum(filtered.length)} টি অর্ডার</p>
        </div>
        <div className="flex items-center gap-2 bg-card rounded-xl px-3 py-2 border border-border min-w-[240px]">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="নাম, ফোন বা TrxID দিয়ে খুঁজুন..."
            className="bg-transparent border-none outline-none w-full text-sm"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {[undefined, 'pending', 'processing', 'shipped', 'completed'].map((s) => (
          <button
            key={s ?? 'all'}
            onClick={() => { setFilter(s as OrderStatus | undefined); setPage(0); }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
              filter === s
                ? 'bg-foreground text-background border-foreground'
                : 'bg-card text-muted-foreground border-border hover:border-foreground/20'
            }`}
          >
            {s ? statusLabels[s as OrderStatus] : 'সব'}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      ) : !paged.length ? (
        <div className="bg-card rounded-2xl p-16 text-center text-muted-foreground border border-border">
          কোনো অর্ডার পাওয়া যায়নি।
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-xs font-semibold">কাস্টমার</TableHead>
                  <TableHead className="text-xs font-semibold">ফোন</TableHead>
                  <TableHead className="text-xs font-semibold">মডেল</TableHead>
                  <TableHead className="text-xs font-semibold text-center">পরিমাণ</TableHead>
                  <TableHead className="text-xs font-semibold">মোট</TableHead>
                  <TableHead className="text-xs font-semibold">TrxID</TableHead>
                  <TableHead className="text-xs font-semibold">এলাকা</TableHead>
                  <TableHead className="text-xs font-semibold">তারিখ</TableHead>
                  <TableHead className="text-xs font-semibold">স্ট্যাটাস</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((o) => (
                  <TableRow key={o.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{o.customer_name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{o.address}</p>
                        {o.customer_email && <p className="text-xs text-accent truncate">{o.customer_email}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="font-inter text-sm tabular-nums">{o.phone}</TableCell>
                    <TableCell className="text-sm">{o.watch_model}</TableCell>
                    <TableCell className="text-center font-inter text-sm">{toBengaliNum(o.quantity)}</TableCell>
                    <TableCell className="font-semibold text-accent font-inter text-sm">
                      ৳{formatBengaliPrice(o.total_price)}
                    </TableCell>
                    <TableCell>
                      {o.trx_id ? (
                        <span className="bg-accent/10 text-accent px-2 py-1 rounded-lg text-xs font-mono font-semibold">
                          {o.trx_id}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">COD</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {o.delivery_location === 'dhaka' ? 'ঢাকা' : 'ঢাকার বাইরে'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-inter">
                      {new Date(o.created_at).toLocaleDateString('bn-BD')}
                    </TableCell>
                    <TableCell>
                      <select
                        value={o.status}
                        onChange={(e) => updateStatus.mutate({ id: o.id, status: e.target.value as OrderStatus })}
                        className={`text-xs font-medium px-3 py-1.5 rounded-full border cursor-pointer appearance-none ${statusStyles[o.status]}`}
                      >
                        {Object.entries(statusLabels).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                পৃষ্ঠা {toBengaliNum(page + 1)} / {toBengaliNum(totalPages)}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 rounded-lg text-xs bg-muted hover:bg-muted/80 disabled:opacity-40 transition-colors"
                >
                  পূর্ববর্তী
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 rounded-lg text-xs bg-muted hover:bg-muted/80 disabled:opacity-40 transition-colors"
                >
                  পরবর্তী
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
