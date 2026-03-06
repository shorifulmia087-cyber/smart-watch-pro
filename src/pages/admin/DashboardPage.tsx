import { useOrders, useProducts } from '@/hooks/useSupabaseData';
import { formatBengaliPrice, toBengaliNum } from '@/lib/bengali';
import { TrendingUp, ShoppingCart, Clock, DollarSign, Package, ArrowUpRight, CalendarIcon, Box, Truck, CheckCircle2, XCircle, AlertTriangle, RotateCcw, Calculator } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo, useState } from 'react';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { bn } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line,
} from 'recharts';

type DateRange = { from: Date; to: Date };

const presets = [
  { label: 'আজ', days: 0 },
  { label: '৭ দিন', days: 7 },
  { label: '১৪ দিন', days: 14 },
  { label: '৩০ দিন', days: 30 },
] as const;

const DashboardPage = () => {
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: products, isLoading: productsLoading } = useProducts();
  const [activePreset, setActivePreset] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [calendarOpen, setCalendarOpen] = useState(false);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => {
      const d = new Date(o.created_at);
      return isWithinInterval(d, { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) });
    });
  }, [orders, dateRange]);

  const handlePreset = (index: number) => {
    setActivePreset(index);
    const p = presets[index];
    if (p.days === 0) {
      setDateRange({ from: new Date(), to: new Date() });
    } else {
      setDateRange({ from: subDays(new Date(), p.days), to: new Date() });
    }
  };

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = filteredOrders.filter(o => new Date(o.created_at).toDateString() === today);
    const totalRevenue = filteredOrders.reduce((s, o) => s + o.total_price, 0);
    const todayRevenue = todayOrders.reduce((s, o) => s + o.total_price, 0);
    const pending = filteredOrders.filter(o => o.status === 'pending').length;
    const shipped = filteredOrders.filter(o => o.status === 'shipped').length;
    const completed = filteredOrders.filter(o => o.status === 'completed').length;
    const cancelled = filteredOrders.filter(o => o.status === 'cancelled').length;
    const returned = filteredOrders.filter(o => o.status === 'returned').length;
    const totalProducts = products?.length ?? 0;
    const inStockProducts = products?.filter(p => p.stock_status === 'in_stock').length ?? 0;
    const totalSourcingCost = filteredOrders
      .filter(o => o.status !== 'cancelled' && o.status !== 'returned')
      .reduce((s, o) => {
        const product = products?.find(p => p.name === o.watch_model);
        const cost = (product as any)?.sourcing_cost || 0;
        return s + (cost * o.quantity);
      }, 0);
    const grossProfit = totalRevenue - totalSourcingCost;
    const returnRate = filteredOrders.length > 0 ? Math.round((returned / filteredOrders.length) * 100) : 0;
    const todaySourcing = todayOrders
      .filter(o => o.status !== 'cancelled' && o.status !== 'returned')
      .reduce((s, o) => {
        const product = products?.find(p => p.name === o.watch_model);
        const cost = (product as any)?.sourcing_cost || 0;
        return s + (cost * o.quantity);
      }, 0);
    const todayDeliveryCost = todayOrders.reduce((s, o) => s + o.delivery_charge, 0);
    const estimatedDailyProfit = todayRevenue - todaySourcing - todayDeliveryCost;
    return { total: filteredOrders.length, pending, shipped, completed, cancelled, returned, returnRate, todayRevenue, totalRevenue, todayOrders: todayOrders.length, totalProducts, inStockProducts, grossProfit, estimatedDailyProfit };
  }, [filteredOrders, products]);

  const dayCount = useMemo(() => {
    const diff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(diff, 1);
  }, [dateRange]);

  const sparkData = useMemo(() => {
    const days = Math.min(dayCount, 7);
    const last = Array.from({ length: days }, (_, i) => {
      const d = new Date(dateRange.to);
      d.setDate(d.getDate() - (days - 1 - i));
      return d;
    });
    const revenueArr = last.map(date => {
      const dateStr = date.toDateString();
      const dayOrders = filteredOrders.filter(o => new Date(o.created_at).toDateString() === dateStr);
      return { v: dayOrders.reduce((s, o) => s + o.total_price, 0) };
    });
    const ordersArr = last.map(date => {
      const dateStr = date.toDateString();
      return { v: filteredOrders.filter(o => new Date(o.created_at).toDateString() === dateStr).length };
    });
    return { revenue: revenueArr, orders: ordersArr };
  }, [filteredOrders, dayCount, dateRange]);

  const chartData = useMemo(() => {
    const days = Math.min(dayCount, 30);
    const last = Array.from({ length: days }, (_, i) => {
      const d = new Date(dateRange.to);
      d.setDate(d.getDate() - (days - 1 - i));
      return d;
    });
    return last.map(date => {
      const dateStr = date.toDateString();
      const dayOrders = filteredOrders.filter(o => new Date(o.created_at).toDateString() === dateStr);
      return {
        day: date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }),
        revenue: dayOrders.reduce((s, o) => s + o.total_price, 0),
        orders: dayOrders.length,
      };
    });
  }, [filteredOrders, dayCount, dateRange]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredOrders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [filteredOrders]);

  const isLoading = ordersLoading || productsLoading;

  const outOfStockProducts = useMemo(() => {
    return products?.filter(p => p.stock_status !== 'in_stock') || [];
  }, [products]);

  return (
    <div className="space-y-5 w-full">
      {/* Inventory Alert */}
      {outOfStockProducts.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-sm bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">ইনভেন্টরি এলার্ট!</p>
            <p className="text-xs text-destructive/80 mt-0.5">
              {outOfStockProducts.map(p => p.name).join(', ')} — স্টক শেষ হয়ে গেছে। অনুগ্রহ করে স্টক আপডেট করুন।
            </p>
          </div>
        </div>
      )}

      {/* Header with Date Filter */}
      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-4 md:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">ড্যাশবোর্ড</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {format(dateRange.from, 'd MMM', { locale: bn })} — {format(dateRange.to, 'd MMM, yyyy', { locale: bn })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 bg-muted/30 rounded-sm p-1 border border-border/30">
              {presets.map((p, i) => (
                <button
                  key={p.label}
                  onClick={() => handlePreset(i)}
                  className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition-all duration-200 ${
                    activePreset === i ? 'gradient-gold text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={activePreset === -1 ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-8 gap-2 rounded-sm text-xs font-semibold transition-all duration-200",
                    activePreset === -1
                      ? "gradient-gold text-white shadow-[0_2px_8px_hsl(var(--gold)/0.3)] hover:opacity-90"
                      : "border-dashed border-border/50 hover:border-solid hover:bg-muted/60"
                  )}
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {activePreset === -1 ? (
                    <span>
                      {format(dateRange.from, 'd MMM', { locale: bn })} - {format(dateRange.to, 'd MMM', { locale: bn })}
                    </span>
                  ) : (
                    'কাস্টম'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-sm border border-border/30 shadow-xl" align="end" sideOffset={8}>
                <div className="p-4 pb-2 border-b border-border/30">
                  <h4 className="text-sm font-semibold text-foreground">তারিখ নির্বাচন করুন</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">শুরু ও শেষ তারিখ সিলেক্ট করুন</p>
                </div>
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from) {
                      setDateRange({ from: range.from, to: range.to || range.from });
                      setActivePreset(-1);
                      if (range.to) setCalendarOpen(false);
                    }
                  }}
                  numberOfMonths={2}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
                {activePreset === -1 && (
                  <div className="px-4 py-2.5 border-t border-border/30 bg-muted/30 rounded-b-sm">
                    <p className="text-[11px] text-muted-foreground text-center">
                      📅 {format(dateRange.from, 'd MMMM yyyy', { locale: bn })} — {format(dateRange.to, 'd MMMM yyyy', { locale: bn })}
                    </p>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-sm" />
          ))
        ) : (
          <>
            <StatCard icon={ShoppingCart} label="মোট অর্ডার" value={toBengaliNum(stats.total)} sub={`আজ +${toBengaliNum(stats.todayOrders)}`} variant="info" sparkData={sparkData.orders} />
            <StatCard icon={Clock} label="পেন্ডিং" value={toBengaliNum(stats.pending)} sub="অপেক্ষমাণ" variant="warning" sparkData={[]} />
            <StatCard icon={Truck} label="ডেলিভারিতে" value={toBengaliNum(stats.shipped)} sub="In Transit" variant="accent" sparkData={[]} />
            <StatCard icon={CheckCircle2} label="সম্পন্ন" value={toBengaliNum(stats.completed)} sub="কমপ্লিট" variant="success" sparkData={[]} />
            <StatCard icon={XCircle} label="ক্যানসেল" value={toBengaliNum(stats.cancelled)} sub="বাতিল" variant="warning" sparkData={[]} />
            <StatCard icon={DollarSign} label="আজকের আয়" value={`৳${formatBengaliPrice(stats.todayRevenue)}`} sub="আজকের মোট" variant="success" sparkData={sparkData.revenue} />
            <StatCard icon={Package} label="মোট আয়" value={`৳${formatBengaliPrice(stats.totalRevenue)}`} sub={`${toBengaliNum(dayCount)} দিনের`} variant="accent" sparkData={sparkData.revenue} />
            <StatCard icon={TrendingUp} label="গ্রস প্রফিট" value={`৳${formatBengaliPrice(stats.grossProfit)}`} sub="আয় - সোর্সিং" variant="success" sparkData={[]} />
            <StatCard icon={RotateCcw} label="রিটার্ন" value={toBengaliNum(stats.returned)} sub={`${toBengaliNum(stats.returnRate)}% রেট`} variant="warning" sparkData={[]} />
            <StatCard icon={Box} label="প্রোডাক্ট" value={toBengaliNum(stats.totalProducts)} sub={`${toBengaliNum(stats.inStockProducts)} স্টকে`} variant="info" sparkData={[]} />
          </>
        )}
      </div>

      {/* Daily Profit Summary */}
      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-sm bg-accent/10 flex items-center justify-center">
            <Calculator className="h-4 w-4 text-accent" />
          </div>
          <h3 className="font-semibold text-sm text-foreground">আজকের আনুমানিক প্রফিট</h3>
        </div>
        {isLoading ? (
          <Skeleton className="h-20 rounded-sm" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-success/5 rounded-sm border border-success/10">
              <p className="text-[11px] text-muted-foreground">আজকের আয়</p>
              <p className="text-lg font-bold font-inter text-success">৳{formatBengaliPrice(stats.todayRevenue)}</p>
            </div>
            <div className="text-center p-3 bg-destructive/5 rounded-sm border border-destructive/10">
              <p className="text-[11px] text-muted-foreground">সোর্সিং + ডেলিভারি</p>
              <p className="text-lg font-bold font-inter text-destructive">−৳{formatBengaliPrice(stats.todayRevenue - stats.estimatedDailyProfit)}</p>
            </div>
            <div className="text-center p-3 bg-warning/5 rounded-sm border border-warning/10">
              <p className="text-[11px] text-muted-foreground">রিটার্ন রেট</p>
              <p className="text-lg font-bold font-inter text-warning">{toBengaliNum(stats.returnRate)}%</p>
            </div>
            <div className="text-center p-3 bg-accent/5 rounded-sm border border-accent/10">
              <p className="text-[11px] text-muted-foreground">আনুমানিক প্রফিট</p>
              <p className={`text-lg font-bold font-inter ${stats.estimatedDailyProfit >= 0 ? 'text-accent' : 'text-destructive'}`}>
                ৳{formatBengaliPrice(Math.abs(stats.estimatedDailyProfit))}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-sm text-foreground">আয়ের ট্রেন্ড</h3>
              <p className="text-[11px] text-muted-foreground">নির্বাচিত সময়ের আয়</p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-success font-medium bg-success/10 px-2.5 py-1 rounded-sm border border-success/20">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span className="font-inter">{toBengaliNum(stats.total)} অর্ডার</span>
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-[250px] rounded-sm" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--gold))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--gold))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fontFamily: 'Hind Siliguri' }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontFamily: 'Inter' }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '4px',
                    fontSize: '12px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  }}
                  formatter={(value: number) => [`৳${value.toLocaleString()}`, 'আয়']}
                />
                <Area
                  type="monotone" dataKey="revenue"
                  stroke="hsl(var(--gold))" strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5">
          <div className="mb-5">
            <h3 className="font-semibold text-sm text-foreground">অর্ডার স্ট্যাটাস</h3>
            <p className="text-[11px] text-muted-foreground">স্ট্যাটাস অনুযায়ী বিভাজন</p>
          </div>
          {isLoading ? (
            <Skeleton className="h-[250px] rounded-sm" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="status" type="category"
                  tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={80}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => ({ pending: 'পেন্ডিং', processing: 'প্রসেসিং', shipped: 'শিপড', completed: 'সম্পন্ন', cancelled: 'ক্যানসেল', returned: 'রিটার্ন' }[v] || v)}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '4px',
                    fontSize: '12px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20} fill="hsl(var(--gold))" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-foreground">সাম্প্রতিক অর্ডার</h3>
            <p className="text-[10px] text-muted-foreground">সর্বশেষ ৫টি</p>
          </div>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-sm" />)}
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filteredOrders.slice(0, 5).map(o => (
              <div key={o.id} className="flex items-center justify-between px-5 py-3 hover:bg-gold/[0.03] transition-colors duration-200">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-sm bg-muted/50 flex items-center justify-center shrink-0">
                    <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
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
    <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-4 hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${v.iconBg}`}>
          <Icon className={`h-4 w-4 ${v.iconColor}`} />
        </div>
        {sparkData.length > 0 && (
          <div className="w-16 h-7">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="v" stroke={v.sparkColor} strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <p className="mt-2.5 text-2xl font-bold font-inter tracking-tight text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label} · {sub}</p>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    pending: 'bg-warning/10 text-warning border-warning/20',
    processing: 'bg-info/10 text-info border-info/20',
    shipped: 'bg-accent/10 text-accent border-accent/20',
    completed: 'bg-success/10 text-success border-success/20',
    cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
    returned: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  };
  const labels: Record<string, string> = {
    pending: 'পেন্ডিং', processing: 'প্রসেসিং', shipped: 'শিপড', completed: 'সম্পন্ন', cancelled: 'ক্যানসেল', returned: 'রিটার্ন',
  };
  return (
    <span className={`text-[10px] font-medium px-2.5 py-1 rounded-sm border ${styles[status] || 'bg-muted text-muted-foreground'}`}>
      {labels[status] || status}
    </span>
  );
};

export default DashboardPage;
