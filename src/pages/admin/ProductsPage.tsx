import { useState, useRef, useCallback } from 'react';
import { sanitizeForDisplay } from '@/lib/security';
import {
  useProducts, useProductsLite, useUpsertProduct, useDeleteProduct, useToggleStock, useToggleFeatured,
} from '@/hooks/useSupabaseData';
import { formatBengaliPrice, toBengaliNum } from '@/lib/bengali';
import {
  Plus, Trash2, Save, Star, StarOff, ToggleLeft, ToggleRight, Pencil, Loader2, Search,
  Upload, X, ImagePlus, GripVertical, Package, Palette, Globe, Camera, ListChecks, Sparkles, Tag,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import AdminPagination from '@/components/admin/AdminPagination';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DeleteProductDialog from '@/components/admin/DeleteProductDialog';
import { motion } from 'framer-motion';
import { compressImage, generateThumbnail } from '@/lib/imageCompressor';

const BUCKET = 'product-images';

const ProductsPage = () => {
  const { data: products, isLoading } = useProductsLite();
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
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);

  const [form, setForm] = useState({
    name: '', price: 0, subtitle: '', video_url: '', stock_status: 'in_stock',
    discount_percent: 0, product_type: 'watch', is_featured: false,
    image_urls: [] as string[], description_list: [] as string[],
    features: [] as { icon: string; title: string; desc: string }[],
    sourcing_cost: 0, meta_title: '', meta_description: '',
    available_colors: [] as string[],
    color_variants: [] as { color: string; hex: string; image_url: string }[],
  });

  const [newDesc, setNewDesc] = useState('');
  const [newFeature, setNewFeature] = useState({ icon: '', title: '', desc: '' });
  const [newColor, setNewColor] = useState('');

  // Single image upload state — each image can optionally have a color
  const [singleUploadColor, setSingleUploadColor] = useState('');
  const [singleUploadHex, setSingleUploadHex] = useState('#000000');
  const [singleUploadIsColor, setSingleUploadIsColor] = useState(false);
  const [pendingVariantUrl, setPendingVariantUrl] = useState<string | null>(null);
  const singleFileRef = useRef<HTMLInputElement>(null);

  const openNew = () => {
    setEditingId(null);
    setForm({
      name: '', price: 0, subtitle: '', video_url: '', stock_status: 'in_stock',
      discount_percent: 0, product_type: 'watch', is_featured: false,
      image_urls: [], description_list: [],
      features: [], sourcing_cost: 0, meta_title: '', meta_description: '',
      available_colors: [], color_variants: [],
    });
    setNewDesc('');
    setNewFeature({ icon: '', title: '', desc: '' });
    setNewColor('');
    setSingleUploadColor('');
    setSingleUploadHex('#000000');
    setSingleUploadIsColor(false);
    setSheetOpen(true);
  };

  const openEdit = (p: any) => {
    setEditingId(p.id);
    const features = Array.isArray(p.features) ? p.features.map((f: any) => ({
      icon: f.icon || '', title: f.title || '', desc: f.desc || '',
    })) : [];
    const colorVariants = Array.isArray(p.color_variants) ? p.color_variants.map((v: any) => ({
      color: v.color || '', hex: v.hex || '#000000', image_url: v.image_url || '',
    })) : [];
    setForm({
      name: p.name, price: p.price, subtitle: p.subtitle || '',
      video_url: p.video_url || '', stock_status: p.stock_status,
      discount_percent: p.discount_percent, product_type: p.product_type,
      is_featured: p.is_featured,
      image_urls: p.image_urls || [],
      description_list: p.description_list || [],
      features, sourcing_cost: (p as any).sourcing_cost || 0,
      meta_title: (p as any).meta_title || '', meta_description: (p as any).meta_description || '',
      available_colors: (p as any).available_colors || [],
      color_variants: colorVariants,
    });
    setNewDesc('');
    setNewFeature({ icon: '', title: '', desc: '' });
    setNewColor('');
    setSingleUploadColor('');
    setSingleUploadHex('#000000');
    setSingleUploadIsColor(false);
    setSheetOpen(true);
  };

  // Unified single image upload — optionally with color
  const uploadSingleImage = async (file: File) => {
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const ext = compressed.name.split('.').pop() || 'webp';
      const path = `${singleUploadIsColor ? 'colors/' : ''}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, compressed);
      if (error) {
        toast({ title: 'আপলোড ত্রুটি', description: error.message, variant: 'destructive' });
        return;
      }
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      if (singleUploadIsColor) {
        // Store URL as pending — wait for user to click Save
        setPendingVariantUrl(publicUrl);
        toast({ title: 'ছবি আপলোড হয়েছে — সেভ করুন' });
      } else {
        // Add as regular gallery image
        setForm(prev => ({ ...prev, image_urls: [...prev.image_urls, publicUrl] }));

        // Generate thumbnail
        try {
          const thumb = await generateThumbnail(file);
          const thumbPath = `thumbs/${path}`;
          await supabase.storage.from(BUCKET).upload(thumbPath, thumb);
        } catch { /* ignore thumb error */ }
      }
    } catch {
      toast({ title: 'কম্প্রেশন ত্রুটি', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
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
      name: sanitizeForDisplay(form.name), price: form.price,
      subtitle: form.subtitle ? sanitizeForDisplay(form.subtitle) : null,
      video_url: form.video_url || null, stock_status: form.stock_status,
      discount_percent: form.discount_percent, product_type: form.product_type,
      is_featured: form.is_featured, image_urls: form.image_urls,
      description_list: form.description_list.map(d => sanitizeForDisplay(d)),
      thumbnail_url: form.image_urls[0] || null,
      features: form.features.map(f => ({
        icon: sanitizeForDisplay(f.icon),
        title: sanitizeForDisplay(f.title),
        desc: sanitizeForDisplay(f.desc),
      })) as any,
      sourcing_cost: form.sourcing_cost,
      meta_title: form.meta_title ? sanitizeForDisplay(form.meta_title) : null,
      meta_description: form.meta_description ? sanitizeForDisplay(form.meta_description) : null,
      available_colors: form.available_colors.map(c => sanitizeForDisplay(c)),
      color_variants: form.color_variants as any,
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
    <div className="space-y-5 w-full">
      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-4 md:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">প্রোডাক্ট ক্যাটালগ</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">মোট {toBengaliNum(products?.length ?? 0)} টি প্রোডাক্ট</p>
          </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/30 border border-border/40 rounded-sm px-3 py-2 min-w-[200px]">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="প্রোডাক্ট খুঁজুন..."
              className="bg-transparent border-none outline-none w-full text-sm"
            />
          </div>
          <button
            onClick={openNew}
            className="gradient-gold text-white font-semibold px-5 py-2.5 rounded-sm text-sm hover:opacity-90 flex items-center gap-2 shrink-0 transition-all duration-200 shadow-sm"
          >
            <Plus className="h-4 w-4" /> নতুন প্রোডাক্ট
          </button>
        </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-sm" />)}
        </div>
      ) : !filtered.length ? (
        <div className="bg-surface dark:bg-card rounded-sm border border-border/30 p-16 text-center text-muted-foreground shadow-sm">
          কোনো প্রোডাক্ট পাওয়া যায়নি।
        </div>
      ) : (
        <div className="bg-surface dark:bg-card rounded-sm border border-border/30 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/40">
                  <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 w-[70px]">ছবি</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">নাম</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">টাইপ</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">মূল্য</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 text-center w-[60px]">ছাড়</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 text-center w-[70px]">স্টক</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 text-center w-[70px]">ফিচার্ড</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 text-right w-[100px]">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(page * pageSize, (page + 1) * pageSize).map((p) => (
                  <TableRow key={p.id} className="group hover:bg-muted/20 transition-colors cursor-pointer border-b border-border/30" onClick={() => openEdit(p)}>
                    <TableCell className="py-3">
                      {p.thumbnail_url ? (
                        <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-border/40 ring-offset-2 ring-offset-background shadow-md group-hover:ring-accent/40 transition-all">
                          <img src={p.thumbnail_url} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-muted/60 ring-2 ring-border/30 ring-offset-2 ring-offset-background flex items-center justify-center shadow-sm">
                          <ImagePlus className="w-5 h-5 text-muted-foreground/50" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-3 max-w-[200px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-sm truncate">{p.name}</span>
                        {p.is_featured && <Star className="h-3.5 w-3.5 text-accent fill-accent shrink-0" />}
                      </div>
                      {p.subtitle && <p className="text-[11px] text-muted-foreground truncate">{p.subtitle}</p>}
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-[11px] bg-muted px-2.5 py-1 rounded-full">{p.product_type}</span>
                    </TableCell>
                    <TableCell className="py-3 font-inter font-semibold text-sm text-accent">
                      ৳{formatBengaliPrice(p.price)}
                    </TableCell>
                    <TableCell className="py-3 text-center font-inter text-sm">
                      {p.discount_percent > 0 ? (
                        <span className="text-accent font-medium">{toBengaliNum(p.discount_percent)}%</span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="py-3 text-center" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => toggleStock.mutate({ id: p.id, stock_status: p.stock_status === 'in_stock' ? 'out_of_stock' : 'in_stock' })}
                        className={`relative inline-flex h-[22px] w-[40px] items-center rounded-full transition-colors duration-300 focus:outline-none ${
                          p.stock_status === 'in_stock' ? 'bg-success' : 'bg-muted-foreground/25'
                        }`}
                      >
                        <span
                          className={`inline-block h-[16px] w-[16px] rounded-full bg-background shadow transition-transform duration-300 ${
                            p.stock_status === 'in_stock' ? 'translate-x-[20px]' : 'translate-x-[3px]'
                          }`}
                        />
                      </button>
                    </TableCell>
                    <TableCell className="py-3 text-center" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => toggleFeatured.mutate({ id: p.id, is_featured: !p.is_featured })}
                        className={`relative inline-flex h-[22px] w-[40px] items-center rounded-full transition-colors duration-300 focus:outline-none ${
                          p.is_featured ? 'bg-accent' : 'bg-muted-foreground/25'
                        }`}
                      >
                        <span
                          className={`inline-block h-[16px] w-[16px] rounded-full bg-background shadow transition-transform duration-300 ${
                            p.is_featured ? 'translate-x-[20px]' : 'translate-x-[3px]'
                          }`}
                        />
                      </button>
                    </TableCell>
                    <TableCell className="py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2.5">
                        <button onClick={() => openEdit(p)} className="p-2 rounded-full text-info/70 hover:text-info hover:bg-info/10 transition-all">
                          <Pencil className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: p.id, name: p.name })}
                          className="p-2 rounded-full text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-all"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <AdminPagination
            currentPage={page}
            totalPages={Math.ceil(filtered.length / pageSize)}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={s => { setPageSize(s); setPage(0); }}
          />
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-5xl overflow-y-auto p-0 border-l border-border/20 shadow-2xl bg-ash dark:bg-background">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-surface dark:bg-card border-b border-border/30">
            <div className="px-4 md:px-8 py-4">
              <div className="flex items-center justify-between">
                <SheetHeader className="space-y-0">
                  <SheetTitle className="text-lg font-bold text-ink dark:text-foreground flex items-center gap-3">
                    <div className="w-9 h-9 rounded-sm gradient-gold flex items-center justify-center shadow-sm">
                      {editingId ? <Pencil className="h-4 w-4 text-white" /> : <Plus className="h-4 w-4 text-white" />}
                    </div>
                    {editingId ? 'প্রোডাক্ট এডিট' : 'নতুন প্রোডাক্ট'}
                  </SheetTitle>
                  <SheetDescription className="sr-only">প্রোডাক্ট ফর্ম</SheetDescription>
                </SheetHeader>
                <div className="flex items-center gap-3">
                  <button onClick={() => setSheetOpen(false)} className="px-4 py-2 rounded-sm text-sm border border-border/60 text-muted-foreground hover:bg-muted/50 transition-colors font-medium">
                    বাতিল
                  </button>
                  <motion.button
                    onClick={saveProduct}
                    disabled={upsertProduct.isPending || !form.name || !form.price}
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.02 }}
                    className="px-5 py-2 rounded-sm gradient-gold text-white text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50 hover:opacity-90"
                    style={{ boxShadow: '0 4px 16px -4px hsl(var(--gold) / 0.4)' }}
                  >
                    {upsertProduct.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {editingId ? 'আপডেট করুন' : 'তৈরি করুন'}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Grid Layout */}
          <div className="px-4 md:px-8 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* ─── Primary Column (Left 3/5) ─── */}
              <div className="lg:col-span-3 space-y-4">
                {/* Basic Info */}
                <BentoCard title="মৌলিক তথ্য" icon={<Package className="w-4 h-4" />}>
                  <BentoField label="প্রোডাক্ট নাম *" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="প্রোডাক্টের নাম লিখুন" />
                  <BentoField label="সাবটাইটেল" value={form.subtitle} onChange={v => setForm({ ...form, subtitle: v })} placeholder="সংক্ষিপ্ত বিবরণ" />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">প্রোডাক্ট টাইপ</label>
                      <select value={form.product_type} onChange={e => setForm({ ...form, product_type: e.target.value })} className="w-full bg-transparent border border-border/60 rounded-sm px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold/40 transition-all">
                        <option value="watch">ঘড়ি</option>
                        <option value="clothing">পোশাক</option>
                        <option value="electronics">ইলেকট্রনিক্স</option>
                        <option value="accessories">আনুষাঙ্গিক</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">স্টক স্ট্যাটাস</label>
                      <select value={form.stock_status} onChange={e => setForm({ ...form, stock_status: e.target.value })} className="w-full bg-transparent border border-border/60 rounded-sm px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold/40 transition-all">
                        <option value="in_stock">ইন স্টক</option>
                        <option value="out_of_stock">আউট অফ স্টক</option>
                      </select>
                    </div>
                  </div>
                  <BentoField label="ভিডিও URL (YouTube ID)" value={form.video_url} onChange={v => setForm({ ...form, video_url: v })} placeholder="dQw4w9WgXcQ" />
                  <label className="flex items-center gap-3 text-sm cursor-pointer rounded-sm px-4 py-3 border border-gold/15 bg-gold/5 hover:bg-gold/10 transition-colors group">
                    <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} className="rounded accent-gold w-4 h-4" />
                    <div>
                      <span className="font-semibold text-foreground text-sm group-hover:text-gold transition-colors">⭐ ফিচার্ড প্রোডাক্ট</span>
                      <p className="text-[11px] text-muted-foreground">হোমপেজে হাইলাইট হবে</p>
                    </div>
                  </label>
                </BentoCard>

                {/* Description List */}
                <BentoCard title="বিবরণ তালিকা" icon={<ListChecks className="w-4 h-4" />}>
                  <div className="space-y-2">
                    {form.description_list.map((desc, i) => (
                      <motion.div key={i} initial={{ x: -8, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-3 bg-muted/30 border border-border/30 rounded-sm px-3 py-2.5 text-sm group hover:border-border/60 transition-all">
                        <span className="w-5 h-5 rounded-sm bg-gold/15 text-gold text-[10px] flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                        <span className="flex-1 text-foreground">{desc}</span>
                        <button onClick={() => removeDescription(i)} className="text-muted-foreground/30 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={newDesc} onChange={e => setNewDesc(e.target.value)} onKeyDown={e => e.key === 'Enter' && addDescription()} placeholder="নতুন বিবরণ লিখুন..." className="flex-1 bg-transparent border border-border/60 rounded-sm px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold/40 transition-all placeholder:text-muted-foreground" />
                    <button onClick={addDescription} className="px-3.5 py-2.5 rounded-sm gradient-gold text-white text-sm hover:opacity-90 transition-all shadow-sm">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </BentoCard>

                {/* Features */}
                <BentoCard title="ফিচার্স (কেন বেছে নেবেন)" icon={<Sparkles className="w-4 h-4" />} badge="ওয়েবসাইটে দেখাবে">
                  <div className="space-y-2">
                    {form.features.map((f, i) => (
                      <motion.div key={i} initial={{ x: -8, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-3 bg-muted/20 border border-border/30 rounded-sm px-3 py-3 group hover:border-border/60 transition-all">
                        <GripVertical className="w-4 h-4 text-muted-foreground/30 shrink-0 cursor-grab hover:text-gold transition-colors" />
                        <span className="text-lg w-8 h-8 flex items-center justify-center bg-muted rounded-sm shrink-0">{f.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{f.title}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{f.desc}</p>
                        </div>
                        <button onClick={() => removeFeature(i)} className="text-muted-foreground/30 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                  <div className="space-y-2 p-3.5 border border-dashed border-border/40 rounded-sm bg-muted/10">
                    <div className="grid grid-cols-[56px_1fr] gap-2">
                      <input value={newFeature.icon} onChange={e => setNewFeature({ ...newFeature, icon: e.target.value })} placeholder="🛡️" className="bg-transparent border border-border/60 rounded-sm px-2 py-2.5 text-sm text-center text-foreground focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all" />
                      <input value={newFeature.title} onChange={e => setNewFeature({ ...newFeature, title: e.target.value })} placeholder="ফিচার শিরোনাম" className="bg-transparent border border-border/60 rounded-sm px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all placeholder:text-muted-foreground" />
                    </div>
                    <div className="flex gap-2">
                      <input value={newFeature.desc} onChange={e => setNewFeature({ ...newFeature, desc: e.target.value })} onKeyDown={e => e.key === 'Enter' && addFeature()} placeholder="ফিচার বর্ণনা" className="flex-1 bg-transparent border border-border/60 rounded-sm px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all placeholder:text-muted-foreground" />
                      <button onClick={addFeature} className="px-3.5 py-2.5 rounded-sm gradient-gold text-white text-sm hover:opacity-90 transition-all shadow-sm">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </BentoCard>
              </div>

              {/* ─── Secondary Column (Right 2/5) ─── */}
              <div className="lg:col-span-2 space-y-4">
                {/* Unified Image Upload */}
                <BentoCard title="ছবি আপলোড" icon={<Camera className="w-4 h-4" />} badge="গ্যালারি + কালার">
                  {/* Existing gallery images */}
                  {form.image_urls.length > 0 && (
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground mb-2">গ্যালারি ছবি</p>
                      <div className="grid grid-cols-3 gap-2">
                        {form.image_urls.map((url, i) => (
                          <div key={i} className="relative group aspect-square rounded-sm overflow-hidden bg-muted border border-border/30 hover:shadow-lg transition-all">
                            <img src={url} alt={`Product ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <button onClick={() => removeImage(i)} className="absolute top-1 right-1 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-lg">
                              <X className="w-3 h-3" />
                            </button>
                            {i === 0 && <span className="absolute bottom-1 left-1 text-[8px] gradient-gold text-white px-1.5 py-0.5 rounded-sm font-medium shadow-sm">থাম্বনেইল</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Existing color variants */}
                  {form.color_variants.length > 0 && (
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground mb-2">কালার ভ্যারিয়েন্ট</p>
                      <div className="space-y-2">
                        {form.color_variants.map((variant, i) => (
                          <motion.div key={i} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2.5 bg-muted/20 border border-border/30 rounded-sm p-2 group hover:border-border/60 transition-all">
                            <div className="w-12 h-12 rounded-sm overflow-hidden border border-border/40 shrink-0">
                              <img src={variant.image_url} alt={variant.color} className="w-full h-full object-cover" />
                            </div>
                            <span className="w-5 h-5 rounded-full border-2 border-border shrink-0 shadow-inner" style={{ backgroundColor: variant.hex }} />
                            <span className="font-medium text-sm text-foreground flex-1 truncate">{variant.color}</span>
                            <button onClick={() => setForm(prev => ({ ...prev, color_variants: prev.color_variants.filter((_, idx) => idx !== i) }))} className="text-muted-foreground/30 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload area — toggle between gallery & color */}
                  <div className="space-y-3 p-3.5 border border-dashed border-border/40 rounded-sm bg-muted/10">
                    {/* Toggle: gallery vs color variant */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSingleUploadIsColor(false)}
                        className={`flex-1 py-2 rounded-sm text-xs font-semibold text-center transition-all border ${
                          !singleUploadIsColor
                            ? 'gradient-gold text-white border-gold/40 shadow-sm'
                            : 'bg-transparent text-muted-foreground border-border/40 hover:border-gold/30'
                        }`}
                      >
                        📷 গ্যালারি ছবি
                      </button>
                      <button
                        onClick={() => setSingleUploadIsColor(true)}
                        className={`flex-1 py-2 rounded-sm text-xs font-semibold text-center transition-all border ${
                          singleUploadIsColor
                            ? 'gradient-gold text-white border-gold/40 shadow-sm'
                            : 'bg-transparent text-muted-foreground border-border/40 hover:border-gold/30'
                        }`}
                      >
                        🎨 কালার ভ্যারিয়েন্ট
                      </button>
                    </div>

                    {/* Color fields — show AFTER image is uploaded in color mode */}
                    {singleUploadIsColor && !pendingVariantUrl && (
                      <div className="text-center text-xs text-muted-foreground py-2">
                        প্রথমে ছবি আপলোড করুন, তারপর কালার সেট করুন
                      </div>
                    )}

                    {/* Upload button — always visible unless pending variant exists */}
                    {!pendingVariantUrl && (
                      <button
                        onClick={() => singleFileRef.current?.click()}
                        disabled={uploading}
                        className="w-full py-7 rounded-sm border-2 border-dashed border-border/40 hover:border-gold/50 flex flex-col items-center justify-center gap-1.5 transition-all text-muted-foreground hover:text-gold hover:bg-gold/5 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                          <>
                            {singleUploadIsColor ? <Palette className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                            <span className="text-xs font-medium">
                              {singleUploadIsColor ? 'কালার ভ্যারিয়েন্টের ছবি আপলোড করুন' : 'গ্যালারি ছবি আপলোড করুন'}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60">PNG, JPG, WebP</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Pending variant: image uploaded, now fill color + save */}
                    {singleUploadIsColor && pendingVariantUrl && (
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="space-y-3 p-3 bg-gold/5 border border-gold/30 rounded-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-16 h-16 rounded-sm overflow-hidden border border-border/40 shrink-0">
                            <img src={pendingVariantUrl} alt="preview" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gold mb-1">✓ ছবি আপলোড হয়েছে</p>
                            <p className="text-[11px] text-muted-foreground">এখন কালার নাম ও কোড দিন</p>
                          </div>
                          <button
                            onClick={() => setPendingVariantUrl(null)}
                            className="p-1.5 rounded-sm border border-border/40 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-all shrink-0"
                            title="বাতিল"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-[1fr_52px] gap-2">
                          <input
                            value={singleUploadColor}
                            onChange={e => setSingleUploadColor(e.target.value)}
                            placeholder="কালারের নাম (যেমন: কালো)"
                            className="bg-transparent border border-border/60 rounded-sm px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all placeholder:text-muted-foreground"
                            autoFocus
                          />
                          <input
                            type="color"
                            value={singleUploadHex}
                            onChange={e => setSingleUploadHex(e.target.value)}
                            className="w-full h-[42px] rounded-sm border border-border/60 cursor-pointer bg-transparent"
                            title="কালার পিক করুন"
                          />
                        </div>

                        <button
                          onClick={() => {
                            if (!singleUploadColor.trim()) {
                              toast({ title: 'কালারের নাম লিখুন', variant: 'destructive' });
                              return;
                            }
                            setForm(prev => ({
                              ...prev,
                              color_variants: [...prev.color_variants, { color: singleUploadColor.trim(), hex: singleUploadHex, image_url: pendingVariantUrl! }],
                            }));
                            setPendingVariantUrl(null);
                            setSingleUploadColor('');
                            setSingleUploadHex('#000000');
                            toast({ title: 'কালার ভ্যারিয়েন্ট সেভ হয়েছে ✓' });
                          }}
                          className="w-full py-2.5 rounded-sm gradient-gold text-white text-sm font-semibold hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                          <Save className="w-4 h-4" /> সেভ করুন
                        </button>
                      </motion.div>
                    )}

                    <input
                      ref={singleFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        if (e.target.files?.[0]) uploadSingleImage(e.target.files[0]);
                        e.target.value = '';
                      }}
                    />
                  </div>
                </BentoCard>

                {/* Pricing */}
                <BentoCard title="মূল্য ও খরচ" icon={<Tag className="w-4 h-4" />}>
                  <BentoField label="বিক্রয় মূল্য (৳) *" type="number" value={String(form.price)} onChange={v => setForm({ ...form, price: Number(v) })} placeholder="0" />
                  <BentoField label="সোর্সিং কস্ট (৳)" type="number" value={String(form.sourcing_cost)} onChange={v => setForm({ ...form, sourcing_cost: Number(v) })} placeholder="0" />
                  <BentoField label="ছাড় %" type="number" value={String(form.discount_percent)} onChange={v => setForm({ ...form, discount_percent: Number(v) })} placeholder="0" />
                  {form.price > 0 && form.sourcing_cost > 0 && (
                    <div className="flex items-center justify-between px-3 py-2.5 rounded-sm bg-success/10 border border-success/20">
                      <span className="text-[11px] font-medium text-success">লাভ</span>
                      <span className="text-sm font-bold text-success font-inter">৳{formatBengaliPrice(form.price - form.sourcing_cost)}</span>
                    </div>
                  )}
                </BentoCard>

                {/* SEO */}
                <BentoCard title="SEO সেটিংস" icon={<Globe className="w-4 h-4" />}>
                  <BentoField label="Meta Title" value={form.meta_title} onChange={v => setForm({ ...form, meta_title: v })} placeholder="সার্চ ইঞ্জিনে দেখানো শিরোনাম" />
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Meta Description</label>
                    <textarea value={form.meta_description} onChange={e => setForm({ ...form, meta_description: e.target.value })} rows={3} placeholder="সার্চ ইঞ্জিনে দেখানো বিবরণ..." className="w-full bg-transparent border border-border/60 rounded-sm px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold/40 transition-all resize-none placeholder:text-muted-foreground" />
                  </div>
                </BentoCard>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <DeleteProductDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteProduct.mutate(deleteTarget.id, {
              onSuccess: () => {
                setDeleteTarget(null);
                toast({ title: 'প্রোডাক্ট মুছে ফেলা হয়েছে' });
              },
            });
          }
        }}
        productName={deleteTarget?.name || ''}
        isDeleting={deleteProduct.isPending}
      />
    </div>
  );
};

/* ─── Bento Card ──────────────────────────────────── */
const BentoCard = ({ title, icon, badge, children }: {
  title: string; icon: React.ReactNode; badge?: string; children: React.ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="rounded-sm bg-surface dark:bg-card border border-border/30 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
  >
    <div className="px-5 py-3 border-b border-border/20 flex items-center gap-2.5">
      <span className="text-gold">{icon}</span>
      <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{title}</h3>
      {badge && <span className="text-[10px] text-muted-foreground/60 ml-auto bg-gold/10 text-gold px-2 py-0.5 rounded-full border border-gold/15 font-medium">{badge}</span>}
    </div>
    <div className="p-5 space-y-4">{children}</div>
  </motion.div>
);

/* ─── Bento Field ──────────────────────────────────── */
const BentoField = ({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) => (
  <div>
    <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">{label}</label>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-transparent border border-border/60 rounded-sm px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold/40 transition-all placeholder:text-muted-foreground"
    />
  </div>
);

export default ProductsPage;
