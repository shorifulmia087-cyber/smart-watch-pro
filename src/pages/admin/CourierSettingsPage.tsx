import { useState, useEffect } from 'react';
import { Truck, ExternalLink, Save, Loader2, CheckCircle2, Eye, EyeOff, Wifi, WifiOff, FlaskConical, Rocket } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

type CourierProvider = 'redx' | 'pathao' | 'steadfast';

interface CourierConfig {
  id: string;
  provider: string;
  api_key: string;
  api_secret: string;
  is_active: boolean;
  is_sandbox: boolean;
  sandbox_api_key: string;
  sandbox_api_secret: string;
  production_api_key: string;
  production_api_secret: string;
}

const providers = [
  { id: 'redx' as CourierProvider, name: 'RedX', desc: 'দ্রুত ডেলিভারি সার্ভিস', url: 'https://redx.com.bd', keyLabel: 'Access Token', secretLabel: 'Secret (ঐচ্ছিক)', keyPlaceholder: 'Access Token দিন...', secretPlaceholder: 'Secret (প্রয়োজন হলে)...' },
  { id: 'pathao' as CourierProvider, name: 'Pathao Courier', desc: 'পাঠাও কুরিয়ার সার্ভিস', url: 'https://merchant.pathao.com', keyLabel: 'Store ID', secretLabel: 'Access Token (Bearer)', keyPlaceholder: 'Store ID দিন...', secretPlaceholder: 'Access Token দিন...' },
  { id: 'steadfast' as CourierProvider, name: 'Steadfast Courier', desc: 'স্টেডফাস্ট কুরিয়ার সার্ভিস', url: 'https://steadfast.com.bd', keyLabel: 'API Key', secretLabel: 'Secret Key', keyPlaceholder: 'API Key দিন...', secretPlaceholder: 'Secret Key দিন...' },
];

const CourierSettingsPage = () => {
  const [selectedProvider, setSelectedProvider] = useState<CourierProvider>('redx');
  const [configs, setConfigs] = useState<Record<CourierProvider, CourierConfig>>({} as any);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase.from('courier_settings' as any).select('*');
      if (error) {
        toast({ title: 'ত্রুটি', description: 'কুরিয়ার সেটিংস লোড করতে সমস্যা হয়েছে', variant: 'destructive' });
        setLoading(false);
        return;
      }
      const map: Record<string, CourierConfig> = {};
      (data as any[])?.forEach((row: any) => { map[row.provider] = row; });
      setConfigs(map as any);
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const currentConfig = configs[selectedProvider];
  const currentProvider = providers.find(p => p.id === selectedProvider);
  const isSandbox = currentConfig?.is_sandbox ?? true;

  const updateField = (field: string, value: any) => {
    setConfigs(prev => ({
      ...prev,
      [selectedProvider]: { ...prev[selectedProvider], [field]: value },
    }));
  };

  // Auto-save sandbox toggle immediately to DB
  const toggleSandboxMode = async (newSandboxValue: boolean) => {
    updateField('is_sandbox', newSandboxValue);
    if (!currentConfig?.id) return;
    const { error } = await supabase.from('courier_settings' as any).update({
      is_sandbox: newSandboxValue,
      api_key: newSandboxValue ? (currentConfig.sandbox_api_key || '') : (currentConfig.production_api_key || ''),
      api_secret: newSandboxValue ? (currentConfig.sandbox_api_secret || '') : (currentConfig.production_api_secret || ''),
      updated_at: new Date().toISOString(),
    } as any).eq('id', currentConfig.id);
    if (error) {
      toast({ title: 'ত্রুটি!', description: 'মোড পরিবর্তন সেভ হয়নি', variant: 'destructive' });
      updateField('is_sandbox', !newSandboxValue); // revert
    } else {
      toast({ title: newSandboxValue ? '🧪 টেস্ট মোড সক্রিয়' : '🚀 প্রোডাকশন মোড সক্রিয়', description: `${currentProvider?.name} এর মোড পরিবর্তন সেভ হয়েছে` });
    }
  };

  const handleSave = async () => {
    if (!currentConfig) return;
    setSaving(true);

    const sandboxHasKeys = !!(currentConfig.sandbox_api_key);
    const productionHasKeys = !!(currentConfig.production_api_key);
    const activeMode = currentConfig.is_sandbox ? sandboxHasKeys : productionHasKeys;

    const { error } = await supabase.from('courier_settings' as any).update({
      is_sandbox: currentConfig.is_sandbox,
      sandbox_api_key: currentConfig.sandbox_api_key || '',
      sandbox_api_secret: currentConfig.sandbox_api_secret || '',
      production_api_key: currentConfig.production_api_key || '',
      production_api_secret: currentConfig.production_api_secret || '',
      api_key: currentConfig.is_sandbox ? currentConfig.sandbox_api_key : currentConfig.production_api_key,
      api_secret: currentConfig.is_sandbox ? currentConfig.sandbox_api_secret : currentConfig.production_api_secret,
      is_active: activeMode,
      updated_at: new Date().toISOString(),
    } as any).eq('id', currentConfig.id);

    setSaving(false);
    if (error) {
      toast({ title: 'ত্রুটি!', description: 'সংরক্ষণ করতে সমস্যা হয়েছে', variant: 'destructive' });
      return;
    }
    setConfigs(prev => ({
      ...prev,
      [selectedProvider]: { ...prev[selectedProvider], is_active: activeMode },
    }));
    toast({ title: '✅ সংরক্ষিত!', description: `${currentProvider?.name} API সেটিংস সফলভাবে সংরক্ষিত হয়েছে (${currentConfig.is_sandbox ? 'Sandbox' : 'Production'} মোড)` });
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
            const sandbox = cfg?.is_sandbox ?? true;
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
                    {sandbox ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-warning/15 text-warning border border-warning/20">TEST</span>
                    ) : (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-success/15 text-success border border-success/20">LIVE</span>
                    )}
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
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode Toggle */}
      <div className={`rounded-2xl p-5 md:p-6 border-2 transition-all ${
        isSandbox
          ? 'bg-warning/5 border-warning/30'
          : 'bg-success/5 border-success/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isSandbox ? (
              <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center">
                <FlaskConical className="h-5 w-5 text-warning" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center">
                <Rocket className="h-5 w-5 text-success" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-sm text-foreground">
                API মোড: {isSandbox ? '🧪 টেস্ট (Sandbox)' : '🚀 লাইভ (Production)'}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {isSandbox
                  ? 'টেস্ট মোডে কোনো আসল পার্সেল বুক হবে না। Sandbox API ব্যবহৃত হচ্ছে।'
                  : 'প্রোডাকশন মোডে আসল কুরিয়ার API ব্যবহার হবে। সতর্কতার সাথে ব্যবহার করুন।'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-medium ${isSandbox ? 'text-warning' : 'text-muted-foreground'}`}>Test</span>
            <Switch
              checked={!isSandbox}
              onCheckedChange={(checked) => toggleSandboxMode(!checked)}
            />
            <span className={`text-[11px] font-medium ${!isSandbox ? 'text-success' : 'text-muted-foreground'}`}>Live</span>
          </div>
        </div>
      </div>

      {/* Sandbox Credentials */}
      <div className="glass-card rounded-2xl p-5 md:p-6 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-warning" />
          {currentProvider?.name} — Sandbox ক্রেডেনশিয়াল
        </h3>
        <p className="text-[11px] text-muted-foreground">
          টেস্ট/স্যান্ডবক্স মোডের জন্য API ক্রেডেনশিয়াল দিন। এই মোডে আসল পার্সেল বুক হবে না।
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">{currentProvider?.keyLabel} (Sandbox)</label>
            <input
              type="text"
              value={currentConfig?.sandbox_api_key || ''}
              onChange={e => updateField('sandbox_api_key', e.target.value)}
              placeholder={`Sandbox ${currentProvider?.keyPlaceholder}`}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-warning/30 transition-all font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">{currentProvider?.secretLabel} (Sandbox)</label>
            <div className="relative">
              <input
                type={showSecrets[`${selectedProvider}_sandbox`] ? 'text' : 'password'}
                value={currentConfig?.sandbox_api_secret || ''}
                onChange={e => updateField('sandbox_api_secret', e.target.value)}
                placeholder={`Sandbox ${currentProvider?.secretPlaceholder}`}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-warning/30 transition-all font-mono pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSecrets(prev => ({ ...prev, [`${selectedProvider}_sandbox`]: !prev[`${selectedProvider}_sandbox`] }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showSecrets[`${selectedProvider}_sandbox`] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Production Credentials */}
      <div className="glass-card rounded-2xl p-5 md:p-6 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Rocket className="h-4 w-4 text-success" />
          {currentProvider?.name} — Production ক্রেডেনশিয়াল
        </h3>
        <p className="text-[11px] text-muted-foreground">
          লাইভ/প্রোডাকশন মোডের জন্য আসল API ক্রেডেনশিয়াল দিন। এই মোডে আসল পার্সেল বুক হবে।
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">{currentProvider?.keyLabel} (Production)</label>
            <input
              type="text"
              value={currentConfig?.production_api_key || ''}
              onChange={e => updateField('production_api_key', e.target.value)}
              placeholder={`Production ${currentProvider?.keyPlaceholder}`}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-success/30 transition-all font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">{currentProvider?.secretLabel} (Production)</label>
            <div className="relative">
              <input
                type={showSecrets[`${selectedProvider}_production`] ? 'text' : 'password'}
                value={currentConfig?.production_api_secret || ''}
                onChange={e => updateField('production_api_secret', e.target.value)}
                placeholder={`Production ${currentProvider?.secretPlaceholder}`}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-success/30 transition-all font-mono pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSecrets(prev => ({ ...prev, [`${selectedProvider}_production`]: !prev[`${selectedProvider}_production`] }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showSecrets[`${selectedProvider}_production`] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
          const sandbox = cfg?.is_sandbox ?? true;
          return (
            <div key={p.id} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
              <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-success' : 'bg-warning animate-pulse'}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  {sandbox ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-warning/15 text-warning">SANDBOX</span>
                  ) : (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-success/15 text-success">PRODUCTION</span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {isActive
                    ? `✅ সংযুক্ত — ${sandbox ? 'Sandbox' : 'Production'} API কনফিগার করা আছে`
                    : `⚠️ সংযুক্ত নয় — ${sandbox ? 'Sandbox' : 'Production'} API Key দিন`}
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
