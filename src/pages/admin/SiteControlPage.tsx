import { useState, useRef } from 'react';
import { useSettings, useUpdateSettings } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Globe, Megaphone, Type, FileText, Save, Loader2, CheckCircle2, MessageCircle, Upload, X, Lock, ShieldCheck,
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sanitizeForDisplay } from '@/lib/security';

type SettingsRow = Database['public']['Tables']['site_settings']['Row'];

const toDateTimeLocalValue = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

const fromDateTimeLocalValue = (value: string) => {
  if (!value) return null;
  return new Date(value).toISOString();
};

const SiteControlPage = () => {
  const { data: settings, isLoading } = useSettings();
  const { isSuperAdmin } = useAuth();
  const updateSettings = useUpdateSettings();
  const [form, setForm] = useState<Partial<SettingsRow>>({});
  const [initialized, setInitialized] = useState(false);
  const [saved, setSaved] = useState(false);

  if (settings && !initialized) {
    setForm({ ...settings });
    setInitialized(true);
  }

  const save = () => {
    // Sanitize all text fields before saving
    const sanitizedForm: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(form)) {
      // Non-super-admins can't change developer fields
      if (!isSuperAdmin && (key === 'developer_name' || key === 'developer_url')) {
        continue;
      }
      if (typeof value === 'string' && !key.includes('url') && !key.includes('color')) {
        sanitizedForm[key] = sanitizeForDisplay(value);
      } else {
        sanitizedForm[key] = value;
      }
    }
    updateSettings.mutate(sanitizedForm as any, {
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-5 w-full">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-sm" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5 w-full max-w-[1000px]">
      {/* Bento Header */}
      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-4 md:p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">সাইট কন্ট্রোল</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">সাইটের সমস্ত সেটিংস একই জায়গায়</p>
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
        <Section title="ব্র্যান্ডিং" icon={<Globe className="h-4 w-4 text-info" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="ব্র্যান্ড নাম" value={form.brand_name || ''} onChange={v => setForm({ ...form, brand_name: v })} />
            <Field label="ট্যাগলাইন" value={form.brand_tagline || ''} onChange={v => setForm({ ...form, brand_tagline: v })} />
            <div className="sm:col-span-2">
              <LogoUpload
                currentUrl={(form as any).logo_url || ''}
                onUploaded={(url) => setForm({ ...form, logo_url: url } as any)}
                onRemove={() => setForm({ ...form, logo_url: '' } as any)}
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">টাইপ</label>
              <select value={form.product_type || 'watch'} onChange={e => setForm({ ...form, product_type: e.target.value })}
                className="w-full bg-muted/30 border border-border/40 rounded-sm px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/20">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="ছাড় %" type="number" value={String(form.discount_percent ?? 30)} onChange={v => setForm({ ...form, discount_percent: Number(v) })} />
              <Field label="Fallback কাউন্টডাউন (ঘণ্টা)" type="number" value={String(form.countdown_hours ?? 2)} onChange={v => setForm({ ...form, countdown_hours: Number(v) })} />
              <DateTimeField label="অফার শুরুর সময়" value={(form as any).offer_start_at} onChange={v => setForm({ ...form, offer_start_at: v } as any)} />
              <DateTimeField label="অফার শেষ সময়" value={(form as any).offer_end_at} onChange={v => setForm({ ...form, offer_end_at: v } as any)} />
            </div>
            <p className="text-xs text-muted-foreground">অফার শুরুর/শেষের সময় সেট করলে উপরের টাইমার সেটি অনুযায়ী চলবে।</p>
            <label className="flex items-center gap-2 text-sm cursor-pointer text-foreground">
              <input type="checkbox" checked={form.timer_enabled ?? true} onChange={e => setForm({ ...form, timer_enabled: e.target.checked })} className="rounded-sm accent-accent" />
              টাইমার চালু
            </label>
          </div>
        </Section>

        <Section title="পেজ কন্টেন্ট" icon={<Type className="h-4 w-4 text-gold" />}>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            {isSuperAdmin ? (
              <>
                <Field label="ডেভেলপার নাম" value={(form as any).developer_name || ''} onChange={v => setForm({ ...form, developer_name: v } as any)} />
                <Field label="ডেভেলপার লিংক (URL)" value={(form as any).developer_url || ''} onChange={v => setForm({ ...form, developer_url: v } as any)} />
              </>
            ) : (
              <>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Lock className="h-3 w-3" /> ডেভেলপার নাম
                  </label>
                  <div className="w-full bg-muted/20 border border-border/30 rounded-sm px-3 py-2.5 text-sm text-muted-foreground cursor-not-allowed select-none">
                    {(form as any).developer_name || '—'}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Lock className="h-3 w-3" /> ডেভেলপার লিংক (URL)
                  </label>
                  <div className="w-full bg-muted/20 border border-border/30 rounded-sm px-3 py-2.5 text-sm text-muted-foreground cursor-not-allowed select-none truncate">
                    {(form as any).developer_url || '—'}
                  </div>
                </div>
              </>
            )}
          </div>
        </Section>

        <Section title="WhatsApp" icon={<MessageCircle className="h-4 w-4 text-success" />}>
          <Field
            label="WhatsApp নম্বর (দেশ কোড সহ, যেমন 8801XXXXXXXXX)"
            value={(form as any).whatsapp_number || ''}
            onChange={v => setForm({ ...form, whatsapp_number: v } as any)}
          />
        </Section>

        <Section title="ফ্রড ডিটেকশন" icon={<ShieldCheck className="h-4 w-4 text-destructive" />}>
          <div className="space-y-3">
            <Field
              label="মিনিমাম সাকসেস রেট (%)"
              type="number"
              value={String((form as any).min_success_rate ?? 60)}
              onChange={v => setForm({ ...form, min_success_rate: Number(v) } as any)}
            />
            <p className="text-xs text-muted-foreground">
              এই হারের নিচে থাকলে ক্যাশ অন ডেলিভারি ব্লক হবে এবং কাস্টমারকে অগ্রিম পেমেন্ট করতে বলা হবে। ডিফল্ট: ৬০%
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
};

const LogoUpload = ({ currentUrl, onUploaded, onRemove }: { currentUrl: string; onUploaded: (url: string) => void; onRemove: () => void }) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('শুধুমাত্র ইমেজ ফাইল আপলোড করুন'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('ফাইল সাইজ ২MB এর বেশি হতে পারবে না'); return; }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('brand-assets').upload(path, file, { upsert: true });
    if (error) { toast.error('আপলোড ব্যর্থ হয়েছে'); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('brand-assets').getPublicUrl(path);
    onUploaded(urlData.publicUrl);
    toast.success('লোগো আপলোড সফল!');
    setUploading(false);
  };

  return (
    <div>
      <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">ব্র্যান্ড লোগো</label>
      {currentUrl ? (
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-sm border border-border/40">
          <img src={currentUrl} alt="Logo" className="h-10 w-auto object-contain rounded-sm" />
          <span className="text-xs text-muted-foreground flex-1 truncate">{currentUrl.split('/').pop()}</span>
          <button type="button" onClick={onRemove} className="p-1.5 rounded-sm hover:bg-destructive/10 text-destructive transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border/40 rounded-sm text-sm text-muted-foreground hover:border-gold hover:text-gold transition-colors cursor-pointer">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? 'আপলোড হচ্ছে...' : 'লোগো আপলোড করুন'}
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
    </div>
  );
};

const DateTimeField = ({ label, value, onChange }: { label: string; value?: string | null; onChange: (v: string | null) => void }) => (
  <div>
    <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">{label}</label>
    <input type="datetime-local" value={toDateTimeLocalValue(value)} onChange={(e) => onChange(fromDateTimeLocalValue(e.target.value))}
      className="w-full bg-muted/30 border border-border/40 rounded-sm px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all" />
  </div>
);

const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="p-5 md:p-6 space-y-4">
    <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">{icon} {title}</h3>
    {children}
  </div>
);

const Field = ({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) => (
  <div>
    <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-muted/30 border border-border/40 rounded-sm px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all" />
  </div>
);

export default SiteControlPage;
