import { useMemo, useState } from 'react';
import { useOrders } from '@/hooks/useSupabaseData';
import { formatBengaliPrice, toBengaliNum } from '@/lib/bengali';
import { Search, Users, Crown, UserCheck, UserPlus } from 'lucide-react';
import AdminPagination from '@/components/admin/AdminPagination';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';

type CustomerData = {
  name: string;
  phone: string;
  email: string | null;
  totalSpent: number;
  orderCount: number;
  lastOrder: string;
  label: 'VIP' | 'Regular' | 'New';
};

const labelConfig = {
  VIP: { text: 'ভিআইপি', icon: Crown, bg: 'bg-accent/10 text-accent border-accent/20' },
  Regular: { text: 'রেগুলার', icon: UserCheck, bg: 'bg-info/10 text-info border-info/20' },
  New: { text: 'নতুন', icon: UserPlus, bg: 'bg-success/10 text-success border-success/20' },
};

const CustomersPage = () => {
  const { data: orders, isLoading } = useOrders();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const customers = useMemo(() => {
    if (!orders) return [];
    const map = new Map<string, CustomerData>();
    orders.forEach(o => {
      const key = o.phone;
      const existing = map.get(key);
      if (existing) {
        existing.totalSpent += o.total_price;
        existing.orderCount += 1;
        if (new Date(o.created_at) > new Date(existing.lastOrder)) {
          existing.lastOrder = o.created_at;
        }
      } else {
        map.set(key, {
          name: o.customer_name,
          phone: o.phone,
          email: o.customer_email,
          totalSpent: o.total_price,
          orderCount: 1,
          lastOrder: o.created_at,
          label: 'New',
        });
      }
    });
    const result = Array.from(map.values());
    result.forEach(c => {
      if (c.totalSpent >= 10000 || c.orderCount >= 5) c.label = 'VIP';
      else if (c.orderCount >= 2) c.label = 'Regular';
      else c.label = 'New';
    });
    result.sort((a, b) => b.totalSpent - a.totalSpent);
    return result;
  }, [orders]);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [customers, search]);

  const summary = useMemo(() => ({
    total: customers.length,
    vip: customers.filter(c => c.label === 'VIP').length,
    regular: customers.filter(c => c.label === 'Regular').length,
    newCount: customers.filter(c => c.label === 'New').length,
  }), [customers]);

  return (
    <div className="space-y-5 w-full">
      {/* Bento Header */}
      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-4 md:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">কাস্টমার তালিকা</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">মোট {toBengaliNum(summary.total)} জন কাস্টমার</p>
          </div>
          <div className="flex items-center gap-2 bg-muted/30 border border-border/40 rounded-sm px-3 py-2 min-w-[240px]">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="নাম বা ফোন দিয়ে খুঁজুন..."
              className="bg-transparent border-none outline-none w-full text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard icon={Users} label="মোট কাস্টমার" value={toBengaliNum(summary.total)} variant="info" />
        <SummaryCard icon={Crown} label="ভিআইপি" value={toBengaliNum(summary.vip)} variant="accent" />
        <SummaryCard icon={UserCheck} label="রেগুলার" value={toBengaliNum(summary.regular)} variant="success" />
        <SummaryCard icon={UserPlus} label="নতুন" value={toBengaliNum(summary.newCount)} variant="warning" />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-sm" />)}
        </div>
      ) : !filtered.length ? (
        <div className="bg-surface dark:bg-card rounded-sm border border-border/30 p-16 text-center text-muted-foreground shadow-sm">
          কোনো কাস্টমার পাওয়া যায়নি।
        </div>
      ) : (
        <div className="bg-surface dark:bg-card rounded-sm border border-border/30 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/40">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">কাস্টমার</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">ফোন</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center">অর্ডার</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">মোট খরচ</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">সর্বশেষ অর্ডার</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">লেবেল</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(page * pageSize, (page + 1) * pageSize).map((c) => {
                  const lbl = labelConfig[c.label];
                  return (
                    <TableRow key={c.phone} className="hover:bg-gold/[0.03] transition-colors border-b border-border/30">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm text-foreground">{c.name}</p>
                          {c.email && <p className="text-[11px] text-muted-foreground">{c.email}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="font-inter text-sm tabular-nums text-foreground">{c.phone}</TableCell>
                      <TableCell className="text-center font-inter text-sm font-medium text-foreground">{toBengaliNum(c.orderCount)}</TableCell>
                      <TableCell className="font-semibold text-accent font-inter text-sm">৳{formatBengaliPrice(c.totalSpent)}</TableCell>
                      <TableCell className="text-[11px] text-muted-foreground font-inter tabular-nums">
                        {new Date(c.lastOrder).toLocaleDateString('bn-BD')}
                      </TableCell>
                      <TableCell>
                        <span className={`text-[10px] font-medium px-2.5 py-1 rounded-sm border inline-flex items-center gap-1 ${lbl.bg}`}>
                          <lbl.icon className="h-3 w-3" />
                          {lbl.text}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <AdminPagination
            currentPage={page}
            totalPages={Math.ceil(filtered.length / pageSize)}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
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
          <p className="text-xl font-bold font-inter text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default CustomersPage;
