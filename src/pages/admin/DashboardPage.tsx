import { useOrders, useProducts } from '@/hooks/useSupabaseData';
import { formatBengaliPrice, toBengaliNum } from '@/lib/bengali';
import { TrendingUp, ShoppingCart, Clock, DollarSign, Package, ArrowUpRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line,
} from 'recharts';

const DashboardPage = () => {
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: products, isLoading: productsLoading } = useProducts();

  const stats = useMemo(() => {
    if (!orders) return null;
    const now = new Date();
    const today = now.toDateString();
    const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === today);
    const totalRevenue = orders.reduce((s, o) => s + o.total_price, 0);
    const todayRevenue = todayOrders.reduce((s, o) => s + o.total_price, 0);
    const pending = orders.filter(o => o.status === 'pending').length;
    return { total: orders.length, pending, todayRevenue, totalRevenue, todayOrders: todayOrders.length };
  }, [orders]);

  const sparkData = useMemo(() => {
    if (!orders) return { revenue: [], orders: [] };
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
    const revenueArr = last7.map(date => {
      const dateStr = date.toDateString();
      const dayOrders = orders.filter(o => new Date(o.created_at).toDateString() === dateStr);
      return { v: dayOrders.reduce((s, o) => s + o.total_price, 0) };
    });
    const ordersArr = last7.map(date => {
      const dateStr = date.toDateString();
      return { v: orders.filter(o => new Date(o.created_at).toDateString() === dateStr).length };
    });
    return { revenue: revenueArr, orders: ordersArr };
  }, [orders]);

  const chartData = useMemo(() => {
    if (!orders) return [];
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
    return last7.map(date => {
      const dateStr = date.toDateString();
      const dayOrders = orders.filter(o => new Date(o.created_at).toDateString() === dateStr);
      return {
        day: date.toLocaleDateString('bn-BD', { weekday: 'short' }),
        revenue: dayOrders.reduce((s, o) => s + o.total_price, 0),
        orders: dayOrders.length,
      };
    });
  }, [orders]);

  const statusData = useMemo(() => {
    if (!orders) return [];
    const counts: Record<string, number> = {};
    orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [orders]);

  const isLoading = ordersLoading || productsLoading;

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[140px] rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              icon={ShoppingCart} label="মোট অর্ডার"
              value={toBengaliNum(stats?.total ?? 0)}
              sub={`আজ +${toBengaliNum(stats?.todayOrders ?? 0)}`}
              variant="info"
              sparkData={sparkData.orders}
            />
            <StatCard
              icon={Clock} label="পেন্ডিং"
              value={toBengaliNum(stats?.pending ?? 0)}
              sub="অপেক্ষমাণ অর্ডার"
              variant="warning"
              sparkData={[]}
            />
            <StatCard
              icon={DollarSign} label="আজকের আয়"
              value={`৳${formatBengaliPrice(stats?.todayRevenue ?? 0)}`}
              sub="আজকের মোট"
              variant="success"
              sparkData={sparkData.revenue}
            />
            <StatCard
              icon={Package} label="মোট আয়"
              value={`৳${formatBengaliPrice(stats?.totalRevenue ?? 0)}`}
              sub={`${toBengaliNum(products?.length ?? 0)} প্রোডাক্ট`}
              variant="accent"
              sparkData={sparkData.revenue}
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 md:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-sm text-foreground">সাপ্তাহিক আয়</h3>
              <p className="text-[11px] text-muted-foreground">শেষ ৭ দিনের আয়ের ট্রেন্ড</p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-success font-medium">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span className="font-inter">+12.5%</span>
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-[250px] rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fontFamily: 'Hind Siliguri' }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontFamily: 'Inter' }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  }}
                  formatter={(value: number) => [`৳${value.toLocaleString()}`, 'আয়']}
                />
                <Area
                  type="monotone" dataKey="revenue"
                  stroke="hsl(var(--accent))" strokeWidth={2.5}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass-card rounded-2xl p-5 md:p-6">
          <div className="mb-5">
            <h3 className="font-semibold text-sm text-foreground">অর্ডার স্ট্যাটাস</h3>
            <p className="text-[11px] text-muted-foreground">স্ট্যাটাস অনুযায়ী বিভাজন</p>
          </div>
          {isLoading ? (
            <Skeleton className="h-[250px] rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="status" type="category"
                  tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={80}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => ({ pending: 'পেন্ডিং', processing: 'প্রসেসিং', shipped: 'শিপড', completed: 'সম্পন্ন' }[v] || v)}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20} fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="glass-card rounded-2xl p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm text-foreground">সাম্প্রতিক অর্ডার</h3>
          <span className="text-[11px] text-muted-foreground">সর্বশেষ ৫টি</span>
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-1">
            {orders?.slice(0, 5).map(o => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors duration-200">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{o.customer_name}</p>
                    <p className="text-[11px] text-muted-foreground">{o.watch_model}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 flex items-center gap-3">
                  <p className="text-sm font-semibold font-inter text-accent">৳{formatBengaliPrice(o.total_price)}</p>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

type StatVariant = 'info' | 'warning' | 'success' | 'accent';

const variantStyles: Record<StatVariant, { iconBg: string; iconColor: string; sparkColor: string }> = {
  info: { iconBg: 'bg-info/10', iconColor: 'text-info', sparkColor: 'hsl(var(--info))' },
  warning: { iconBg: 'bg-warning/10', iconColor: 'text-warning', sparkColor: 'hsl(var(--warning))' },
  success: { iconBg: 'bg-success/10', iconColor: 'text-success', sparkColor: 'hsl(var(--success))' },
  accent: { iconBg: 'bg-accent/10', iconColor: 'text-accent', sparkColor: 'hsl(var(--accent))' },
};

const StatCard = ({ icon: Icon, label, value, sub, variant, sparkData }: {
  icon: any; label: string; value: string; sub: string;
  variant: StatVariant; sparkData: { v: number }[];
}) => {
  const v = variantStyles[variant];
  return (
    <div className="glass-card rounded-2xl p-5 group hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${v.iconBg}`}>
          <Icon className={`h-5 w-5 ${v.iconColor}`} />
        </div>
        {sparkData.length > 0 && (
          <div className="w-20 h-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="v" stroke={v.sparkColor} strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold font-inter tracking-tight text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label} · {sub}</p>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    pending: 'bg-warning/10 text-warning border-warning/20',
    processing: 'bg-info/10 text-info border-info/20',
    shipped: 'bg-accent/10 text-accent border-accent/20',
    completed: 'bg-success/10 text-success border-success/20',
  };
  const labels: Record<string, string> = {
    pending: 'পেন্ডিং', processing: 'প্রসেসিং', shipped: 'শিপড', completed: 'সম্পন্ন',
  };
  return (
    <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${styles[status] || 'bg-muted text-muted-foreground'}`}>
      {labels[status] || status}
    </span>
  );
};

export default DashboardPage;
