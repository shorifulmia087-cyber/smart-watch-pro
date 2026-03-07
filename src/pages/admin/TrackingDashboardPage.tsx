import { useMemo } from 'react';
import { useOrdersLite } from '@/hooks/useSupabaseData';
import { toBengaliNum, formatBengaliPrice } from '@/lib/bengali';
import { Package, Truck, CheckCircle2, XCircle, RotateCcw, Clock, MapPin, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type ShipmentStatus = 'booked' | 'in_transit' | 'delivered' | 'returned' | 'not_booked';

const statusConfig: Record<ShipmentStatus, { label: string; icon: typeof Package; color: string; bg: string }> = {
  booked: { label: 'বুক হয়েছে', icon: Package, color: 'text-info', bg: 'bg-info/10 border-info/20' },
  in_transit: { label: 'ট্রানজিটে', icon: Truck, color: 'text-accent', bg: 'bg-accent/10 border-accent/20' },
  delivered: { label: 'ডেলিভার্ড', icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10 border-success/20' },
  returned: { label: 'রিটার্ন', icon: RotateCcw, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
  not_booked: { label: 'বুক হয়নি', icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted border-border' },
};

const TrackingDashboardPage = () => {
  const { data: orders, isLoading } = useOrdersLite();

  const stats = useMemo(() => {
    if (!orders) return null;
    const bookedOrders = orders.filter(o => o.courier_booked);
    const notBookedOrders = orders.filter(o => !o.courier_booked);
    const shippedOrders = orders.filter(o => o.status === 'shipped' && o.courier_booked);
    const deliveredOrders = orders.filter(o => o.status === 'completed' && o.courier_booked);
    const returnedOrders = orders.filter(o => o.status === 'returned' && o.courier_booked);
    const byProvider: Record<string, number> = {};
    bookedOrders.forEach(o => {
      const p = o.courier_provider || 'redx';
      byProvider[p] = (byProvider[p] || 0) + 1;
    });
    const dhakaCount = bookedOrders.filter(o => o.delivery_location === 'dhaka').length;
    const outsideCount = bookedOrders.filter(o => o.delivery_location !== 'dhaka').length;
    return {
      total: orders.length, booked: bookedOrders.length, notBooked: notBookedOrders.length,
      inTransit: shippedOrders.length, delivered: deliveredOrders.length, returned: returnedOrders.length,
      byProvider, dhakaCount, outsideCount,
      totalRevenue: bookedOrders.reduce((s, o) => s + o.total_price, 0),
      deliveryRate: bookedOrders.length > 0 ? Math.round((deliveredOrders.length / bookedOrders.length) * 100) : 0,
    };
  }, [orders]);

  const recentShipments = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => o.courier_booked).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20);
  }, [orders]);

  const getShipmentStatus = (order: typeof recentShipments[0]): ShipmentStatus => {
    if (!order.courier_booked) return 'not_booked';
    if (order.status === 'returned') return 'returned';
    if (order.status === 'completed') return 'delivered';
    if (order.status === 'shipped') return 'in_transit';
    return 'booked';
  };

  if (isLoading) {
    return (
      <div className="space-y-5 w-full">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-sm" />)}
        </div>
        <Skeleton className="h-96 rounded-sm" />
      </div>
    );
  }

  return (
    <div className="space-y-5 w-full">
      {/* Bento Header */}
      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-4 md:p-5">
        <h2 className="text-lg font-bold text-foreground">ট্র্যাকিং ড্যাশবোর্ড</h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">সকল শিপমেন্টের লাইভ স্ট্যাটাস</p>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'মোট বুকড', value: stats.booked, icon: Package, color: 'text-info', bgColor: 'bg-info/10' },
            { label: 'ট্রানজিটে', value: stats.inTransit, icon: Truck, color: 'text-accent', bgColor: 'bg-accent/10' },
            { label: 'ডেলিভার্ড', value: stats.delivered, icon: CheckCircle2, color: 'text-success', bgColor: 'bg-success/10' },
            { label: 'রিটার্ন', value: stats.returned, icon: XCircle, color: 'text-destructive', bgColor: 'bg-destructive/10' },
          ].map(card => (
            <div key={card.label} className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-sm ${card.bgColor} flex items-center justify-center`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{card.label}</span>
              </div>
              <p className={`text-2xl font-bold ${card.color}`}>{toBengaliNum(card.value)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Provider & Location Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5 md:col-span-2">
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-4 text-foreground">
              <Truck className="h-4 w-4 text-gold" /> কুরিয়ার প্রোভাইডার ব্রেকডাউন
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'redx', name: 'RedX', color: 'bg-destructive/10 text-destructive border-destructive/20' },
                { id: 'pathao', name: 'Pathao', color: 'bg-success/10 text-success border-success/20' },
                { id: 'steadfast', name: 'Steadfast', color: 'bg-info/10 text-info border-info/20' },
              ].map(p => (
                <div key={p.id} className={`rounded-sm border p-4 text-center ${p.color}`}>
                  <p className="text-2xl font-bold">{toBengaliNum(stats.byProvider[p.id] || 0)}</p>
                  <p className="text-xs font-medium mt-1">{p.name}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3 bg-muted/30 rounded-sm p-3">
              <TrendingUp className="h-4 w-4 text-success" />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-foreground">ডেলিভারি রেট</span>
                  <span className="text-xs font-semibold text-success">{toBengaliNum(stats.deliveryRate)}%</span>
                </div>
                <div className="w-full bg-border rounded-sm h-2">
                  <div className="bg-success h-2 rounded-sm transition-all" style={{ width: `${stats.deliveryRate}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5">
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-4 text-foreground">
              <MapPin className="h-4 w-4 text-gold" /> এলাকা ভিত্তিক
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-muted/30 rounded-sm p-3">
                <span className="text-sm font-medium text-foreground">ঢাকা</span>
                <span className="text-sm font-bold text-accent">{toBengaliNum(stats.dhakaCount)}</span>
              </div>
              <div className="flex items-center justify-between bg-muted/30 rounded-sm p-3">
                <span className="text-sm font-medium text-foreground">ঢাকার বাইরে</span>
                <span className="text-sm font-bold text-accent">{toBengaliNum(stats.outsideCount)}</span>
              </div>
              <div className="border-t border-border/30 pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">বুক হয়নি</span>
                  <span className="text-sm font-semibold text-warning">{toBengaliNum(stats.notBooked)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">মোট রেভিনিউ (বুকড)</span>
                <span className="text-sm font-semibold text-accent">৳{formatBengaliPrice(stats.totalRevenue)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Shipments Table */}
      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border/30">
          <h3 className="font-semibold text-sm text-foreground">সাম্প্রতিক শিপমেন্ট</h3>
          <p className="text-[10px] text-muted-foreground">সর্বশেষ ২০ টি বুকড অর্ডার</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border/40">
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">কাস্টমার</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">ট্র্যাকিং ID</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">কুরিয়ার</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">এলাকা</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">মোট</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">স্ট্যাটাস</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">তারিখ</th>
              </tr>
            </thead>
            <tbody>
              {recentShipments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">কোনো শিপমেন্ট পাওয়া যায়নি</td>
                </tr>
              ) : (
                recentShipments.map(order => {
                  const shipStatus = getShipmentStatus(order);
                  const config = statusConfig[shipStatus];
                  const Icon = config.icon;
                  const providerName = order.courier_provider === 'pathao' ? 'Pathao' : order.courier_provider === 'steadfast' ? 'Steadfast' : 'RedX';
                  return (
                    <tr key={order.id} className="border-b border-border/30 hover:bg-gold/[0.03] transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{order.customer_name}</p>
                        <p className="text-[10px] text-muted-foreground">{order.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        {order.tracking_id ? (
                          <span className="bg-success/10 text-success px-2 py-1 rounded-sm text-[11px] font-mono font-semibold">{order.tracking_id}</span>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><span className="text-xs font-medium text-foreground">{providerName}</span></td>
                      <td className="px-4 py-3 text-xs text-foreground">{order.delivery_location === 'dhaka' ? 'ঢাকা' : 'ঢাকার বাইরে'}</td>
                      <td className="px-4 py-3 font-semibold text-accent text-sm">৳{formatBengaliPrice(order.total_price)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-medium border ${config.bg}`}>
                          <Icon className={`h-3 w-3 ${config.color}`} />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-muted-foreground font-inter tabular-nums">
                        {new Date(order.created_at).toLocaleDateString('bn-BD')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TrackingDashboardPage;
