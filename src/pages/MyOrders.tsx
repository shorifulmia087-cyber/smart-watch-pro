import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Package, ArrowLeft, Clock, Truck, CheckCircle2, XCircle, RotateCcw, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatBengaliPrice, toBengaliNum } from '@/lib/bengali';
import Navbar from '@/components/Navbar';

import { useSettings } from '@/hooks/useSupabaseData';

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: 'পেন্ডিং', icon: <Clock className="h-4 w-4" />, color: 'bg-warning/15 text-warning' },
  processing: { label: 'প্রসেসিং', icon: <Loader2 className="h-4 w-4 animate-spin" />, color: 'bg-info/15 text-info' },
  shipped: { label: 'শিপড', icon: <Truck className="h-4 w-4" />, color: 'bg-info/15 text-info' },
  completed: { label: 'ডেলিভারড', icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-success/15 text-success' },
  cancelled: { label: 'বাতিল', icon: <XCircle className="h-4 w-4" />, color: 'bg-destructive/15 text-destructive' },
  returned: { label: 'রিটার্ন', icon: <RotateCcw className="h-4 w-4" />, color: 'bg-destructive/15 text-destructive' },
};

const MyOrders = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: settings } = useSettings();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar
        discountPercent={settings?.discount_percent}
        countdownHours={settings?.countdown_hours}
        announcementText={settings?.announcement_text}
        timerEnabled={settings?.timer_enabled}
        offerStartAt={(settings as any)?.offer_start_at}
        offerEndAt={(settings as any)?.offer_end_at}
      />
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-3 mb-8">
            <Link to="/" className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">মাই অর্ডার</h1>
              <p className="text-sm text-muted-foreground">আপনার সকল অর্ডারের তালিকা</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : !orders?.length ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 bg-card rounded-2xl border border-border"
            >
              <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-foreground mb-1">কোনো অর্ডার নেই</h2>
              <p className="text-sm text-muted-foreground mb-6">আপনি এখনো কোনো অর্ডার করেননি।</p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                শপিং শুরু করুন
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, i) => {
                const status = statusConfig[order.status] || statusConfig.pending;
                const date = new Date(order.created_at);
                const formattedDate = `${toBengaliNum(date.getDate())}/${toBengaliNum(date.getMonth() + 1)}/${toBengaliNum(date.getFullYear())}`;

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{order.watch_model}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          পরিমাণ: {toBengaliNum(order.quantity)} • {formattedDate}
                        </p>
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                          {order.address}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-foreground">৳{formatBengaliPrice(order.total_price)}</p>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium mt-2 ${status.color}`}>
                          {status.icon}
                          {status.label}
                        </span>
                      </div>
                    </div>

                    {order.tracking_id && (
                      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          ট্র্যাকিং: <span className="font-mono text-foreground">{order.tracking_id}</span>
                        </span>
                        <Link
                          to={`/track?id=${order.tracking_id}`}
                          className="text-xs font-medium text-accent hover:underline"
                        >
                          ট্র্যাক করুন →
                        </Link>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MyOrders;
