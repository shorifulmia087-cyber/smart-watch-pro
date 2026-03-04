import { useMemo, useState } from 'react';
import { useOrders } from '@/hooks/useSupabaseData';
import { formatBengaliPrice, toBengaliNum } from '@/lib/bengali';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Users, Wallet } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['hsl(var(--accent))', 'hsl(var(--info))', 'hsl(var(--success))', 'hsl(var(--warning))'];

const tooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '12px',
  fontSize: '12px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
};

const AnalyticsPage = () => {
  const { data: orders, isLoading } = useOrders();
  const [range, setRange] = useState<7 | 14 | 30>(7);

  const dailyData = useMemo(() => {
    if (!orders) return [];
    return Array.from({ length: range }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (range - 1 - i));
      const dateStr = d.toDateString();
      const dayOrders = orders.filter(o => new Date(o.created_at).toDateString() === dateStr);
      return {
        day: d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }),
        revenue: dayOrders.reduce((s, o) => s + o.total_price, 0),
        orders: dayOrders.length,
      };
    });
  }, [orders, range]);

  const paymentData = useMemo(() => {
    if (!orders) return [];
    const map: Record<string, number> = {};
    orders.forEach(o => { map[o.payment_method] = (map[o.payment_method] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const locationData = useMemo(() => {
    if (!orders) return [];
    const dhaka = orders.filter(o => o.delivery_location === 'dhaka').length;
    const outside = orders.length - dhaka;
    return [{ name: 'ঢাকা', value: dhaka }, { name: 'ঢাকার বাইরে', value: outside }];
  }, [orders]);

  const avgOrderValue = useMemo(() => {
    if (!orders?.length) return 0;
    return Math.round(orders.reduce((s, o) => s + o.total_price, 0) / orders.length);
  }, [orders]);

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">বিস্তারিত অ্যানালিটিক্স</h2>
          <p className="text-[11px] text-muted-foreground">বিক্রয় ও ব্যবহারকারীর আচরণ</p>
        </div>
        <div className="flex gap-0.5 glass-card rounded-xl p-1">
          {([7, 14, 30] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                range === r ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {toBengaliNum(r)} দিন
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : (
          <>
            <MiniStat icon={Wallet} label="গড় অর্ডার মূল্য" value={`৳${formatBengaliPrice(avgOrderValue)}`} variant="accent" />
            <MiniStat icon={Users} label="মোট অর্ডার সংখ্যা" value={toBengaliNum(orders?.length ?? 0)} variant="info" />
            <MiniStat icon={TrendingUp} label="মোট রাজস্ব" value={`৳${formatBengaliPrice(orders?.reduce((s, o) => s + o.total_price, 0) ?? 0)}`} variant="success" />
          </>
        )}
      </div>

      {/* Revenue Trend */}
      <div className="glass-card rounded-2xl p-5 md:p-6">
        <h3 className="font-semibold text-sm text-foreground mb-1">আয়ের ট্রেন্ড</h3>
        <p className="text-[11px] text-muted-foreground mb-5">দৈনিক আয় ও অর্ডার সংখ্যা</p>
        {isLoading ? <Skeleton className="h-[300px] rounded-xl" /> : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fontFamily: 'Inter' }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [`৳${value.toLocaleString()}`, name === 'revenue' ? 'আয়' : 'অর্ডার']} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--accent))" strokeWidth={2.5} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5 md:p-6">
          <h3 className="font-semibold text-sm text-foreground mb-1">দৈনিক অর্ডার</h3>
          <p className="text-[11px] text-muted-foreground mb-5">প্রতিদিন কতটি অর্ডার এসেছে</p>
          {isLoading ? <Skeleton className="h-[250px] rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="orders" fill="hsl(var(--info))" radius={[6, 6, 0, 0]} barSize={24} name="অর্ডার" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PieCard title="পেমেন্ট মেথড" data={paymentData} isLoading={isLoading} />
          <PieCard title="ডেলিভারি অঞ্চল" data={locationData} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

const PieCard = ({ title, data, isLoading }: { title: string; data: { name: string; value: number }[]; isLoading: boolean }) => (
  <div className="glass-card rounded-2xl p-5 md:p-6">
    <h3 className="font-semibold text-sm text-foreground mb-4">{title}</h3>
    {isLoading ? <Skeleton className="h-[180px] rounded-xl" /> : (
      <>
        <ResponsiveContainer width="100%" height={140}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={4} dataKey="value">
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-2 mt-2">
          {data.map((d, i) => (
            <span key={d.name} className="text-[10px] text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              {d.name} ({toBengaliNum(d.value)})
            </span>
          ))}
        </div>
      </>
    )}
  </div>
);

const variantMap: Record<string, { bg: string; color: string }> = {
  accent: { bg: 'bg-accent/10', color: 'text-accent' },
  info: { bg: 'bg-info/10', color: 'text-info' },
  success: { bg: 'bg-success/10', color: 'text-success' },
};

const MiniStat = ({ icon: Icon, label, value, variant }: { icon: any; label: string; value: string; variant: string }) => {
  const v = variantMap[variant] || variantMap.accent;
  return (
    <div className="glass-card rounded-2xl p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${v.bg}`}>
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

export default AnalyticsPage;
