import { useOrders, useProducts } from '@/hooks/useSupabaseData';
import { formatBengaliPrice, toBengaliNum } from '@/lib/bengali';
import { TrendingUp, TrendingDown, ShoppingCart, Clock, DollarSign, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
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
            <Skeleton key={i} className="h-[120px] rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              icon={ShoppingCart} label="মোট অর্ডার"
              value={toBengaliNum(stats?.total ?? 0)}
              change={`+${toBengaliNum(stats?.todayOrders ?? 0)} আজ`}
              trend="up" color="bg-blue-500/10 text-blue-600"
            />
            <StatCard
              icon={Clock} label="পেন্ডিং অর্ডার"
              value={toBengaliNum(stats?.pending ?? 0)}
              change="অপেক্ষমাণ"
              trend="neutral" color="bg-amber-500/10 text-amber-600"
            />
            <StatCard
              icon={DollarSign} label="আজকের আয়"
              value={`৳${formatBengaliPrice(stats?.todayRevenue ?? 0)}`}
              change="আজকের মোট"
              trend="up" color="bg-emerald-500/10 text-emerald-600"
            />
            <StatCard
              icon={Package} label="মোট আয়"
              value={`৳${formatBengaliPrice(stats?.totalRevenue ?? 0)}`}
              change={`${toBengaliNum(products?.length ?? 0)} প্রোডাক্ট`}
              trend="up" color="bg-accent/10 text-accent"
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-sm">সাপ্তাহিক আয়</h3>
              <p className="text-xs text-muted-foreground">শেষ ৭ দিনের আয়ের ট্রেন্ড</p>
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-[250px] rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(41, 52%, 48%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(41, 52%, 48%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(0, 0%, 60%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(0, 0%, 60%)" />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(0, 0%, 90%)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`৳${value.toLocaleString()}`, 'আয়']}
                />
                <Area
                  type="monotone" dataKey="revenue"
                  stroke="hsl(41, 52%, 48%)" strokeWidth={2.5}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order Status */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-sm">অর্ডার স্ট্যাটাস</h3>
            <p className="text-xs text-muted-foreground">স্ট্যাটাস অনুযায়ী বিভাজন</p>
          </div>
          {isLoading ? (
            <Skeleton className="h-[250px] rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(0, 0%, 60%)" />
                <YAxis
                  dataKey="status" type="category"
                  tick={{ fontSize: 11 }} stroke="hsl(0, 0%, 60%)" width={80}
                  tickFormatter={(v) => ({ pending: 'পেন্ডিং', processing: 'প্রসেসিং', shipped: 'শিপড', completed: 'সম্পন্ন' }[v] || v)}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(0, 0%, 90%)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="hsl(41, 52%, 48%)" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-semibold text-sm mb-4">সাম্প্রতিক অর্ডার</h3>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {orders?.slice(0, 5).map(o => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{o.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{o.watch_model}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
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

const StatCard = ({ icon: Icon, label, value, change, trend, color }: {
  icon: any; label: string; value: string; change: string;
  trend: 'up' | 'down' | 'neutral'; color: string;
}) => (
  <div className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      {trend === 'up' && <TrendingUp className="h-4 w-4 text-emerald-500" />}
      {trend === 'down' && <TrendingDown className="h-4 w-4 text-destructive" />}
    </div>
    <p className="mt-3 text-2xl font-bold font-inter tracking-tight">{value}</p>
    <p className="text-xs text-muted-foreground mt-1">{label} · {change}</p>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    processing: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700',
    completed: 'bg-emerald-100 text-emerald-700',
  };
  const labels: Record<string, string> = {
    pending: 'পেন্ডিং', processing: 'প্রসেসিং', shipped: 'শিপড', completed: 'সম্পন্ন',
  };
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${styles[status] || 'bg-muted text-muted-foreground'}`}>
      {labels[status] || status}
    </span>
  );
};

export default DashboardPage;
