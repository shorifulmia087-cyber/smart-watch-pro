import { useState } from 'react';
import { Shield, Search, Phone, CheckCircle2, XCircle, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toBengaliNum } from '@/lib/bengali';

interface CourierStats {
  total_parcels: number;
  total_delivered_parcels: number;
  total_cancelled_parcels: number;
}

interface FraudResultWithApis {
  allowed: boolean;
  flag: string | null;
  total_parcels: number;
  total_delivered: number;
  total_cancel: number;
  success_rate: number | null;
  message: string | null;
  error_message: string | null;
  apis?: Record<string, CourierStats> | null;
}

const FraudCheckerPage = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FraudResultWithApis | null>(null);
  const [error, setError] = useState('');

  const handleCheck = async () => {
    const clean = phone.replace(/[\s-]/g, '');
    if (!/^01[3-9]\d{8}$/.test(clean)) {
      setError('সঠিক ১১ ডিজিটের ফোন নম্বর দিন (01XXXXXXXXX)');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('check-fraud', {
        body: { phone: clean },
      });

      if (fnError) {
        setResult({
          allowed: true, flag: 'check_failed', total_parcels: 0,
          total_delivered: 0, total_cancel: 0, success_rate: null,
          message: null, error_message: 'ফাংশন কল ব্যর্থ হয়েছে', apis: null,
        });
      } else {
        setResult(data as FraudResultWithApis);
      }
    } catch {
      setResult({
        allowed: true, flag: 'check_failed', total_parcels: 0,
        total_delivered: 0, total_cancel: 0, success_rate: null,
        message: null, error_message: 'নেটওয়ার্ক ত্রুটি', apis: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const getFlagInfo = (flag: string | null) => {
    switch (flag) {
      case 'good':
        return { label: 'নিরাপদ কাস্টমার', color: 'text-success', bg: 'bg-success/10 border-success/20', icon: CheckCircle2 };
      case 'low_success':
        return { label: 'ঝুঁকিপূর্ণ কাস্টমার', color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', icon: XCircle };
      case 'new_customer':
        return { label: 'নতুন কাস্টমার', color: 'text-warning', bg: 'bg-warning/10 border-warning/20', icon: AlertTriangle };
      case 'check_failed':
        return { label: 'চেক ব্যর্থ', color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', icon: XCircle };
      default:
        return null;
    }
  };

  const rateColor = (rate: number | null) => {
    if (rate === null) return 'text-muted-foreground';
    if (rate >= 80) return 'text-success';
    if (rate >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const rateBg = (rate: number) => {
    if (rate >= 80) return 'bg-success';
    if (rate >= 60) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-5 w-5 text-accent" strokeWidth={1.5} />
          ফ্রড চেকার
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          যেকোনো ফোন নম্বরের ডেলিভারি হিস্টোরি চেক করুন — কুরিয়ার ভিত্তিক বিস্তারিত রিপোর্ট
        </p>
      </div>

      {/* Search Box */}
      <div className="bg-card border border-border/40 rounded-sm p-5">
        <label className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2 block">
          ফোন নম্বর
        </label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" strokeWidth={1.5} />
            <input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              placeholder="01XXXXXXXXX"
              maxLength={11}
              className="w-full h-10 pl-10 pr-4 rounded-sm border border-border/50 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/40 transition-all font-inter"
            />
          </div>
          <button
            onClick={handleCheck}
            disabled={loading || !phone.trim()}
            className="h-10 px-5 rounded-sm bg-accent text-accent-foreground text-sm font-medium flex items-center gap-2 hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" strokeWidth={1.5} />}
            চেক করুন
          </button>
        </div>
        {error && <p className="text-xs text-destructive mt-2">{error}</p>}
      </div>

      {/* Result */}
      {result && (
        <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
          {/* Flag Banner */}
          {(() => {
            const info = getFlagInfo(result.flag);
            if (!info) return null;
            const Icon = info.icon;
            return (
              <div className={`px-5 py-3 border-b ${info.bg} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${info.color}`} strokeWidth={1.5} />
                  <span className={`text-sm font-semibold ${info.color}`}>{info.label}</span>
                </div>
                <button onClick={handleCheck} disabled={loading} className="p-1.5 rounded-sm hover:bg-background/50 transition-colors">
                  <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
                </button>
              </div>
            );
          })()}

          {/* Error / Fraud Message */}
          {result.error_message && (
            <div className="px-5 py-3 bg-destructive/5 border-b border-destructive/10">
              <p className="text-xs text-destructive">{result.error_message}</p>
            </div>
          )}
          {result.message && (
            <div className="px-5 py-3 bg-warning/5 border-b border-warning/10">
              <p className="text-xs text-warning">{result.message}</p>
            </div>
          )}

          <div className="p-5 space-y-5">
            {/* Overview Stats */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold mb-2">টোটাল ওভারভিউ</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-background rounded-sm border border-border/30 p-4 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold mb-1">সাকসেস রেট</p>
                  <p className={`text-2xl font-bold font-inter ${rateColor(result.success_rate)}`}>
                    {result.success_rate !== null ? `${result.success_rate}%` : '—'}
                  </p>
                </div>
                <div className="bg-background rounded-sm border border-border/30 p-4 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold mb-1">মোট পার্সেল</p>
                  <p className="text-2xl font-bold text-foreground font-inter">{toBengaliNum(result.total_parcels)}</p>
                </div>
                <div className="bg-success/5 rounded-sm border border-success/20 p-4 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-success/60 font-semibold mb-1">ডেলিভারড</p>
                  <p className="text-2xl font-bold text-success font-inter">{toBengaliNum(result.total_delivered)}</p>
                </div>
                <div className="bg-destructive/5 rounded-sm border border-destructive/20 p-4 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-destructive/60 font-semibold mb-1">ক্যানসেলড</p>
                  <p className="text-2xl font-bold text-destructive font-inter">{toBengaliNum(result.total_cancel)}</p>
                </div>
              </div>
            </div>

            {/* Overall Progress Bar */}
            {result.total_parcels > 0 && result.success_rate !== null && (
              <div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground/50 uppercase tracking-wider font-semibold mb-1.5">
                  <span>এভারেজ ডেলিভারি রেট</span>
                  <span>{result.success_rate}%</span>
                </div>
                <div className="h-2.5 bg-muted/30 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${rateBg(result.success_rate)}`} style={{ width: `${Math.min(result.success_rate, 100)}%` }} />
                </div>
              </div>
            )}

            {/* Courier-wise Breakdown */}
            {result.apis && Object.keys(result.apis).length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold mb-3">কুরিয়ার ভিত্তিক বিবরণ</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(result.apis).map(([courier, stats]) => {
                    const courierRate = stats.total_parcels > 0 ? Math.round((stats.total_delivered_parcels / stats.total_parcels) * 100) : 0;
                    return (
                      <div key={courier} className="bg-background rounded-sm border border-border/30 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold text-foreground">{courier}</span>
                          <span className={`text-sm font-bold font-inter ${courierRate >= 60 ? 'text-success' : 'text-destructive'}`}>
                            {courierRate}%
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center mb-3">
                          <div className="bg-muted/10 rounded-sm p-2">
                            <p className="text-base font-bold text-foreground font-inter">{toBengaliNum(stats.total_parcels)}</p>
                            <p className="text-[9px] text-muted-foreground mt-0.5">পার্সেল</p>
                          </div>
                          <div className="bg-success/5 rounded-sm p-2">
                            <p className="text-base font-bold text-success font-inter">{toBengaliNum(stats.total_delivered_parcels)}</p>
                            <p className="text-[9px] text-muted-foreground mt-0.5">ডেলিভারড</p>
                          </div>
                          <div className="bg-destructive/5 rounded-sm p-2">
                            <p className="text-base font-bold text-destructive font-inter">{toBengaliNum(stats.total_cancelled_parcels)}</p>
                            <p className="text-[9px] text-muted-foreground mt-0.5">ক্যানসেলড</p>
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${rateBg(courierRate)}`} style={{ width: `${Math.min(courierRate, 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FraudCheckerPage;
