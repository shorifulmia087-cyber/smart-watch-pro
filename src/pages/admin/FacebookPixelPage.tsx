import { useState } from 'react';
import { Save, Loader2, CheckCircle2, Activity, Eye, ShoppingCart, CreditCard } from 'lucide-react';

const events = [
  { id: 'PageView', label: 'পেজ ভিউ', icon: Eye, desc: 'প্রতিটি পেজ ভিজিটে ফায়ার হবে' },
  { id: 'ViewContent', label: 'কন্টেন্ট ভিউ', icon: Eye, desc: 'প্রোডাক্ট পেজ দেখলে' },
  { id: 'AddToCart', label: 'কার্টে যোগ', icon: ShoppingCart, desc: 'অর্ডার ফর্ম ওপেন করলে' },
  { id: 'Purchase', label: 'পারচেজ', icon: CreditCard, desc: 'অর্ডার কমপ্লিট হলে' },
];

const FacebookPixelPage = () => {
  const [pixelId, setPixelId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [enabledEvents, setEnabledEvents] = useState<string[]>(['PageView', 'Purchase']);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleEvent = (id: string) => {
    setEnabledEvents(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
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
    <div className="space-y-6 max-w-[900px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Facebook Pixel</h2>
          <p className="text-[11px] text-muted-foreground">সার্ভার-সাইড ইভেন্ট ট্র্যাকিং কনফিগার করুন</p>
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

      {/* Credentials */}
      <div className="glass-card rounded-2xl p-5 md:p-6 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Activity className="h-4 w-4 text-info" /> Pixel ক্রেডেনশিয়াল
        </h3>
        <p className="text-[11px] text-muted-foreground">
          Facebook Events Manager থেকে Pixel ID এবং Conversions API Access Token সংগ্রহ করুন।
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Pixel ID</label>
            <input
              type="text" value={pixelId} onChange={e => setPixelId(e.target.value)}
              placeholder="যেমন: 123456789012345"
              className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Access Token (Conversions API)</label>
            <input
              type="password" value={accessToken} onChange={e => setAccessToken(e.target.value)}
              placeholder="আপনার Access Token দিন..."
              className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all font-mono"
            />
          </div>
        </div>
      </div>

      {/* Event Tracking */}
      <div className="glass-card rounded-2xl p-5 md:p-6 space-y-4">
        <h3 className="font-semibold text-sm">ইভেন্ট ট্র্যাকিং</h3>
        <p className="text-[11px] text-muted-foreground">কোন ইভেন্টগুলো ট্র্যাক করতে চান সিলেক্ট করুন।</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {events.map(ev => (
            <button
              key={ev.id}
              onClick={() => toggleEvent(ev.id)}
              className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                enabledEvents.includes(ev.id)
                  ? 'border-accent bg-accent/5 shadow-sm'
                  : 'border-border hover:border-accent/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  enabledEvents.includes(ev.id) ? 'bg-accent/10' : 'bg-muted'
                }`}>
                  <ev.icon className={`h-4 w-4 ${enabledEvents.includes(ev.id) ? 'text-accent' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{ev.label}</p>
                  <p className="text-[10px] text-muted-foreground">{ev.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="glass-card rounded-2xl p-5 md:p-6">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${pixelId ? 'bg-success' : 'bg-warning'} animate-pulse`} />
          <div>
            <p className="text-sm font-medium text-foreground">
              স্ট্যাটাস: {pixelId ? 'কনফিগার করা হয়েছে' : 'কনফিগার করা হয়নি'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {pixelId ? `Pixel ID: ${pixelId}` : 'Pixel ID দিন এবং সংরক্ষণ করুন।'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacebookPixelPage;
