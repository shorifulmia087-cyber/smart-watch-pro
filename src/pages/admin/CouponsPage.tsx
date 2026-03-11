import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Save, Loader2, Tag, ToggleLeft, ToggleRight } from 'lucide-react';
import { toBengaliNum, formatBengaliPrice } from '@/lib/bengali';
import { toast } from 'sonner';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

const useCoupons = () => useQuery({
  queryKey: ['coupons'],
  queryFn: async () => {
    const { data, error } = await supabase.from('coupons' as any).select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data as unknown as Coupon[];
  },
  staleTime: 30_000,
});

const CouponsPage = () => {
  const qc = useQueryClient();
  const { data: coupons, isLoading } = useCoupons();
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrder, setMinOrder] = useState('0');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('coupons' as any).update({ is_active } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('coupons' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('কুপন ডিলিট হয়েছে');
    },
  });

  const handleSave = async () => {
    if (!code.trim() || !discountValue) {
      toast.error('কুপন কোড এবং ডিসকাউন্ট ভ্যালু দিন');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('coupons' as any).insert({
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: parseInt(discountValue),
        min_order_amount: parseInt(minOrder) || 0,
        max_uses: maxUses ? parseInt(maxUses) : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      } as any);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('কুপন তৈরি হয়েছে');
      setShowForm(false);
      setCode(''); setDiscountValue(''); setMinOrder('0'); setMaxUses(''); setExpiresAt('');
    } catch (err: any) {
      toast.error(err.message?.includes('unique') ? 'এই কোড আগে থেকে আছে' : 'সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border/50 rounded-sm p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">কুপন ম্যানেজমেন্ট</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              মোট {toBengaliNum(coupons?.length || 0)} টি কুপন
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-sm gradient-gold text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            নতুন কুপন
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-card border border-border/50 rounded-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">নতুন কুপন তৈরি</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">কুপন কোড *</label>
              <input
                value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="SAVE20"
                className="w-full bg-transparent border border-border/60 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent/30"
                maxLength={20}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">ডিসকাউন্ট টাইপ</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDiscountType('percentage')}
                  className={`flex-1 py-2 rounded-sm border text-sm font-medium transition-all ${discountType === 'percentage' ? 'border-accent bg-accent/10 text-accent' : 'border-border/60 text-muted-foreground'}`}
                >
                  শতাংশ (%)
                </button>
                <button
                  onClick={() => setDiscountType('fixed')}
                  className={`flex-1 py-2 rounded-sm border text-sm font-medium transition-all ${discountType === 'fixed' ? 'border-accent bg-accent/10 text-accent' : 'border-border/60 text-muted-foreground'}`}
                >
                  নির্দিষ্ট (৳)
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">ডিসকাউন্ট ভ্যালু *</label>
              <input
                type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percentage' ? '20' : '500'}
                className="w-full bg-transparent border border-border/60 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">সর্বনিম্ন অর্ডার (৳)</label>
              <input
                type="number" value={minOrder} onChange={e => setMinOrder(e.target.value)}
                className="w-full bg-transparent border border-border/60 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">সর্বোচ্চ ব্যবহার (ঐচ্ছিক)</label>
              <input
                type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)}
                placeholder="সীমাহীন"
                className="w-full bg-transparent border border-border/60 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">মেয়াদ শেষ (ঐচ্ছিক)</label>
              <input
                type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                className="w-full bg-transparent border border-border/60 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              বাতিল
            </button>
            <button
              onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-sm gradient-gold text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              সেভ করুন
            </button>
          </div>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        ) : !coupons?.length ? (
          <div className="text-center py-16">
            <Tag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">কোনো কুপন নেই</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/30">
                <TableHead className="text-xs">কোড</TableHead>
                <TableHead className="text-xs">ডিসকাউন্ট</TableHead>
                <TableHead className="text-xs hidden sm:table-cell">ন্যূনতম অর্ডার</TableHead>
                <TableHead className="text-xs hidden md:table-cell">ব্যবহৃত</TableHead>
                <TableHead className="text-xs">স্ট্যাটাস</TableHead>
                <TableHead className="text-xs text-right">অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map(c => {
                const expired = c.expires_at && new Date(c.expires_at) < new Date();
                const usedUp = c.max_uses !== null && c.used_count >= c.max_uses;
                return (
                  <TableRow key={c.id} className="border-border/20">
                    <TableCell className="font-mono font-bold text-sm text-accent">{c.code}</TableCell>
                    <TableCell className="text-sm">
                      {c.discount_type === 'percentage' ? `${toBengaliNum(c.discount_value)}%` : `৳${formatBengaliPrice(c.discount_value)}`}
                    </TableCell>
                    <TableCell className="text-sm hidden sm:table-cell">৳{formatBengaliPrice(c.min_order_amount)}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">
                      {toBengaliNum(c.used_count)}{c.max_uses ? `/${toBengaliNum(c.max_uses)}` : ''}
                    </TableCell>
                    <TableCell>
                      {expired ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">মেয়াদ শেষ</span>
                      ) : usedUp ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/20">শেষ</span>
                      ) : c.is_active ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">সক্রিয়</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/20">নিষ্ক্রিয়</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => toggleMutation.mutate({ id: c.id, is_active: !c.is_active })}
                          className="p-1.5 rounded-sm hover:bg-muted transition-colors"
                          title={c.is_active ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                        >
                          {c.is_active ? <ToggleRight className="w-4 h-4 text-success" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                        </button>
                        <button
                          onClick={() => { if (confirm('ডিলিট করতে চান?')) deleteMutation.mutate(c.id); }}
                          className="p-1.5 rounded-sm hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default CouponsPage;
