import React, { useState, useMemo } from 'react';
import { Link2, Copy, Check, Plus, Trash2, Download, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/useSupabaseData';

const PRESET_SOURCES = [
  { label: 'Facebook', value: 'facebook', color: 'bg-info/10 text-info border-info/20' },
  { label: 'TikTok', value: 'tiktok', color: 'bg-accent/10 text-accent border-accent/20' },
  { label: 'YouTube', value: 'youtube', color: 'bg-destructive/10 text-destructive border-destructive/20' },
  { label: 'Google Ads', value: 'google_ads', color: 'bg-success/10 text-success border-success/20' },
  { label: 'Instagram', value: 'instagram', color: 'bg-primary/10 text-primary border-primary/20' },
];

const PRESET_MEDIUMS = [
  { label: 'পেইড অ্যাড (CPC)', value: 'cpc' },
  { label: 'অর্গানিক পোস্ট', value: 'organic' },
  { label: 'ভিডিও', value: 'video' },
  { label: 'ব্যানার', value: 'banner' },
  { label: 'ইমেইল', value: 'email' },
];

interface SavedLink {
  id: string;
  name: string;
  url: string;
  source: string;
  medium: string;
  campaign: string;
}

const UtmBuilderPage = () => {
  const { toast } = useToast();
  const { data: settings } = useSettings();

  const [baseUrl, setBaseUrl] = useState('');
  const [source, setSource] = useState('');
  const [medium, setMedium] = useState('');
  const [campaign, setCampaign] = useState('');
  const [copied, setCopied] = useState(false);
  const [savedLinks, setSavedLinks] = useState<SavedLink[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('utm_saved_links') || '[]');
    } catch { return []; }
  });

  // Auto-fill base URL from published domain
  const defaultUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const generatedUrl = useMemo(() => {
    const base = baseUrl.trim() || defaultUrl;
    if (!base) return '';
    const params = new URLSearchParams();
    if (source.trim()) params.set('utm_source', source.trim());
    if (medium.trim()) params.set('utm_medium', medium.trim());
    if (campaign.trim()) params.set('utm_campaign', campaign.trim());
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }, [baseUrl, source, medium, campaign, defaultUrl]);

  const handleCopy = async () => {
    if (!generatedUrl) return;
    await navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    toast({ title: 'কপি হয়েছে!', description: 'লিংকটি ক্লিপবোর্ডে কপি করা হয়েছে।' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!source.trim()) {
      toast({ title: 'সোর্স দিন', description: 'অন্তত utm_source দিতে হবে।', variant: 'destructive' });
      return;
    }
    const newLink: SavedLink = {
      id: Date.now().toString(),
      name: `${source} / ${medium || '—'} / ${campaign || '—'}`,
      url: generatedUrl,
      source, medium, campaign,
    };
    const updated = [newLink, ...savedLinks];
    setSavedLinks(updated);
    localStorage.setItem('utm_saved_links', JSON.stringify(updated));
    toast({ title: 'সেভ হয়েছে!', description: 'লিংকটি সেভ করা হয়েছে।' });
  };

  const handleDelete = (id: string) => {
    const updated = savedLinks.filter(l => l.id !== id);
    setSavedLinks(updated);
    localStorage.setItem('utm_saved_links', JSON.stringify(updated));
  };

  const handleCopyLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast({ title: 'কপি হয়েছে!' });
  };

  return (
    <div className="max-w-[90rem] mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="bg-card border border-border/50 rounded-sm p-4 md:p-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-sm bg-accent/10 flex items-center justify-center">
            <Link2 className="w-4 h-4 text-accent" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">UTM Link Builder</h1>
            <p className="text-[11px] text-muted-foreground">অ্যাড ক্যাম্পেইনের জন্য ট্র্যাকেবল লিংক তৈরি করুন</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Builder Form */}
        <div className="space-y-5">
          <div className="bg-card border border-border/50 rounded-sm p-4 md:p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">লিংক তৈরি করুন</h2>

            {/* Base URL */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">ওয়েবসাইট URL</label>
              <Input
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                placeholder={defaultUrl}
                className="h-9 text-[12px] rounded-sm"
              />
              <p className="text-[10px] text-muted-foreground">খালি রাখলে বর্তমান ডোমেইন ব্যবহার হবে</p>
            </div>

            {/* Source */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">utm_source <span className="text-destructive">*</span></label>
              <Input
                value={source}
                onChange={e => setSource(e.target.value)}
                placeholder="facebook, tiktok, google_ads..."
                className="h-9 text-[12px] rounded-sm"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_SOURCES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setSource(s.value)}
                    className={`px-2.5 py-1 text-[10px] font-medium rounded-sm border transition-all ${
                      source === s.value ? s.color + ' ring-1 ring-offset-1 ring-accent/30' : 'bg-muted/30 text-muted-foreground border-border/30 hover:bg-muted/50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Medium */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">utm_medium</label>
              <Input
                value={medium}
                onChange={e => setMedium(e.target.value)}
                placeholder="cpc, organic, video..."
                className="h-9 text-[12px] rounded-sm"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_MEDIUMS.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setMedium(m.value)}
                    className={`px-2.5 py-1 text-[10px] font-medium rounded-sm border transition-all ${
                      medium === m.value ? 'bg-accent/10 text-accent border-accent/20 ring-1 ring-offset-1 ring-accent/30' : 'bg-muted/30 text-muted-foreground border-border/30 hover:bg-muted/50'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Campaign */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">utm_campaign</label>
              <Input
                value={campaign}
                onChange={e => setCampaign(e.target.value)}
                placeholder="eid_sale, winter_offer, new_launch..."
                className="h-9 text-[12px] rounded-sm"
              />
            </div>
          </div>

          {/* Generated URL */}
          <div className="bg-card border border-border/50 rounded-sm p-4 md:p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">তৈরি হওয়া লিংক</h2>
            <div className="bg-muted/30 border border-border/30 rounded-sm p-3 min-h-[60px] break-all">
              <p className="text-[11px] text-foreground font-mono leading-relaxed">
                {generatedUrl || <span className="text-muted-foreground italic">উপরে তথ্য দিন...</span>}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCopy}
                disabled={!generatedUrl || !source.trim()}
                size="sm"
                className="h-8 text-[11px] rounded-sm gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'কপি হয়েছে' : 'কপি করুন'}
              </Button>
              <Button
                onClick={handleSave}
                disabled={!source.trim()}
                variant="outline"
                size="sm"
                className="h-8 text-[11px] rounded-sm gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                সেভ করুন
              </Button>
              {generatedUrl && source.trim() && (
                <a href={generatedUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="h-8 text-[11px] rounded-sm gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" />
                    টেস্ট
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Saved Links + Guide */}
        <div className="space-y-5">
          {/* Saved Links */}
          <div className="bg-card border border-border/50 rounded-sm p-4 md:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">সেভ করা লিংক</h2>
              <span className="text-[10px] text-muted-foreground">{savedLinks.length}টি</span>
            </div>
            {savedLinks.length === 0 ? (
              <p className="text-[11px] text-muted-foreground py-6 text-center">এখনো কোনো লিংক সেভ করা হয়নি</p>
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto">
                {savedLinks.map(link => (
                  <div key={link.id} className="bg-muted/20 border border-border/30 rounded-sm p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium text-foreground truncate">{link.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">{link.url}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => handleCopyLink(link.url)} className="p-1.5 rounded-sm hover:bg-muted/50 transition-colors">
                          <Copy className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <button onClick={() => handleDelete(link.id)} className="p-1.5 rounded-sm hover:bg-destructive/10 transition-colors">
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Guide */}
          <div className="bg-card border border-border/50 rounded-sm p-4 md:p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">📖 দ্রুত গাইড</h2>
            <div className="space-y-3 text-[11px] text-muted-foreground leading-relaxed">
              <div className="space-y-1">
                <p className="font-medium text-foreground">utm_source (কোথা থেকে?)</p>
                <p>ট্র্যাফিক কোন প্ল্যাটফর্ম থেকে আসছে — facebook, tiktok, google</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">utm_medium (কিভাবে?)</p>
                <p>কিভাবে এসেছে — cpc (পেইড অ্যাড), organic (ফ্রি পোস্ট), video</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">utm_campaign (কোন ক্যাম্পেইন?)</p>
                <p>কোন নির্দিষ্ট ক্যাম্পেইন — eid_sale, winter_offer, new_launch</p>
              </div>
              <div className="mt-3 p-3 bg-accent/5 border border-accent/10 rounded-sm">
                <p className="text-[10px] font-medium text-accent">💡 টিপস</p>
                <ul className="text-[10px] mt-1 space-y-0.5 text-muted-foreground">
                  <li>• প্রতিটি অ্যাড ক্যাম্পেইনের জন্য আলাদা লিংক তৈরি করুন</li>
                  <li>• ক্যাম্পেইনের নাম ইংরেজিতে আন্ডারস্কোর দিয়ে লিখুন</li>
                  <li>• অ্যানালিটিক্স পেজে সোর্স ও ক্যাম্পেইন ভিত্তিক রিপোর্ট দেখুন</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UtmBuilderPage;
