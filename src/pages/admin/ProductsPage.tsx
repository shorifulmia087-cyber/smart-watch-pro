import { useState, useRef } from 'react';
import {
  useProducts, useUpsertProduct, useDeleteProduct, useToggleStock, useToggleFeatured,
} from '@/hooks/useSupabaseData';
import { formatBengaliPrice, toBengaliNum } from '@/lib/bengali';
import {
  Plus, Trash2, Save, Star, StarOff, ToggleLeft, ToggleRight, Pencil, Loader2, Search,
  Upload, X, ImagePlus, GripVertical,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const BUCKET = 'product-images';

const ProductsPage = () => {
  const { data: products, isLoading } = useProducts();
  const upsertProduct = useUpsertProduct();
  const deleteProduct = useDeleteProduct();
  const toggleStock = useToggleStock();
  const toggleFeatured = useToggleFeatured();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '', price: 0, subtitle: '', video_url: '', stock_status: 'in_stock',
    discount_percent: 0, product_type: 'watch', is_featured: false,
    image_urls: [] as string[], description_list: [] as string[],
    features: [] as { icon: string; title: string; desc: string }[],
  });

  const [newDesc, setNewDesc] = useState('');
  const [newFeature, setNewFeature] = useState({ icon: '', title: '', desc: '' });

  const openNew = () => {
    setEditingId(null);
    setForm({
      name: '', price: 0, subtitle: '', video_url: '', stock_status: 'in_stock',
      discount_percent: 0, product_type: 'watch', is_featured: false,
      image_urls: [], description_list: [],
      features: [],
    });
    setNewDesc('');
    setNewFeature({ icon: '', title: '', desc: '' });
    setSheetOpen(true);
  };

  const openEdit = (p: any) => {
    setEditingId(p.id);
    const features = Array.isArray(p.features) ? p.features.map((f: any) => ({
      icon: f.icon || '', title: f.title || '', desc: f.desc || '',
    })) : [];
    setForm({
      name: p.name, price: p.price, subtitle: p.subtitle || '',
      video_url: p.video_url || '', stock_status: p.stock_status,
      discount_percent: p.discount_percent, product_type: p.product_type,
      is_featured: p.is_featured,
      image_urls: p.image_urls || [],
      description_list: p.description_list || [],
      features,
    });
    setNewDesc('');
    setNewFeature({ icon: '', title: '', desc: '' });
    setSheetOpen(true);
  };

  const uploadImages = async (files: FileList) => {
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file);
      if (error) {
        toast({ title: 'আপলোড ত্রুটি', description: error.message, variant: 'destructive' });
        continue;
      }
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }
    setForm(prev => ({ ...prev, image_urls: [...prev.image_urls, ...urls] }));
    setUploading(false);
  };

  const removeImage = (index: number) => {
    setForm(prev => ({ ...prev, image_urls: prev.image_urls.filter((_, i) => i !== index) }));
  };

  const addDescription = () => {
    if (!newDesc.trim()) return;
    setForm(prev => ({ ...prev, description_list: [...prev.description_list, newDesc.trim()] }));
    setNewDesc('');
  };

  const removeDescription = (index: number) => {
    setForm(prev => ({ ...prev, description_list: prev.description_list.filter((_, i) => i !== index) }));
  };

  const addFeature = () => {
    if (!newFeature.title.trim()) return;
    setForm(prev => ({ ...prev, features: [...prev.features, { ...newFeature }] }));
    setNewFeature({ icon: '', title: '', desc: '' });
  };

  const removeFeature = (index: number) => {
    setForm(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
  };

  const saveProduct = () => {
    if (!form.name || !form.price) return;
    upsertProduct.mutate({
      name: form.name, price: form.price, subtitle: form.subtitle || null,
      video_url: form.video_url || null, stock_status: form.stock_status,
      discount_percent: form.discount_percent, product_type: form.product_type,
      is_featured: form.is_featured, image_urls: form.image_urls,
      description_list: form.description_list,
      thumbnail_url: form.image_urls[0] || null,
      features: form.features as any,
      ...(editingId ? { id: editingId } : {}),
    } as any, {
      onSuccess: () => {
        setSheetOpen(false);
        toast({ title: editingId ? 'আপডেট সফল' : 'প্রোডাক্ট তৈরি হয়েছে' });
      },
    });
  };

  const filtered = products?.filter(p =>
    !search.trim() || p.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">প্রোডাক্ট ক্যাটালগ</h2>
          <p className="text-[11px] text-muted-foreground">মোট {toBengaliNum(products?.length ?? 0)} টি প্রোডাক্ট</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 glass-card rounded-xl px-3 py-2 min-w-[200px]">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="প্রোডাক্ট খুঁজুন..."
              className="bg-transparent border-none outline-none w-full text-sm"
            />
          </div>
          <button
            onClick={openNew}
            className="gradient-gold text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 flex items-center gap-2 shrink-0 transition-all duration-200 shadow-sm"
          >
            <Plus className="h-4 w-4" /> নতুন প্রোডাক্ট
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : !filtered.length ? (
        <div className="glass-card rounded-2xl p-16 text-center text-muted-foreground">
          কোনো প্রোডাক্ট পাওয়া যায়নি।
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/60">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-[50px]">ছবি</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">নাম</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">টাইপ</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">মূল্য</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center">ছাড়</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center">স্টক</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center">ফিচার্ড</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id} className="group hover:bg-muted/30 transition-colors cursor-pointer border-b border-border/40" onClick={() => openEdit(p)}>
                    <TableCell>
                      {p.thumbnail_url ? (
                        <img src={p.thumbnail_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-muted" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <ImagePlus className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{p.name}</span>
                        {p.is_featured && <Star className="h-3.5 w-3.5 text-accent fill-accent shrink-0" />}
                      </div>
                      {p.subtitle && <p className="text-[11px] text-muted-foreground">{p.subtitle}</p>}
                    </TableCell>
                    <TableCell>
                      <span className="text-[11px] bg-muted px-2.5 py-1 rounded-full">{p.product_type}</span>
                    </TableCell>
                    <TableCell className="font-inter font-semibold text-sm text-accent">
                      ৳{formatBengaliPrice(p.price)}
                    </TableCell>
                    <TableCell className="text-center font-inter text-sm">
                      {p.discount_percent > 0 ? (
                        <span className="text-accent font-medium">{toBengaliNum(p.discount_percent)}%</span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => toggleStock.mutate({ id: p.id, stock_status: p.stock_status === 'in_stock' ? 'out_of_stock' : 'in_stock' })}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        {p.stock_status === 'in_stock' ? (
                          <ToggleRight className="h-5 w-5 text-success" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => toggleFeatured.mutate({ id: p.id, is_featured: !p.is_featured })}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        {p.is_featured ? (
                          <Star className="h-4 w-4 text-accent fill-accent" />
                        ) : (
                          <StarOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => { if (confirm('এই প্রোডাক্ট মুছে ফেলবেন?')) deleteProduct.mutate(p.id); }}
                          className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? 'প্রোডাক্ট এডিট' : 'নতুন প্রোডাক্ট'}</SheetTitle>
            <SheetDescription>প্রোডাক্টের সমস্ত তথ্য পূরণ করুন</SheetDescription>
          </SheetHeader>
          <div className="space-y-5 mt-6">
            {/* Basic Info */}
            <FormField label="নাম *" value={form.name} onChange={v => setForm({ ...form, name: v })} />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="মূল্য (৳) *" type="number" value={String(form.price)} onChange={v => setForm({ ...form, price: Number(v) })} />
              <FormField label="ছাড় %" type="number" value={String(form.discount_percent)} onChange={v => setForm({ ...form, discount_percent: Number(v) })} />
            </div>
            <FormField label="সাবটাইটেল" value={form.subtitle} onChange={v => setForm({ ...form, subtitle: v })} />
            <FormField label="ভিডিও URL (YouTube ID)" value={form.video_url} onChange={v => setForm({ ...form, video_url: v })} />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">টাইপ</label>
                <select value={form.product_type} onChange={e => setForm({ ...form, product_type: e.target.value })} className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
                  <option value="watch">ঘড়ি</option>
                  <option value="clothing">পোশাক</option>
                  <option value="electronics">ইলেকট্রনিক্স</option>
                  <option value="accessories">আনুষাঙ্গিক</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">স্টক</label>
                <select value={form.stock_status} onChange={e => setForm({ ...form, stock_status: e.target.value })} className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
                  <option value="in_stock">ইন স্টক</option>
                  <option value="out_of_stock">আউট অফ স্টক</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} className="rounded accent-accent" />
              ফিচার্ড প্রোডাক্ট (ওয়েবসাইটে প্রধান প্রোডাক্ট হিসেবে দেখাবে)
            </label>

            {/* Image Upload */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">প্রোডাক্ট ছবি</label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {form.image_urls.map((url, i) => (
                  <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-muted border border-border">
                    <img src={url} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 text-[9px] bg-accent text-white px-1.5 py-0.5 rounded-md font-medium">থাম্বনেইল</span>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-accent/50 flex flex-col items-center justify-center gap-1 transition-colors text-muted-foreground hover:text-accent"
                >
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span className="text-[10px]">আপলোড</span>
                    </>
                  )}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => e.target.files && uploadImages(e.target.files)}
              />
            </div>

            {/* Description List */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">বিবরণ তালিকা</label>
              <div className="space-y-1.5 mb-2">
                {form.description_list.map((desc, i) => (
                  <div key={i} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm">
                    <span className="flex-1">{desc}</span>
                    <button onClick={() => removeDescription(i)} className="text-destructive hover:text-destructive/80">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addDescription()}
                  placeholder="নতুন বিবরণ লিখুন..."
                  className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
                <button onClick={addDescription} className="px-3 py-2 rounded-xl bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors">
                  যোগ
                </button>
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">ফিচার্স (ওয়েবসাইটে দেখাবে)</label>
              <div className="space-y-1.5 mb-2">
                {form.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm">
                    <span className="text-base">{f.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{f.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{f.desc}</p>
                    </div>
                    <button onClick={() => removeFeature(i)} className="text-destructive hover:text-destructive/80 shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="space-y-2 p-3 border border-border rounded-xl bg-muted/30">
                <div className="grid grid-cols-[60px_1fr] gap-2">
                  <input
                    value={newFeature.icon}
                    onChange={e => setNewFeature({ ...newFeature, icon: e.target.value })}
                    placeholder="🛡️"
                    className="bg-muted border border-border rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  <input
                    value={newFeature.title}
                    onChange={e => setNewFeature({ ...newFeature, title: e.target.value })}
                    placeholder="ফিচার শিরোনাম"
                    className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    value={newFeature.desc}
                    onChange={e => setNewFeature({ ...newFeature, desc: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && addFeature()}
                    placeholder="ফিচার বর্ণনা"
                    className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  <button onClick={addFeature} className="px-3 py-2 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors">
                    যোগ
                  </button>
                </div>
              </div>
            </div>

            {/* Save */}
            <div className="flex gap-2 pt-4 pb-8">
              <button
                onClick={saveProduct}
                disabled={upsertProduct.isPending || !form.name || !form.price}
                className="flex-1 gradient-gold text-white font-semibold py-3 rounded-xl text-sm hover:opacity-90 flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
              >
                {upsertProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingId ? 'আপডেট' : 'তৈরি করুন'}
              </button>
              <button onClick={() => setSheetOpen(false)} className="px-5 py-3 rounded-xl text-sm border border-border text-muted-foreground hover:bg-muted transition-colors">
                বাতিল
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

const FormField = ({ label, value, onChange, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) => (
  <div>
    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
    />
  </div>
);

export default ProductsPage;
