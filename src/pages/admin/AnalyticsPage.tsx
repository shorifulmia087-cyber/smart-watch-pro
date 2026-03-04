import { useMemo, useState } from 'react';
import { useOrders } from '@/hooks/useSupabaseData';
import { formatBengaliPrice, toBengaliNum } from '@/lib/bengali';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['hsl(41, 52%, 48%)', 'hsl(220, 70%, 55%)', 'hsl(280, 55%, 55%)', 'hsl(150, 55%, 45%)'];

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">বিস্তারিত অ্যানালিটিক্স</h2>
          <p className="text-xs text-muted-foreground">বিক্রয় ও ব্যবহারকারীর আচরণ</p>
        </div>
        <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
          {([7, 14, 30] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                range === r ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {toBengaliNum(r)} দিন
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
        ) : (
          <>
            <MiniStat label="গড় অর্ডার মূল্য" value={`৳${formatBengaliPrice(avgOrderValue)}`} />
            <MiniStat label="মোট অর্ডার সংখ্যা" value={toBengaliNum(orders?.length ?? 0)} />
            <MiniStat label="মোট রাজস্ব" value={`৳${formatBengaliPrice(orders?.reduce((s, o) => s + o.total_price, 0) ?? 0)}`} />
          </>
        )}
      </div>

      {/* Revenue Trend */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-semibold text-sm mb-1">আয়ের ট্রেন্ড</h3>
        <p className="text-xs text-muted-foreground mb-6">দৈনিক আয় ও অর্ডার সংখ্যা</p>
        {isLoading ? <Skeleton className="h-[300px] rounded-xl" /> : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(41, 52%, 48%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(41, 52%, 48%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(0, 0%, 60%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(0, 0%, 60%)" />
              <Tooltip contentStyle={{ background: 'hsl(0,0%,100%)', border: '1px solid hsl(0,0%,90%)', borderRadius: '12px', fontSize: '12px' }}
                formatter={(value: number, name: string) => [`৳${value.toLocaleString()}`, name === 'revenue' ? 'আয়' : 'অর্ডার']}
              />
              <Area type="monotone" dataKey="revenue" stroke="hsl(41,52%,48%)" strokeWidth={2.5} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Orders per day + distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold text-sm mb-1">দৈনিক অর্ডার</h3>
          <p className="text-xs text-muted-foreground mb-6">প্রতিদিন কতটি অর্ডার এসেছে</p>
          {isLoading ? <Skeleton className="h-[250px] rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(0,0%,60%)" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(0,0%,60%)" allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(0,0%,100%)', border: '1px solid hsl(0,0%,90%)', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="orders" fill="hsl(220, 70%, 55%)" radius={[6, 6, 0, 0]} barSize={24} name="অর্ডার" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-semibold text-sm mb-4">পেমেন্ট মেথড</h3>
            {isLoading ? <Skeleton className="h-[180px] rounded-xl" /> : (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={paymentData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={4} dataKey="value">
                      {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2">
                  {paymentData.map((d, i) => (
                    <span key={d.name} className="text-[10px] flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      {d.name} ({toBengaliNum(d.value)})
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-semibold text-sm mb-4">ডেলিভারি অঞ্চল</h3>
            {isLoading ? <Skeleton className="h-[180px] rounded-xl" /> : (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={locationData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={4} dataKey="value">
                      {locationData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2">
                  {locationData.map((d, i) => (
                    <span key={d.name} className="text-[10px] flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      {d.name} ({toBengaliNum(d.value)})
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MiniStat = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-card rounded-2xl border border-border p-4">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-xl font-bold font-inter mt-1">{value}</p>
  </div>
);

export default AnalyticsPage;
