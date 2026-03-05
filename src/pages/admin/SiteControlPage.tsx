import { useState } from 'react';
import { useSettings, useUpdateSettings } from '@/hooks/useSupabaseData';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Globe, Megaphone, Type, FileText, Save, Loader2, CheckCircle2, MessageCircle,
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type SettingsRow = Database['public']['Tables']['site_settings']['Row'];

const SiteControlPage = () => {
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
      <div className="space-y-6 max-w-[900px]">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[900px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">সাইট কন্ট্রোল</h2>
          <p className="text-[11px] text-muted-foreground">সাইটের সমস্ত সেটিংস একই জায়গায়</p>
        </div>
        <button
          onClick={save}
          disabled={updateSettings.isPending}
          className="gradient-gold text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 flex items-center gap-2 transition-all shadow-sm"
        >
          {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'সংরক্ষিত!' : 'সংরক্ষণ করুন'}
        </button>
      </div>

      <div className="glass-card rounded-2xl divide-y divide-border/60">
        <Section title="ব্র্যান্ডিং" icon={<Globe className="h-4 w-4 text-info" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="ব্র্যান্ড নাম" value={form.brand_name || ''} onChange={v => setForm({ ...form, brand_name: v })} />
            <Field label="ট্যাগলাইন" value={form.brand_tagline || ''} onChange={v => setForm({ ...form, brand_tagline: v })} />
            <div className="sm:col-span-2">
              <Field label="লোগো URL (ছবির লিংক দিন)" value={(form as any).logo_url || ''} onChange={v => setForm({ ...form, logo_url: v } as any)} />
              {(form as any).logo_url && (
                <div className="mt-2 p-3 bg-muted rounded-xl inline-block">
                  <img src={(form as any).logo_url} alt="Logo preview" className="h-10 w-auto object-contain" />
                </div>
              )}
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">টাইপ</label>
              <select value={form.product_type || 'watch'} onChange={e => setForm({ ...form, product_type: e.target.value })} className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
                <option value="watch">ঘড়ি</option>
                <option value="clothing">পোশাক</option>
                <option value="electronics">ইলেকট্রনিক্স</option>
                <option value="accessories">আনুষাঙ্গিক</option>
              </select>
            </div>
            <Field label="প্রাইমারি কালার" value={form.primary_color || '#b8963e'} onChange={v => setForm({ ...form, primary_color: v })} />
          </div>
        </Section>

        <Section title="অ্যানাউন্সমেন্ট" icon={<Megaphone className="h-4 w-4 text-warning" />}>
          <div className="space-y-4">
            <Field label="টেক্সট" value={form.announcement_text || ''} onChange={v => setForm({ ...form, announcement_text: v })} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="ছাড় %" type="number" value={String(form.discount_percent ?? 30)} onChange={v => setForm({ ...form, discount_percent: Number(v) })} />
              <Field label="কাউন্টডাউন (ঘণ্টা)" type="number" value={String(form.countdown_hours ?? 2)} onChange={v => setForm({ ...form, countdown_hours: Number(v) })} />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.timer_enabled ?? true} onChange={e => setForm({ ...form, timer_enabled: e.target.checked })} className="rounded accent-accent" />
              টাইমার চালু
            </label>
          </div>
        </Section>

        <Section title="পেজ কন্টেন্ট" icon={<Type className="h-4 w-4 text-accent" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="হিরো সাবটাইটেল" value={form.hero_subtitle || ''} onChange={v => setForm({ ...form, hero_subtitle: v })} />
            <Field label="ফিচার সেকশন" value={form.features_section_title || ''} onChange={v => setForm({ ...form, features_section_title: v })} />
            <Field label="ভিডিও সেকশন" value={form.video_section_title || ''} onChange={v => setForm({ ...form, video_section_title: v })} />
            <Field label="কালেকশন সেকশন" value={form.collection_section_title || ''} onChange={v => setForm({ ...form, collection_section_title: v })} />
          </div>
        </Section>

        <Section title="ফুটার ও CTA" icon={<FileText className="h-4 w-4 text-muted-foreground" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="CTA শিরোনাম" value={form.footer_cta_title || ''} onChange={v => setForm({ ...form, footer_cta_title: v })} />
            <Field label="CTA সাবটাইটেল" value={form.footer_cta_subtitle || ''} onChange={v => setForm({ ...form, footer_cta_subtitle: v })} />
          </div>
          <Field label="ফুটার টেক্সট" value={form.footer_text || ''} onChange={v => setForm({ ...form, footer_text: v })} />
        </Section>

        <Section title="WhatsApp" icon={<MessageCircle className="h-4 w-4 text-[#25D366]" />}>
          <Field
            label="WhatsApp নম্বর (দেশ কোড সহ, যেমন 8801XXXXXXXXX)"
            value={(form as any).whatsapp_number || ''}
            onChange={v => setForm({ ...form, whatsapp_number: v } as any)}
          />
        </Section>
      </div>
    </div>
  );
};

const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="p-5 md:p-6 space-y-4">
    <h3 className="font-semibold text-sm flex items-center gap-2">{icon} {title}</h3>
    {children}
  </div>
);

const Field = ({ label, value, onChange, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) => (
  <div>
    <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">{label}</label>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
    />
  </div>
);

export default SiteControlPage;
