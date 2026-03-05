import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Package, Search, Truck, CheckCircle2, Clock, MapPin, ArrowLeft, Box, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled' | 'returned';

interface OrderInfo {
  id: string;
  customer_name: string;
  watch_model: string;
  status: OrderStatus;
  tracking_id: string | null;
  courier_provider: string | null;
  created_at: string;
  delivery_location: string;
}

const statusSteps: { key: OrderStatus; label: string; icon: any }[] = [
  { key: 'pending', label: 'অর্ডার গৃহীত', icon: Clock },
  { key: 'processing', label: 'প্রস্তুত হচ্ছে', icon: Box },
  { key: 'shipped', label: 'শিপমেন্টে', icon: Truck },
  { key: 'completed', label: 'ডেলিভারি সম্পন্ন', icon: CheckCircle2 },
];

const statusIndex: Record<OrderStatus, number> = {
  pending: 0, processing: 1, shipped: 2, completed: 3, cancelled: -1, returned: -2,
};

const TrackOrder = () => {
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);

    // Search by phone or tracking_id
    const cleanQuery = query.trim();
    let result: any = null;

    // Try by phone
    const { data: byPhone } = await supabase
      .from('orders')
      .select('id, customer_name, watch_model, status, tracking_id, courier_provider, created_at, delivery_location')
      .eq('phone', cleanQuery)
      .order('created_at', { ascending: false })
      .limit(1);

    if (byPhone && byPhone.length > 0) {
      result = byPhone[0];
    } else {
      // Try by tracking_id
      const { data: byTracking } = await supabase
        .from('orders')
        .select('id, customer_name, watch_model, status, tracking_id, courier_provider, created_at, delivery_location')
        .eq('tracking_id', cleanQuery)
        .limit(1);

      if (byTracking && byTracking.length > 0) {
        result = byTracking[0];
      } else {
        // Try by order id prefix
        const { data: byId } = await supabase
          .from('orders')
          .select('id, customer_name, watch_model, status, tracking_id, courier_provider, created_at, delivery_location')
          .ilike('id', `${cleanQuery}%`)
          .limit(1);

        if (byId && byId.length > 0) {
          result = byId[0];
        }
      }
    }

    setLoading(false);
    if (result) {
      setOrder(result as OrderInfo);
    } else {
      setError('এই তথ্য দিয়ে কোনো অর্ডার পাওয়া যায়নি।');
    }
  };

  const currentStep = order ? statusIndex[order.status] : -1;
  const isCancelled = order?.status === 'cancelled';
  const isReturned = order?.status === 'returned';

  const getTrackingUrl = (provider: string | null, trackingId: string | null) => {
    if (!trackingId || !provider) return null;
    switch (provider) {
      case 'redx': return `https://redx.com.bd/track-parcel/?trackingId=${trackingId}`;
      case 'steadfast': return `https://steadfast.com.bd/t/${trackingId}`;
      case 'pathao': return `https://merchant.pathao.com/tracking?consignment_id=${trackingId}`;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">অর্ডার ট্র্যাকিং</h1>
            <p className="text-xs text-muted-foreground">আপনার অর্ডারের বর্তমান অবস্থা দেখুন</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="ফোন নম্বর, ট্র্যাকিং আইডি, বা অর্ডার আইডি দিন..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="gradient-gold text-white px-6 py-3 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
            >
              {loading ? '...' : 'খুঁজুন'}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Order Result */}
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Order Info Card */}
            <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">অর্ডার আইডি</p>
                  <p className="font-mono text-sm font-bold text-foreground">{order.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">তারিখ</p>
                  <p className="text-sm font-medium">{new Date(order.created_at).toLocaleDateString('bn-BD')}</p>
                </div>
              </div>
              <div className="border-t border-border pt-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">প্রোডাক্ট</p>
                  <p className="text-sm font-semibold">{order.watch_model}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">কাস্টমার</p>
                  <p className="text-sm font-medium">{order.customer_name}</p>
                </div>
              </div>
              {order.tracking_id && (
                <div className="border-t border-border pt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">ট্র্যাকিং আইডি</p>
                    <p className="font-mono text-sm font-bold text-primary">{order.tracking_id}</p>
                  </div>
                  {getTrackingUrl(order.courier_provider, order.tracking_id) && (
                    <a
                      href={getTrackingUrl(order.courier_provider, order.tracking_id)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary underline hover:opacity-80"
                    >
                      কুরিয়ারে ট্র্যাক করুন →
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Status Timeline */}
            {(isCancelled || isReturned) ? (
              <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 text-center space-y-2">
                <XCircle className="h-10 w-10 text-destructive mx-auto" />
                <p className="font-bold text-destructive">
                  {isCancelled ? 'অর্ডার ক্যানসেল করা হয়েছে' : 'পার্সেল রিটার্ন হয়েছে'}
                </p>
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="text-sm font-semibold mb-6 text-foreground">ডেলিভারি স্ট্যাটাস</h3>
                <div className="space-y-0">
                  {statusSteps.map((step, i) => {
                    const isCompleted = currentStep >= i;
                    const isCurrent = currentStep === i;
                    const Icon = step.icon;
                    return (
                      <div key={step.key} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                            isCompleted
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-border bg-muted text-muted-foreground'
                          } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          {i < statusSteps.length - 1 && (
                            <div className={`w-0.5 h-12 ${isCompleted ? 'bg-primary' : 'bg-border'}`} />
                          )}
                        </div>
                        <div className="pt-2">
                          <p className={`text-sm font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {step.label}
                          </p>
                          {isCurrent && (
                            <p className="text-xs text-primary font-medium mt-0.5">বর্তমান অবস্থা</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Info when no search yet */}
        {!order && !error && !loading && (
          <div className="text-center py-16 space-y-4">
            <Package className="h-16 w-16 text-muted-foreground/30 mx-auto" />
            <div>
              <p className="text-sm text-muted-foreground">আপনার ফোন নম্বর বা ট্র্যাকিং আইডি দিয়ে</p>
              <p className="text-sm text-muted-foreground">অর্ডারের বর্তমান অবস্থা জানুন</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;
