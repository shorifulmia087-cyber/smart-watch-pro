import { useState, useEffect } from 'react';
import { Save, Loader2, CheckCircle2, MessageSquare, Send, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const iconMap: Record<string, any> = { confirmed: CheckCircle2, shipped: Send, delivered: Bell };

interface SmsTemplate {
  id: string;
  label: string;
  template: string;
}

const SmsSettingsPage = () => {
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [senderId, setSenderId] = useState('');
  const [provider, setProvider] = useState('bulksmsbd');
  const [isActive, setIsActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('sms_settings').select('*').limit(1).maybeSingle();
      if (data) {
        setSettingsId(data.id);
        setApiKey((data as any).api_key || '');
        setSenderId((data as any).sender_id || '');
        setProvider((data as any).provider || 'bulksmsbd');
        setIsActive((data as any).is_active || false);
        const tpls = (data as any).templates as SmsTemplate[];
        if (Array.isArray(tpls)) setTemplates(tpls);
      }
      setLoading(false);
    };
    load();
  }, []);

  const updateTemplate = (id: string, value: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, template: value } : t));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        api_key: apiKey,
        sender_id: senderId,
        provider,
        is_active: isActive,
        templates: JSON.parse(JSON.stringify(templates)),
      };

      if (settingsId) {
        const { error } = await supabase.from('sms_settings').update(payload).eq('id', settingsId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('sms_settings').insert(payload).select().single();
        if (error) throw error;
        setSettingsId(data.id);
      }
      toast({ title: '✅ SMS সেটিংস সংরক্ষিত হয়েছে!' });
    } catch (err: any) {
      toast({ title: '❌ সংরক্ষণ ব্যর্থ', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-5 w-full">
      {/* Header */}
      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-4 md:p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">SMS ওয়ার্কফ্লো</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">অর্ডার স্ট্যাটাস অনুযায়ী স্বয়ংক্রিয় SMS টেমপ্লেট</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="gradient-gold text-white font-semibold px-6 py-2.5 rounded-sm text-sm hover:opacity-90 flex items-center gap-2 transition-all shadow-sm"
            style={{ boxShadow: '0 4px 12px -4px hsl(var(--gold) / 0.3)' }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            সংরক্ষণ করুন
          </button>
        </div>
      </div>

      {/* API Config */}
      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5 md:p-6 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
          <MessageSquare className="h-4 w-4 text-info" /> SMS API কনফিগারেশন
        </h3>
        <p className="text-[11px] text-muted-foreground">
          SMS প্রোভাইডারের API Key ও Sender ID দিন (যেমন: BulkSMSBD, SSLWireless)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">API Key</label>
            <input type="text" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="আপনার SMS API Key..."
              className="w-full bg-muted/30 border border-border/40 rounded-sm px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all font-mono" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Sender ID</label>
            <input type="text" value={senderId} onChange={e => setSenderId(e.target.value)} placeholder="যেমন: MyBrand"
              className="w-full bg-muted/30 border border-border/40 rounded-sm px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all" />
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-gold" />
            <span className="text-sm text-foreground font-medium">SMS সার্ভিস অ্যাক্টিভ করুন</span>
          </label>
        </div>
      </div>

      {/* Templates */}
      <div className="space-y-4">
        {templates.map(t => {
          const Icon = iconMap[t.id] || MessageSquare;
          return (
            <div key={t.id} className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5 md:p-6 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                <Icon className="h-4 w-4 text-gold" /> {t.label}
              </h3>
              <textarea
                value={t.template}
                onChange={e => updateTemplate(t.id, e.target.value)}
                rows={3}
                className="w-full bg-muted/30 border border-border/40 rounded-sm px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all resize-none"
              />
              <p className="text-[10px] text-muted-foreground">
                ভ্যারিয়েবল: {'{name}'}, {'{order_id}'}, {'{total}'}, {'{tracking_id}'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Status */}
      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5 md:p-6">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isActive && apiKey ? 'bg-success' : 'bg-warning'} animate-pulse`} />
          <div>
            <p className="text-sm font-medium text-foreground">
              স্ট্যাটাস: {isActive && apiKey ? 'অ্যাক্টিভ' : 'কনফিগার করা হয়নি'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isActive && apiKey ? 'SMS পাঠানোর জন্য প্রস্তুত।' : 'API Key দিন এবং অ্যাক্টিভ করুন SMS সার্ভিস চালু করতে।'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmsSettingsPage;
