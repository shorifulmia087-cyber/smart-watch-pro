import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams } from 'react-router-dom';
import { Package, Search, Truck, CheckCircle2, Clock, MapPin, ArrowLeft, Box, XCircle, Loader2, ExternalLink } from 'lucide-react';
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

interface TrackingEvent {
  status: string;
  timestamp: string;
  location?: string;
  details?: string;
}

interface LiveTrackingData {
  current_status: string;
  last_updated: string;
  current_location?: string;
  events: TrackingEvent[];
  provider: string;
  tracking_id: string;
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
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [liveTracking, setLiveTracking] = useState<LiveTrackingData | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [autoSearched, setAutoSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);
    setLiveTracking(null);

    const cleanQuery = query.trim();
    let result: any = null;

    const { data: byPhone } = await supabase
      .from('orders')
      .select('id, customer_name, watch_model, status, tracking_id, courier_provider, created_at, delivery_location')
      .eq('phone', cleanQuery)
      .order('created_at', { ascending: false })
      .limit(1);

    if (byPhone && byPhone.length > 0) {
      result = byPhone[0];
    } else {
      const { data: byTracking } = await supabase
        .from('orders')
        .select('id, customer_name, watch_model, status, tracking_id, courier_provider, created_at, delivery_location')
        .eq('tracking_id', cleanQuery)
        .limit(1);

      if (byTracking && byTracking.length > 0) {
        result = byTracking[0];
      } else {
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
      // Auto-fetch live tracking if courier is booked
      if (result.tracking_id && result.courier_provider) {
        fetchLiveTracking(result.tracking_id, result.courier_provider);
      }
    } else {
      setError('এই তথ্য দিয়ে কোনো অর্ডার পাওয়া যায়নি।');
    }
  };

  const fetchLiveTracking = async (trackingId: string, provider: string) => {
    setTrackingLoading(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/track-courier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracking_id: trackingId, courier_provider: provider }),
      });
      const data = await res.json();
      if (res.ok) {
        setLiveTracking(data);
      }
    } catch {
      // Silently fail - we still show the basic status
    } finally {
      setTrackingLoading(false);
    }
  };

  // Auto-search from URL param
  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam && !autoSearched) {
      setQuery(idParam);
      setAutoSearched(true);
      // Trigger search programmatically
      const doSearch = async () => {
        setLoading(true);
        setError('');
        setOrder(null);
        setLiveTracking(null);
        const cleanQuery = idParam.trim();
        let result: any = null;

        const { data: byTracking } = await supabase
          .from('orders')
          .select('id, customer_name, watch_model, status, tracking_id, courier_provider, created_at, delivery_location')
          .eq('tracking_id', cleanQuery)
          .limit(1);

        if (byTracking && byTracking.length > 0) {
          result = byTracking[0];
        } else {
          const { data: byPhone } = await supabase
            .from('orders')
            .select('id, customer_name, watch_model, status, tracking_id, courier_provider, created_at, delivery_location')
            .eq('phone', cleanQuery)
            .order('created_at', { ascending: false })
            .limit(1);
          if (byPhone && byPhone.length > 0) result = byPhone[0];
        }

        setLoading(false);
        if (result) {
          setOrder(result as OrderInfo);
          if (result.tracking_id && result.courier_provider) {
            fetchLiveTracking(result.tracking_id, result.courier_provider);
          }
        } else {
          setError('এই তথ্য দিয়ে কোনো অর্ডার পাওয়া যায়নি।');
        }
      };
      doSearch();
    }
  }, [searchParams, autoSearched]);

  const currentStep = order ? statusIndex[order.status] : -1;
  const isCancelled = order?.status === 'cancelled';
  const isReturned = order?.status === 'returned';

  const providerNames: Record<string, string> = { redx: 'RedX', pathao: 'Pathao', steadfast: 'Steadfast' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Page Header */}
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold text-foreground">অর্ডার ট্র্যাকিং</h1>
          <p className="text-sm text-muted-foreground">আপনার অর্ডারের রিয়েল-টাইম অবস্থা দেখুন</p>
        </div>

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
              className="gradient-gold text-white px-6 py-3 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'খুঁজুন'}
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
            className="space-y-5"
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
                    <p className="font-mono text-sm font-bold text-accent">{order.tracking_id}</p>
                    {order.courier_provider && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{providerNames[order.courier_provider] || order.courier_provider}</p>
                    )}
                  </div>
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
                              ? 'bg-accent border-accent text-accent-foreground'
                              : 'border-border bg-muted text-muted-foreground'
                          } ${isCurrent ? 'ring-4 ring-accent/20' : ''}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          {i < statusSteps.length - 1 && (
                            <div className={`w-0.5 h-12 ${isCompleted ? 'bg-accent' : 'bg-border'}`} />
                          )}
                        </div>
                        <div className="pt-2">
                          <p className={`text-sm font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {step.label}
                          </p>
                          {isCurrent && (
                            <p className="text-xs text-accent font-medium mt-0.5">বর্তমান অবস্থা</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Live Courier Tracking */}
            {order.tracking_id && order.courier_provider && (
              <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Truck className="h-4 w-4 text-accent" />
                    কুরিয়ার লাইভ ট্র্যাকিং
                  </h3>
                  {trackingLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>

                {liveTracking ? (
                  <div className="space-y-4">
                    {/* Current Status */}
                    <div className="bg-muted/30 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-foreground">{liveTracking.current_status}</p>
                        {liveTracking.current_location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" /> {liveTracking.current_location}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">সর্বশেষ আপডেট</p>
                        <p className="text-xs font-medium">{new Date(liveTracking.last_updated).toLocaleString('bn-BD')}</p>
                      </div>
                    </div>

                    {/* Live Events Timeline */}
                    {liveTracking.events.length > 0 && (
                      <div className="space-y-0 pl-1">
                        {liveTracking.events.map((event, i) => {
                          const isLast = i === liveTracking.events.length - 1;
                          return (
                            <div key={i} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                                  isLast ? 'bg-accent border-accent text-accent-foreground' : 'border-border bg-card text-muted-foreground'
                                }`}>
                                  <CheckCircle2 className="h-3 w-3" />
                                </div>
                                {i < liveTracking.events.length - 1 && (
                                  <div className="w-px h-8 bg-border" />
                                )}
                              </div>
                              <div className="pb-3">
                                <p className={`text-xs font-medium ${isLast ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {event.status}
                                </p>
                                {event.details && (
                                  <p className="text-[10px] text-muted-foreground">{event.details}</p>
                                )}
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className="text-[10px] text-muted-foreground/70">
                                    {new Date(event.timestamp).toLocaleString('bn-BD')}
                                  </p>
                                  {event.location && (
                                    <span className="text-[10px] text-accent flex items-center gap-0.5">
                                      <MapPin className="h-2.5 w-2.5" /> {event.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Refresh */}
                    <button
                      onClick={() => fetchLiveTracking(order.tracking_id!, order.courier_provider!)}
                      disabled={trackingLoading}
                      className="text-xs text-accent hover:underline flex items-center gap-1"
                    >
                      <Loader2 className={`h-3 w-3 ${trackingLoading ? 'animate-spin' : ''}`} />
                      রিফ্রেশ করুন
                    </button>
                  </div>
                ) : !trackingLoading ? (
                  <p className="text-xs text-muted-foreground">ট্র্যাকিং ডেটা লোড হয়নি</p>
                ) : null}
              </div>
            )}
          </motion.div>
        )}

        {/* Empty State */}
        {!order && !error && !loading && (
          <div className="text-center py-16 space-y-4">
            <Package className="h-16 w-16 text-muted-foreground/30 mx-auto" />
            <div>
              <p className="text-sm text-muted-foreground">আপনার ফোন নম্বর বা ট্র্যাকিং আইডি দিয়ে</p>
              <p className="text-sm text-muted-foreground">অর্ডারের রিয়েল-টাইম অবস্থা জানুন</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;
