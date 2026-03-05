import { useState } from 'react';
import { Truck, MapPin, Clock, CheckCircle2, Package, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TrackingEvent {
  status: string;
  timestamp: string;
  location?: string;
  details?: string;
}

interface TrackingData {
  current_status: string;
  last_updated: string;
  current_location?: string;
  events: TrackingEvent[];
  provider: string;
  tracking_id: string;
}

interface LiveTrackingProps {
  orderId: string;
  trackingId: string | null;
  courierProvider: string | null;
}

const providerNames: Record<string, string> = { redx: 'RedX', pathao: 'Pathao', steadfast: 'Steadfast' };

const LiveTracking = ({ orderId, trackingId, courierProvider }: LiveTrackingProps) => {
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);

  const fetchTracking = async () => {
    if (!trackingId || !courierProvider) return;
    setLoading(true);
    setError('');

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/track-courier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracking_id: trackingId, courier_provider: courierProvider, order_id: orderId }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || 'ট্র্যাকিং ডেটা আনতে সমস্যা হয়েছে');
      } else {
        setData(result);
        setExpanded(true);
      }
    } catch (err: any) {
      setError(err.message || 'নেটওয়ার্ক ত্রুটি');
    } finally {
      setLoading(false);
    }
  };

  if (!trackingId || !courierProvider) {
    return (
      <div className="text-xs text-muted-foreground italic py-2">কুরিয়ারে বুক হয়নি</div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={fetchTracking}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent/10 text-accent hover:bg-accent/20 transition-colors border border-accent/20"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />}
          {data ? 'রিফ্রেশ' : 'লাইভ ট্র্যাক'}
        </button>
        {data && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? 'সংকুচিত করুন' : 'বিস্তারিত দেখুন'}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      <AnimatePresence>
        {data && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-muted/30 rounded-xl border border-border/60 p-4 space-y-4">
              {/* Current Status Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <Package className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{data.current_status}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {providerNames[data.provider] || data.provider} • {data.tracking_id}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {data.current_location && (
                    <p className="text-xs text-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-accent" />
                      {data.current_location}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(data.last_updated).toLocaleString('bn-BD')}
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-0 pl-2">
                {data.events.map((event, i) => {
                  const isLast = i === data.events.length - 1;
                  return (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                          isLast
                            ? 'bg-accent border-accent text-accent-foreground'
                            : 'border-border bg-card text-muted-foreground'
                        }`}>
                          <CheckCircle2 className="h-3 w-3" />
                        </div>
                        {i < data.events.length - 1 && (
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveTracking;
