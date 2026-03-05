import { useState, useEffect } from 'react';
import { Truck, ExternalLink, Save, Loader2, CheckCircle2, Eye, EyeOff, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type CourierProvider = 'redx' | 'pathao' | 'steadfast';

interface CourierConfig {
  id: string;
  provider: string;
  api_key: string;
  api_secret: string;
  is_active: boolean;
}

const providers = [
  { id: 'redx' as CourierProvider, name: 'RedX', desc: 'দ্রুত ডেলিভারি সার্ভিস', url: 'https://redx.com.bd', keyLabel: 'Access Token', secretLabel: 'Secret (ঐচ্ছিক)', keyPlaceholder: 'RedX Access Token দিন...', secretPlaceholder: 'RedX Secret (প্রয়োজন হলে)...' },
  { id: 'pathao' as CourierProvider, name: 'Pathao Courier', desc: 'পাঠাও কুরিয়ার সার্ভিস', url: 'https://merchant.pathao.com', keyLabel: 'Store ID', secretLabel: 'Access Token (Bearer)', keyPlaceholder: 'Pathao Store ID দিন...', secretPlaceholder: 'Pathao Access Token দিন...' },
  { id: 'steadfast' as CourierProvider, name: 'Steadfast Courier', desc: 'স্টেডফাস্ট কুরিয়ার সার্ভিস', url: 'https://steadfast.com.bd', keyLabel: 'API Key', secretLabel: 'Secret Key', keyPlaceholder: 'Steadfast API Key দিন...', secretPlaceholder: 'Steadfast Secret Key দিন...' },
];

const CourierSettingsPage = () => {
  const [selectedProvider, setSelectedProvider] = useState<CourierProvider>('redx');
  const [configs, setConfigs] = useState<Record<CourierProvider, CourierConfig>>({} as any);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<CourierProvider, boolean>>({ redx: false, pathao: false, steadfast: false });
  const { toast } = useToast();

  // Load all courier settings from DB
  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase.from('courier_settings' as any).select('*');
      if (error) {
        toast({ title: 'ত্রুটি', description: 'কুরিয়ার সেটিংস লোড করতে সমস্যা হয়েছে', variant: 'destructive' });
        setLoading(false);
        return;
      }
      const map: Record<string, CourierConfig> = {};
      (data as any[])?.forEach((row: any) => {
        map[row.provider] = row;
      });
      setConfigs(map as any);
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const currentConfig = configs[selectedProvider];
  const currentProvider = providers.find(p => p.id === selectedProvider);

  const updateLocalConfig = (field: 'api_key' | 'api_secret', value: string) => {
    setConfigs(prev => ({
      ...prev,
      [selectedProvider]: { ...prev[selectedProvider], [field]: value },
    }));
  };

  const handleSave = async () => {
    if (!currentConfig) return;
    setSaving(true);
    const { error } = await supabase.from('courier_settings' as any).update({
      api_key: currentConfig.api_key,
      api_secret: currentConfig.api_secret,
      is_active: !!(currentConfig.api_key && currentConfig.api_secret),
      updated_at: new Date().toISOString(),
    } as any).eq('id', currentConfig.id);

    setSaving(false);
    if (error) {
      toast({ title: 'ত্রুটি!', description: 'সংরক্ষণ করতে সমস্যা হয়েছে', variant: 'destructive' });
      return;
    }
    // Update local is_active
    setConfigs(prev => ({
      ...prev,
      [selectedProvider]: {
        ...prev[selectedProvider],
        is_active: !!(currentConfig.api_key && currentConfig.api_secret),
      },
    }));
    toast({ title: '✅ সংরক্ষিত!', description: `${providers.find(p => p.id === selectedProvider)?.name} API সেটিংস সফলভাবে সংরক্ষিত হয়েছে` });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[900px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">কুরিয়ার ইন্টিগ্রেশন</h2>
          <p className="text-[11px] text-muted-foreground">প্রতিটি কুরিয়ার সার্ভিসের জন্য আলাদা API কনফিগার করুন</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="gradient-gold text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 flex items-center gap-2 transition-all shadow-sm"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          সংরক্ষণ করুন
        </button>
      </div>

      {/* Provider Selection */}
      <div className="glass-card rounded-2xl p-5 md:p-6 space-y-5">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Truck className="h-4 w-4 text-accent" /> কুরিয়ার প্রোভাইডার নির্বাচন করুন
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {providers.map(p => {
            const cfg = configs[p.id];
            const isActive = cfg?.is_active;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedProvider(p.id)}
                className={`text-left p-4 rounded-xl border-2 transition-all duration-200 relative ${
                  selectedProvider === p.id
                    ? 'border-accent bg-accent/5 shadow-sm'
                    : 'border-border hover:border-accent/40 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm text-foreground">{p.name}</p>
                  <div className="flex items-center gap-2">
                    {isActive ? (
                      <Wifi className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <a href={p.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-accent" />
                    </a>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{p.desc}</p>
                {isActive && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-success" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* API Credentials for selected provider */}
      <div className="glass-card rounded-2xl p-5 md:p-6 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-info" />
          {currentProvider?.name} — API ক্রেডেনশিয়াল
        </h3>
        <p className="text-[11px] text-muted-foreground">
          {currentProvider?.name} ড্যাশবোর্ড থেকে নিচের তথ্যগুলো সংগ্রহ করে এখানে দিন। সংরক্ষণ করলে ডাটাবেসে নিরাপদে সেভ হবে।
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">{currentProvider?.keyLabel}</label>
            <input
              type="text"
              value={currentConfig?.api_key || ''}
              onChange={e => updateLocalConfig('api_key', e.target.value)}
              placeholder={currentProvider?.keyPlaceholder}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">{currentProvider?.secretLabel}</label>
            <div className="relative">
              <input
                type={showSecrets[selectedProvider] ? 'text' : 'password'}
                value={currentConfig?.api_secret || ''}
                onChange={e => updateLocalConfig('api_secret', e.target.value)}
                placeholder={currentProvider?.secretPlaceholder}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all font-mono pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSecrets(prev => ({ ...prev, [selectedProvider]: !prev[selectedProvider] }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showSecrets[selectedProvider] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status for each provider */}
      <div className="glass-card rounded-2xl p-5 md:p-6 space-y-3">
        <h3 className="font-semibold text-sm mb-3">সকল কুরিয়ার স্ট্যাটাস</h3>
        {providers.map(p => {
          const cfg = configs[p.id];
          const isActive = cfg?.is_active;
          return (
            <div key={p.id} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
              <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-success' : 'bg-warning animate-pulse'}`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{p.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {isActive ? '✅ সংযুক্ত — API কনফিগার করা আছে' : '⚠️ সংযুক্ত নয় — API Key ও Secret দিন'}
                </p>
              </div>
              {isActive && <CheckCircle2 className="h-4 w-4 text-success" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CourierSettingsPage;
