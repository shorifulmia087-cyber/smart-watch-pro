import { useState } from 'react';
import { Shield, Search, Phone, Package, CheckCircle2, XCircle, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { FraudResult } from '@/hooks/useFraudCheck';

const FraudCheckerPage = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FraudResult | null>(null);
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
          message: null, error_message: 'ফাংশন কল ব্যর্থ হয়েছে',
        });
      } else {
        setResult(data as FraudResult);
      }
    } catch {
      setResult({
        allowed: true, flag: 'check_failed', total_parcels: 0,
        total_delivered: 0, total_cancel: 0, success_rate: null,
        message: null, error_message: 'নেটওয়ার্ক ত্রুটি',
      });
    } finally {
      setLoading(false);
    }
  };

  const getFlagInfo = (flag: string | null) => {
    switch (flag) {
      case 'good':
        return { label: 'নিরাপদ', color: 'text-success', bg: 'bg-success/10 border-success/20', icon: CheckCircle2 };
      case 'low_success':
        return { label: 'ঝুঁকিপূর্ণ', color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', icon: XCircle };
      case 'new_customer':
        return { label: 'নতুন কাস্টমার', color: 'text-warning', bg: 'bg-warning/10 border-warning/20', icon: AlertTriangle };
      case 'check_failed':
        return { label: 'চেক ব্যর্থ', color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', icon: XCircle };
      default:
        return null;
    }
  };

  const successRateColor = (rate: number | null) => {
    if (rate === null) return 'text-muted-foreground';
    if (rate >= 80) return 'text-success';
    if (rate >= 60) return 'text-warning';
    return 'text-destructive';
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
          যেকোনো ফোন নম্বরের ডেলিভারি হিস্টোরি চেক করুন
        </p>
      </div>

      {/* Search Box */}
      <div className="bg-card border border-border/40 rounded-sm p-5">
        <label className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2 block">
          ফোন নম্বর
        </label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" strokeWidth={1.5} />
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              placeholder="01XXXXXXXXX"
              maxLength={11}
              className="w-full h-10 pl-10 pr-4 rounded-sm border border-border/50 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/40 transition-all"
            />
          </div>
          <button
            onClick={handleCheck}
            disabled={loading || !phone.trim()}
            className="h-10 px-5 rounded-sm bg-accent text-accent-foreground text-sm font-medium flex items-center gap-2 hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" strokeWidth={1.5} />
            )}
            চেক করুন
          </button>
        </div>
        {error && (
          <p className="text-xs text-destructive mt-2">{error}</p>
        )}
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
                <button
                  onClick={handleCheck}
                  disabled={loading}
                  className="p-1.5 rounded-sm hover:bg-background/50 transition-colors"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
                </button>
              </div>
            );
          })()}

          {/* Error Message */}
          {result.error_message && (
            <div className="px-5 py-3 bg-destructive/5 border-b border-destructive/10">
              <p className="text-xs text-destructive">{result.error_message}</p>
            </div>
          )}

          {/* Fraud Message */}
          {result.message && (
            <div className="px-5 py-3 bg-warning/5 border-b border-warning/10">
              <p className="text-xs text-warning">{result.message}</p>
            </div>
          )}

          {/* Stats Grid */}
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Success Rate */}
              <div className="bg-background rounded-sm border border-border/30 p-4 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold mb-1">সাকসেস রেট</p>
                <p className={`text-2xl font-bold ${successRateColor(result.success_rate)}`}>
                  {result.success_rate !== null ? `${result.success_rate}%` : '—'}
                </p>
              </div>

              {/* Total Parcels */}
              <div className="bg-background rounded-sm border border-border/30 p-4 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold mb-1">মোট পার্সেল</p>
                <p className="text-2xl font-bold text-foreground">{result.total_parcels}</p>
              </div>

              {/* Delivered */}
              <div className="bg-success/5 rounded-sm border border-success/20 p-4 text-center">
                <p className="text-[10px] uppercase tracking-wider text-success/60 font-semibold mb-1">ডেলিভারড</p>
                <p className="text-2xl font-bold text-success">{result.total_delivered}</p>
              </div>

              {/* Cancelled */}
              <div className="bg-destructive/5 rounded-sm border border-destructive/20 p-4 text-center">
                <p className="text-[10px] uppercase tracking-wider text-destructive/60 font-semibold mb-1">ক্যানসেলড</p>
                <p className="text-2xl font-bold text-destructive">{result.total_cancel}</p>
              </div>
            </div>

            {/* Progress Bar */}
            {result.total_parcels > 0 && result.success_rate !== null && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground/50 uppercase tracking-wider font-semibold mb-1.5">
                  <span>ডেলিভারি রেট</span>
                  <span>{result.success_rate}%</span>
                </div>
                <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      result.success_rate >= 80 ? 'bg-success' : result.success_rate >= 60 ? 'bg-warning' : 'bg-destructive'
                    }`}
                    style={{ width: `${Math.min(result.success_rate, 100)}%` }}
                  />
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
