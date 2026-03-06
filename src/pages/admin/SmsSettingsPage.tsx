import { useState } from 'react';
import { Save, Loader2, CheckCircle2, MessageSquare, Send, Bell } from 'lucide-react';

const defaultTemplates = [
  { id: 'confirmed', label: 'অর্ডার নিশ্চিত', icon: CheckCircle2, template: 'প্রিয় {name}, আপনার অর্ডার #{order_id} নিশ্চিত হয়েছে। মোট: ৳{total}। ধন্যবাদ!' },
  { id: 'shipped', label: 'শিপমেন্ট', icon: Send, template: 'প্রিয় {name}, আপনার অর্ডার #{order_id} শিপ করা হয়েছে। ট্র্যাকিং: {tracking_id}। ধন্যবাদ!' },
  { id: 'delivered', label: 'ডেলিভারি সম্পন্ন', icon: Bell, template: 'প্রিয় {name}, আপনার অর্ডার #{order_id} সফলভাবে ডেলিভারি হয়েছে। আমাদের সাথে থাকুন!' },
];

const SmsSettingsPage = () => {
  const [templates, setTemplates] = useState(defaultTemplates.map(t => ({ ...t })));
  const [apiKey, setApiKey] = useState('');
  const [senderId, setSenderId] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const updateTemplate = (id: string, value: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, template: value } : t));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  };

  return (
    <div className="space-y-5 w-full max-w-[1000px]">
      {/* Bento Header */}
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
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? 'সংরক্ষিত!' : 'সংরক্ষণ করুন'}
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
      </div>

      {/* Templates */}
      <div className="space-y-4">
        {templates.map(t => (
          <div key={t.id} className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5 md:p-6 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
              <t.icon className="h-4 w-4 text-gold" /> {t.label}
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
        ))}
      </div>

      {/* Status */}
      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5 md:p-6">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${apiKey ? 'bg-success' : 'bg-warning'} animate-pulse`} />
          <div>
            <p className="text-sm font-medium text-foreground">
              স্ট্যাটাস: {apiKey ? 'কনফিগার করা হয়েছে' : 'কনফিগার করা হয়নি'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {apiKey ? 'SMS পাঠানোর জন্য প্রস্তুত।' : 'API Key দিন SMS সার্ভিস অ্যাক্টিভেট করতে।'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmsSettingsPage;
