import { useMemo } from 'react';
import { useOrders } from '@/hooks/useSupabaseData';
import { formatBengaliPrice, toBengaliNum } from '@/lib/bengali';
import { DollarSign, CheckCircle2, Clock, AlertTriangle, Truck, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const CourierPaymentsPage = () => {
  const { data: orders, isLoading } = useOrders();

  const stats = useMemo(() => {
    if (!orders) return null;

    const bookedOrders = orders.filter((o: any) => o.courier_booked);
    const codOrders = bookedOrders.filter((o: any) => o.payment_method === 'cod');
    
    const delivered = codOrders.filter((o: any) => o.status === 'completed');
    const inTransit = codOrders.filter((o: any) => o.status === 'shipped');
    const pending = codOrders.filter((o: any) => o.status === 'pending' || o.status === 'processing');
    const returned = codOrders.filter((o: any) => o.status === 'returned');

    const totalCollectable = codOrders.reduce((s: number, o: any) => s + o.total_price, 0);
    const deliveredAmount = delivered.reduce((s: number, o: any) => s + o.total_price, 0);
    const inTransitAmount = inTransit.reduce((s: number, o: any) => s + o.total_price, 0);
    const returnedAmount = returned.reduce((s: number, o: any) => s + o.total_price, 0);
    const pendingAmount = pending.reduce((s: number, o: any) => s + o.total_price, 0);

    // Group by provider
    const byProvider: Record<string, { total: number; delivered: number; pending: number; returned: number; count: number }> = {};
    codOrders.forEach((o: any) => {
      const p = o.courier_provider || 'unknown';
      if (!byProvider[p]) byProvider[p] = { total: 0, delivered: 0, pending: 0, returned: 0, count: 0 };
      byProvider[p].total += o.total_price;
      byProvider[p].count++;
      if (o.status === 'completed') byProvider[p].delivered += o.total_price;
      else if (o.status === 'returned') byProvider[p].returned += o.total_price;
      else byProvider[p].pending += o.total_price;
    });

    return {
      totalCollectable, deliveredAmount, inTransitAmount, returnedAmount, pendingAmount,
      deliveredCount: delivered.length,
      inTransitCount: inTransit.length,
      pendingCount: pending.length,
      returnedCount: returned.length,
      totalCOD: codOrders.length,
      byProvider,
    };
  }, [orders]);

  if (isLoading) {
    return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;
  }

  if (!stats) return null;

  const providerNames: Record<string, string> = { redx: 'RedX', pathao: 'Pathao', steadfast: 'Steadfast', unknown: 'অজানা' };

  return (
    <div className="space-y-6 max-w-[1000px]">
      <div>
        <h2 className="text-lg font-semibold text-foreground">কুরিয়ার পেমেন্ট</h2>
        <p className="text-xs text-muted-foreground">COD কালেকশন ও ডিসবার্সমেন্ট ট্র্যাকিং</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 space-y-1">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-[11px] text-muted-foreground">মোট COD</span>
          </div>
          <p className="text-lg font-bold text-foreground">{formatBengaliPrice(stats.totalCollectable)}</p>
          <p className="text-[10px] text-muted-foreground">{toBengaliNum(stats.totalCOD)} টি অর্ডার</p>
        </div>

        <div className="bg-card rounded-xl border border-success/20 p-4 space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-[11px] text-muted-foreground">ডেলিভারি সম্পন্ন</span>
          </div>
          <p className="text-lg font-bold text-success">{formatBengaliPrice(stats.deliveredAmount)}</p>
          <p className="text-[10px] text-muted-foreground">{toBengaliNum(stats.deliveredCount)} টি অর্ডার</p>
        </div>

        <div className="bg-card rounded-xl border border-warning/20 p-4 space-y-1">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-warning" />
            <span className="text-[11px] text-muted-foreground">ট্রানজিটে</span>
          </div>
          <p className="text-lg font-bold text-warning">{formatBengaliPrice(stats.inTransitAmount)}</p>
          <p className="text-[10px] text-muted-foreground">{toBengaliNum(stats.inTransitCount)} টি অর্ডার</p>
        </div>

        <div className="bg-card rounded-xl border border-destructive/20 p-4 space-y-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-[11px] text-muted-foreground">রিটার্ন</span>
          </div>
          <p className="text-lg font-bold text-destructive">{formatBengaliPrice(stats.returnedAmount)}</p>
          <p className="text-[10px] text-muted-foreground">{toBengaliNum(stats.returnedCount)} টি অর্ডার</p>
        </div>
      </div>

      {/* Provider Breakdown */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          প্রোভাইডার ভিত্তিক ব্রেকডাউন
        </h3>
        <div className="space-y-3">
          {Object.entries(stats.byProvider).map(([provider, data]) => {
            const deliveryRate = data.total > 0 ? Math.round((data.delivered / data.total) * 100) : 0;
            return (
              <div key={provider} className="border border-border/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{providerNames[provider] || provider}</span>
                  <span className="text-xs text-muted-foreground">{toBengaliNum(data.count)} টি অর্ডার</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">কালেকশন</p>
                    <p className="text-sm font-bold text-success">{formatBengaliPrice(data.delivered)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">পেন্ডিং</p>
                    <p className="text-sm font-bold text-warning">{formatBengaliPrice(data.pending)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">রিটার্ন</p>
                    <p className="text-sm font-bold text-destructive">{formatBengaliPrice(data.returned)}</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success rounded-full transition-all"
                    style={{ width: `${deliveryRate}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground text-right">ডেলিভারি রেট: {toBengaliNum(deliveryRate)}%</p>
              </div>
            );
          })}
          {Object.keys(stats.byProvider).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">কোনো COD অর্ডার নেই</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourierPaymentsPage;
