import { useState } from 'react';
import { Truck, ExternalLink, Save, Loader2, CheckCircle2 } from 'lucide-react';

const CourierSettingsPage = () => {
  const [courierProvider, setCourierProvider] = useState('redx');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-[900px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">কুরিয়ার ইন্টিগ্রেশন</h2>
          <p className="text-[11px] text-muted-foreground">কুরিয়ার সার্ভিস API কনফিগার করুন</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="gradient-gold text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 flex items-center gap-2 transition-all shadow-sm"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'সংরক্ষিত!' : 'সংরক্ষণ করুন'}
        </button>
      </div>

      {/* Provider Selection */}
      <div className="glass-card rounded-2xl p-5 md:p-6 space-y-5">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Truck className="h-4 w-4 text-accent" /> কুরিয়ার প্রোভাইডার
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: 'redx', name: 'RedX', desc: 'দ্রুত ডেলিভারি সার্ভিস', url: 'https://redx.com.bd' },
            { id: 'pathao', name: 'Pathao Courier', desc: 'পাঠাও কুরিয়ার সার্ভিস', url: 'https://pathao.com' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setCourierProvider(p.id)}
              className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                courierProvider === p.id
                  ? 'border-accent bg-accent/5 shadow-sm'
                  : 'border-border hover:border-accent/40 hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm text-foreground">{p.name}</p>
                <a href={p.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-accent" />
                </a>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* API Credentials */}
      <div className="glass-card rounded-2xl p-5 md:p-6 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-info" /> API ক্রেডেনশিয়াল
        </h3>
        <p className="text-[11px] text-muted-foreground">
          {courierProvider === 'redx' ? 'RedX' : 'Pathao'} ড্যাশবোর্ড থেকে API Key ও Secret সংগ্রহ করুন।
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">API Key</label>
            <input
              type="text" value={apiKey} onChange={e => setApiKey(e.target.value)}
              placeholder="আপনার API Key দিন..."
              className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">API Secret</label>
            <input
              type="password" value={apiSecret} onChange={e => setApiSecret(e.target.value)}
              placeholder="আপনার API Secret দিন..."
              className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all font-mono"
            />
          </div>
        </div>
      </div>

      {/* Status Info */}
      <div className="glass-card rounded-2xl p-5 md:p-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-warning animate-pulse" />
          <div>
            <p className="text-sm font-medium text-foreground">স্ট্যাটাস: সংযুক্ত নয়</p>
            <p className="text-[11px] text-muted-foreground">API ক্রেডেনশিয়াল দিয়ে সংরক্ষণ করুন কুরিয়ার সার্ভিস অ্যাক্টিভেট করতে।</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourierSettingsPage;
