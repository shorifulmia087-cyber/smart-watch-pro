import { useState } from 'react';
import { useSettings, useUpdateSettings } from '@/hooks/useSupabaseData';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, Save, Loader2, CheckCircle2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type SettingsRow = Database['public']['Tables']['site_settings']['Row'];

const PaymentSettingsPage = () => {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [form, setForm] = useState<Partial<SettingsRow>>({});
  const [initialized, setInitialized] = useState(false);
  const [saved, setSaved] = useState(false);

  if (settings && !initialized) {
    setForm({ ...settings });
    setInitialized(true);
  }

  const save = () => {
    updateSettings.mutate(form, {
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-5 w-full max-w-[1000px]">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-sm" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5 w-full max-w-[1000px]">
      {/* Bento Header */}
      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-4 md:p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">পেমেন্ট সেটিংস</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">পেমেন্ট মেথড ও ডেলিভারি চার্জ কনফিগার করুন</p>
          </div>
          <button
            onClick={save}
            disabled={updateSettings.isPending}
            className="gradient-gold text-white font-semibold px-6 py-2.5 rounded-sm text-sm hover:opacity-90 flex items-center gap-2 transition-all shadow-sm"
            style={{ boxShadow: '0 4px 12px -4px hsl(var(--gold) / 0.3)' }}
          >
            {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? 'সংরক্ষিত!' : 'সংরক্ষণ করুন'}
          </button>
        </div>
      </div>

      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm divide-y divide-border/30">
        <div className="p-5 md:p-6 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
            <CreditCard className="h-4 w-4 text-success" /> মোবাইল ব্যাংকিং নম্বর
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="বিকাশ নম্বর" value={form.bkash_number || ''} onChange={v => setForm({ ...form, bkash_number: v })} />
            <Field label="নগদ নম্বর" value={form.nagad_number || ''} onChange={v => setForm({ ...form, nagad_number: v })} />
            <Field label="রকেট নম্বর" value={form.rocket_number || ''} onChange={v => setForm({ ...form, rocket_number: v })} />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer text-foreground">
            <input
              type="checkbox"
              checked={form.online_payment_enabled ?? true}
              onChange={e => setForm({ ...form, online_payment_enabled: e.target.checked })}
              className="rounded-sm accent-accent"
            />
            অনলাইন পেমেন্ট চালু
          </label>
        </div>

        <div className="p-5 md:p-6 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
            <CreditCard className="h-4 w-4 text-info" /> ডেলিভারি চার্জ
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="ঢাকার ভেতরে (৳)" type="number" value={String(form.delivery_charge_inside ?? 70)} onChange={v => setForm({ ...form, delivery_charge_inside: Number(v) })} />
            <Field label="ঢাকার বাইরে (৳)" type="number" value={String(form.delivery_charge_outside ?? 150)} onChange={v => setForm({ ...form, delivery_charge_outside: Number(v) })} />
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) => (
  <div>
    <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">{label}</label>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-muted/30 border border-border/40 rounded-sm px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all"
    />
  </div>
);

export default PaymentSettingsPage;
