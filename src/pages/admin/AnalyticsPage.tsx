import { useMemo, useState } from 'react';
import { useOrdersLite, useProductsLite } from '@/hooks/useSupabaseData';
import { formatBengaliPrice, toBengaliNum } from '@/lib/bengali';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Users, Wallet, Crown, MapPin, ArrowUp, ArrowDown, Minus, Package, Globe } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['hsl(var(--accent))', 'hsl(var(--info))', 'hsl(var(--success))', 'hsl(var(--warning))', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const tooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '4px',
  fontSize: '12px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
};

const AnalyticsPage = () => {
  const { data: orders, isLoading: ordersLoading } = useOrdersLite();
  const { data: products, isLoading: productsLoading } = useProductsLite();
  const [range, setRange] = useState<7 | 14 | 30 | 90>(30);

  const isLoading = ordersLoading || productsLoading;

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range);
    return orders.filter(o => new Date(o.created_at) >= cutoff);
  }, [orders, range]);

  // ===== Summary Stats =====
  const avgOrderValue = useMemo(() => {
    if (!filteredOrders.length) return 0;
    return Math.round(filteredOrders.reduce((s, o) => s + o.total_price, 0) / filteredOrders.length);
  }, [filteredOrders]);

  const totalRevenue = useMemo(() => filteredOrders.reduce((s, o) => s + o.total_price, 0), [filteredOrders]);

  // ===== Daily Revenue Trend =====
  const dailyData = useMemo(() => {
    if (!orders) return [];
    return Array.from({ length: range }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (range - 1 - i));
      const dateStr = d.toDateString();
      const dayOrders = filteredOrders.filter(o => new Date(o.created_at).toDateString() === dateStr);
      return {
        day: d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }),
        revenue: dayOrders.reduce((s, o) => s + o.total_price, 0),
        orders: dayOrders.length,
      };
    });
  }, [orders, filteredOrders, range]);

  // ===== TOP SELLING PRODUCTS =====
  const topProducts = useMemo(() => {
    if (!filteredOrders.length) return [];
    const map: Record<string, number> = {};
    filteredOrders
      .filter(o => o.status !== 'cancelled' && o.status !== 'returned')
      .forEach(o => { map[o.watch_model] = (map[o.watch_model] || 0) + o.quantity; });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, sold], i) => {
        const product = products?.find(p => p.name === name);
        return {
          name: name.length > 20 ? name.slice(0, 20) + '…' : name,
          fullName: name,
          sold,
          thumbnail: product?.thumbnail_url || product?.image_urls?.[0] || null,
          rank: i + 1,
        };
      });
  }, [filteredOrders, products]);

  // ===== GEOGRAPHIC / CITY-WISE =====
  const cityData = useMemo(() => {
    if (!filteredOrders.length) return [];
    const map: Record<string, number> = {};
    filteredOrders.forEach(o => {
      const addr = (o.address || '').toLowerCase();
      let city = o.delivery_location === 'dhaka' ? 'ঢাকা' : 'অন্যান্য';
      
      // Try to extract city/area from address
      const cityPatterns: [RegExp, string][] = [
        [/ঢাকা|dhaka/i, 'ঢাকা'],
        [/চট্টগ্রাম|chittagong|chattogram/i, 'চট্টগ্রাম'],
        [/রাজশাহী|rajshahi/i, 'রাজশাহী'],
        [/খুলনা|khulna/i, 'খুলনা'],
        [/সিলেট|sylhet/i, 'সিলেট'],
        [/বরিশাল|barisal|barishal/i, 'বরিশাল'],
        [/রংপুর|rangpur/i, 'রংপুর'],
        [/ময়মনসিংহ|mymensingh/i, 'ময়মনসিংহ'],
        [/কুমিল্লা|comilla|cumilla/i, 'কুমিল্লা'],
        [/গাজীপুর|gazipur/i, 'গাজীপুর'],
        [/নারায়ণগঞ্জ|narayanganj/i, 'নারায়ণগঞ্জ'],
        [/টাঙ্গাইল|tangail/i, 'টাঙ্গাইল'],
      ];
      
      for (const [pattern, name] of cityPatterns) {
        if (pattern.test(addr)) {
          city = name;
          break;
        }
      }
      
      map[city] = (map[city] || 0) + 1;
    });
    
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  // ===== MONTHLY NET PROFIT =====
  const monthlyProfit = useMemo(() => {
    if (!orders?.length || !products?.length) return { current: null, previous: null };
    
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    
    const calcMonth = (startDate: Date, endDate: Date) => {
      const monthOrders = orders.filter(o => {
        const d = new Date(o.created_at);
        return d >= startDate && d <= endDate;
      });
      
      const totalSales = monthOrders.reduce((s, o) => s + o.total_price, 0);
      const activeOrders = monthOrders.filter(o => o.status !== 'cancelled' && o.status !== 'returned');
      const totalSourcing = activeOrders.reduce((s, o) => {
        const product = products?.find(p => p.name === o.watch_model);
        return s + ((product?.sourcing_cost || 0) * o.quantity);
      }, 0);
      const totalDelivery = monthOrders.reduce((s, o) => s + o.delivery_charge, 0);
      const returnedOrders = monthOrders.filter(o => o.status === 'returned');
      const returnLoss = returnedOrders.reduce((s, o) => s + o.delivery_charge, 0);
      const netProfit = totalSales - totalSourcing - totalDelivery - returnLoss;
      const orderCount = monthOrders.length;
      
      return { totalSales, totalSourcing, totalDelivery, returnLoss, netProfit, orderCount };
    };
    
    return {
      current: calcMonth(currentMonthStart, now),
      previous: calcMonth(prevMonthStart, prevMonthEnd),
    };
  }, [orders, products]);

  const profitChange = useMemo(() => {
    if (!monthlyProfit.current || !monthlyProfit.previous || !monthlyProfit.previous.netProfit) return null;
    const pct = Math.round(((monthlyProfit.current.netProfit - monthlyProfit.previous.netProfit) / Math.abs(monthlyProfit.previous.netProfit)) * 100);
    return pct;
  }, [monthlyProfit]);

  // ===== Payment Method Pie =====
  const paymentData = useMemo(() => {
    if (!filteredOrders.length) return [];
    const map: Record<string, number> = {};
    filteredOrders.forEach(o => { map[o.payment_method] = (map[o.payment_method] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  // ===== REFERRER SOURCE ANALYTICS =====
  const referrerData = useMemo(() => {
    if (!filteredOrders.length) return [];
    const map: Record<string, { count: number; revenue: number }> = {};
    filteredOrders.forEach(o => {
      const src = (o as any).referrer_source || 'অজানা';
      if (!map[src]) map[src] = { count: 0, revenue: 0 };
      map[src].count++;
      map[src].revenue += o.total_price;
    });
    return Object.entries(map)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, { count, revenue }]) => ({ name, count, revenue }));
  }, [filteredOrders]);

  // ===== DIVISION-WISE ANALYTICS =====
  const divisionData = useMemo(() => {
    if (!filteredOrders.length) return [];
    const map: Record<string, number> = {};
    filteredOrders.forEach(o => {
      const div = (o as any).division || 'অজানা';
      map[div] = (map[div] || 0) + 1;
    });
    const total = filteredOrders.length;
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value, pct: Math.round((value / total) * 100) }));
  }, [filteredOrders]);

  // ===== DISTRICT-WISE TOP 10 =====
  const districtData = useMemo(() => {
    if (!filteredOrders.length) return [];
    const map: Record<string, number> = {};
    filteredOrders.forEach(o => {
      const dist = (o as any).district;
      if (dist) map[dist] = (map[dist] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name: name.length > 15 ? name.slice(0, 15) + '…' : name, fullName: name, value }));
  }, [filteredOrders]);

  // ===== Order Status Distribution =====
  const statusData = useMemo(() => {
    if (!filteredOrders.length) return [];
    const statusMap: Record<string, { label: string; count: number }> = {
      pending: { label: 'পেন্ডিং', count: 0 },
      processing: { label: 'প্রসেসিং', count: 0 },
      shipped: { label: 'শিপড', count: 0 },
      completed: { label: 'সম্পন্ন', count: 0 },
      cancelled: { label: 'ক্যানসেল', count: 0 },
      returned: { label: 'রিটার্ন', count: 0 },
    };
    filteredOrders.forEach(o => {
      if (statusMap[o.status]) statusMap[o.status].count++;
    });
    return Object.entries(statusMap)
      .filter(([, v]) => v.count > 0)
      .map(([, v]) => ({ name: v.label, value: v.count }));
  }, [filteredOrders]);

  return (
    <div className="space-y-5 w-full">
      {/* Header */}
      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-4 md:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">বিস্তারিত অ্যানালিটিক্স</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">বিক্রয়, প্রোডাক্ট ও লাভের বিশ্লেষণ</p>
          </div>
          <div className="flex gap-0.5 bg-muted/30 border border-border/40 rounded-sm p-1">
            {([7, 14, 30, 90] as const).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all duration-200 ${
                  range === r ? 'gradient-gold text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {toBengaliNum(r)} দিন
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-sm" />)
        ) : (
          <>
            <MiniStat icon={Wallet} label="গড় অর্ডার মূল্য" value={`৳${formatBengaliPrice(avgOrderValue)}`} variant="accent" />
            <MiniStat icon={Users} label="মোট অর্ডার" value={toBengaliNum(filteredOrders.length)} variant="info" />
            <MiniStat icon={TrendingUp} label="মোট রাজস্ব" value={`৳${formatBengaliPrice(totalRevenue)}`} variant="success" />
          </>
        )}
      </div>

      {/* ===== TOP SELLING PRODUCTS ===== */}
      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5 md:p-6">
        <div className="flex items-center gap-2 mb-1">
          <Crown className="h-4 w-4 text-accent" />
          <h3 className="font-semibold text-sm text-foreground">টপ সেলিং প্রোডাক্ট</h3>
        </div>
        <p className="text-[11px] text-muted-foreground mb-5">সবচেয়ে বেশি বিক্রিত ৫টি প্রোডাক্ট</p>
        {isLoading ? <Skeleton className="h-[280px] rounded-sm" /> : topProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">এই সময়ে কোনো বিক্রয় ডেটা নেই</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Bar Chart */}
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fontFamily: 'Inter' }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} width={120} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${toBengaliNum(value)} পিস`, 'বিক্রি']} />
                <Bar dataKey="sold" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>

            {/* Ranked List */}
            <div className="space-y-2.5">
              {topProducts.map((p) => (
                <div key={p.fullName} className="flex items-center gap-3 p-2.5 rounded-sm border border-border/20 bg-muted/5 hover:bg-muted/20 transition-colors">
                  <div className="w-7 h-7 rounded-sm bg-accent/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-accent">{toBengaliNum(p.rank)}</span>
                  </div>
                  {p.thumbnail ? (
                    <img src={p.thumbnail} alt={p.fullName} className="w-9 h-9 rounded-sm object-cover border border-border/20" />
                  ) : (
                    <div className="w-9 h-9 rounded-sm bg-muted/30 flex items-center justify-center">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{p.fullName}</p>
                    <p className="text-[10px] text-muted-foreground">{toBengaliNum(p.sold)} পিস বিক্রি</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===== GEOGRAPHIC + ORDER STATUS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* City-wise Pie Chart */}
        <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5 md:p-6">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-info" />
            <h3 className="font-semibold text-sm text-foreground">এলাকা ভিত্তিক অর্ডার</h3>
          </div>
          <p className="text-[11px] text-muted-foreground mb-5">কোন শহর/এলাকা থেকে বেশি অর্ডার</p>
          {isLoading ? <Skeleton className="h-[280px] rounded-sm" /> : cityData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">ডেটা নেই</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={cityData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value">
                    {cityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${toBengaliNum(value)} অর্ডার`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
                {cityData.map((d, i) => (
                  <span key={d.name} className="text-sm tracking-wide text-muted-foreground flex items-center gap-1.5" style={{ letterSpacing: '0.02em' }}>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    {d.name} ({toBengaliNum(d.value)})
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Order Status Pie */}
        <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5 md:p-6">
          <h3 className="font-semibold text-sm text-foreground mb-1">অর্ডার স্ট্যাটাস বিভাজন</h3>
          <p className="text-[11px] text-muted-foreground mb-5">স্ট্যাটাস অনুযায়ী অর্ডার সংখ্যা</p>
          {isLoading ? <Skeleton className="h-[280px] rounded-sm" /> : statusData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">ডেটা নেই</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value">
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [`${toBengaliNum(value)}`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
                {statusData.map((d, i) => (
                  <span key={d.name} className="text-sm tracking-wide text-muted-foreground flex items-center gap-1.5" style={{ letterSpacing: '0.02em' }}>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    {d.name} ({toBengaliNum(d.value)})
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===== LOCATION ANALYTICS (Division + District) ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Division-wise Pie */}
        <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5 md:p-6">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-accent" />
            <h3 className="font-semibold text-sm text-foreground">বিভাগ ভিত্তিক সেলস</h3>
          </div>
          <p className="text-[11px] text-muted-foreground mb-5">কোন বিভাগ থেকে কত % অর্ডার</p>
          {isLoading ? <Skeleton className="h-[280px] rounded-sm" /> : divisionData.length === 0 || (divisionData.length === 1 && divisionData[0].name === 'অজানা') ? (
            <p className="text-sm text-muted-foreground text-center py-10">লোকেশন ডেটা এখনো জমা হয়নি</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={divisionData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value">
                    {divisionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [`${toBengaliNum(value)} অর্ডার`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {divisionData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-sm" style={{ letterSpacing: '0.02em' }}>
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      {d.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-inter font-semibold text-foreground">{toBengaliNum(d.value)}</span>
                      <span className="text-muted-foreground/70 w-8 text-right font-inter">{toBengaliNum(d.pct)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* District-wise Top 10 Bar */}
        <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5 md:p-6">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-success" />
            <h3 className="font-semibold text-sm text-foreground">টপ ১০ জেলা</h3>
          </div>
          <p className="text-[11px] text-muted-foreground mb-5">সবচেয়ে বেশি অর্ডার আসা জেলা</p>
          {isLoading ? <Skeleton className="h-[280px] rounded-sm" /> : districtData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">লোকেশন ডেটা এখনো জমা হয়নি</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={districtData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fontFamily: 'Inter' }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${toBengaliNum(value)} অর্ডার`, 'অর্ডার']} />
                <Bar dataKey="value" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ===== MONTHLY NET PROFIT COMPARISON ===== */}
      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5 md:p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            <h3 className="font-semibold text-sm text-foreground">মাসিক নেট প্রফিট তুলনা</h3>
          </div>
          {profitChange !== null && (
            <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-sm ${
              profitChange > 0 ? 'bg-success/10 text-success' : profitChange < 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted/30 text-muted-foreground'
            }`}>
              {profitChange > 0 ? <ArrowUp className="h-3 w-3" /> : profitChange < 0 ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {toBengaliNum(Math.abs(profitChange))}%
            </div>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mb-5">এই মাস vs গত মাস · সূত্র: আয় - (সোর্সিং + ডেলিভারি + রিটার্ন লস)</p>
        
        {isLoading ? <Skeleton className="h-[200px] rounded-sm" /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Month */}
            <div className="rounded-sm border border-border/20 p-4">
              <p className="text-xs font-medium text-foreground mb-3">এই মাস</p>
              {monthlyProfit.current && (
                <div className="space-y-2.5">
                  <ProfitRow label="মোট আয়" value={monthlyProfit.current.totalSales} color="text-foreground" />
                  <ProfitRow label="সোর্সিং খরচ" value={-monthlyProfit.current.totalSourcing} color="text-destructive" />
                  <ProfitRow label="ডেলিভারি খরচ" value={-monthlyProfit.current.totalDelivery} color="text-destructive" />
                  <ProfitRow label="রিটার্ন লস" value={-monthlyProfit.current.returnLoss} color="text-destructive" />
                  <div className="border-t border-border/30 pt-2.5">
                    <ProfitRow
                      label="নেট প্রফিট"
                      value={monthlyProfit.current.netProfit}
                      color={monthlyProfit.current.netProfit >= 0 ? 'text-success' : 'text-destructive'}
                      bold
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{toBengaliNum(monthlyProfit.current.orderCount)} টি অর্ডার</p>
                </div>
              )}
            </div>

            {/* Previous Month */}
            <div className="rounded-sm border border-border/20 p-4 bg-muted/5">
              <p className="text-xs font-medium text-muted-foreground mb-3">গত মাস</p>
              {monthlyProfit.previous && (
                <div className="space-y-2.5">
                  <ProfitRow label="মোট আয়" value={monthlyProfit.previous.totalSales} color="text-foreground" />
                  <ProfitRow label="সোর্সিং খরচ" value={-monthlyProfit.previous.totalSourcing} color="text-destructive" />
                  <ProfitRow label="ডেলিভারি খরচ" value={-monthlyProfit.previous.totalDelivery} color="text-destructive" />
                  <ProfitRow label="রিটার্ন লস" value={-monthlyProfit.previous.returnLoss} color="text-destructive" />
                  <div className="border-t border-border/30 pt-2.5">
                    <ProfitRow
                      label="নেট প্রফিট"
                      value={monthlyProfit.previous.netProfit}
                      color={monthlyProfit.previous.netProfit >= 0 ? 'text-success' : 'text-destructive'}
                      bold
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{toBengaliNum(monthlyProfit.previous.orderCount)} টি অর্ডার</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== REVENUE TREND ===== */}
      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5 md:p-6">
        <h3 className="font-semibold text-sm text-foreground mb-1">আয়ের ট্রেন্ড</h3>
        <p className="text-[11px] text-muted-foreground mb-5">দৈনিক আয় · {toBengaliNum(range)} দিন</p>
        {isLoading ? <Skeleton className="h-[300px] rounded-sm" /> : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} interval={range > 14 ? 4 : 1} />
              <YAxis tick={{ fontSize: 11, fontFamily: 'Inter' }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`৳${value.toLocaleString()}`, 'আয়']} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--accent))" strokeWidth={2.5} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Orders Bar */}
        <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5 md:p-6">
          <h3 className="font-semibold text-sm text-foreground mb-1">দৈনিক অর্ডার</h3>
          <p className="text-[11px] text-muted-foreground mb-5">প্রতিদিন কতটি অর্ডার এসেছে</p>
          {isLoading ? <Skeleton className="h-[250px] rounded-sm" /> : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} interval={range > 14 ? 4 : 1} />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="orders" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} barSize={range > 14 ? 12 : 24} name="অর্ডার" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Payment Method Pie */}
        <PieCard title="পেমেন্ট মেথড" data={paymentData} isLoading={isLoading} />
      </div>
    </div>
  );
};

// ===== Sub-components =====

const ProfitRow = ({ label, value, color, bold }: { label: string; value: number; color: string; bold?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className={`text-[11px] ${bold ? 'font-semibold' : ''} text-muted-foreground`}>{label}</span>
    <span className={`text-${bold ? 'sm' : 'xs'} ${bold ? 'font-bold' : 'font-medium'} font-inter ${color}`}>
      {value < 0 ? '-' : ''}৳{formatBengaliPrice(Math.abs(value))}
    </span>
  </div>
);

const PieCard = ({ title, data, isLoading }: { title: string; data: { name: string; value: number }[]; isLoading: boolean }) => (
  <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5 md:p-6">
    <h3 className="font-semibold text-sm text-foreground mb-4">{title}</h3>
    {isLoading ? <Skeleton className="h-[250px] rounded-sm" /> : data.length === 0 ? (
      <p className="text-sm text-muted-foreground text-center py-10">ডেটা নেই</p>
    ) : (
      <>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value">
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
          {data.map((d, i) => (
            <span key={d.name} className="text-sm tracking-wide text-muted-foreground flex items-center gap-1.5" style={{ letterSpacing: '0.02em' }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
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
    <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-sm flex items-center justify-center ${v.bg}`}>
          <Icon className={`h-4 w-4 ${v.color}`} />
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold font-inter text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
