import { useState } from 'react';
import {
  useProducts, useUpsertProduct, useDeleteProduct, useToggleStock, useToggleFeatured,
} from '@/hooks/useSupabaseData';
import { formatBengaliPrice, toBengaliNum } from '@/lib/bengali';
import {
  Plus, Trash2, Save, Star, StarOff, ToggleLeft, ToggleRight, Pencil, Loader2, Search,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';

const ProductsPage = () => {
  const { data: products, isLoading } = useProducts();
  const upsertProduct = useUpsertProduct();
  const deleteProduct = useDeleteProduct();
  const toggleStock = useToggleStock();
  const toggleFeatured = useToggleFeatured();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '', price: 0, subtitle: '', video_url: '', stock_status: 'in_stock',
    discount_percent: 0, product_type: 'watch', is_featured: false,
    image_urls: '', description_list: '',
  });

  const openNew = () => {
    setEditingId(null);
    setForm({ name: '', price: 0, subtitle: '', video_url: '', stock_status: 'in_stock', discount_percent: 0, product_type: 'watch', is_featured: false, image_urls: '', description_list: '' });
    setSheetOpen(true);
  };

  const openEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      name: p.name, price: p.price, subtitle: p.subtitle || '',
      video_url: p.video_url || '', stock_status: p.stock_status,
      discount_percent: p.discount_percent, product_type: p.product_type,
      is_featured: p.is_featured,
      image_urls: (p.image_urls || []).join('\n'),
      description_list: (p.description_list || []).join('\n'),
    });
    setSheetOpen(true);
  };

  const saveProduct = () => {
    if (!form.name || !form.price) return;
    const imageArr = form.image_urls.split('\n').map(s => s.trim()).filter(Boolean);
    const descArr = form.description_list.split('\n').map(s => s.trim()).filter(Boolean);
    upsertProduct.mutate({
      name: form.name, price: form.price, subtitle: form.subtitle || null,
      video_url: form.video_url || null, stock_status: form.stock_status,
      discount_percent: form.discount_percent, product_type: form.product_type,
      is_featured: form.is_featured, image_urls: imageArr, description_list: descArr,
      thumbnail_url: imageArr[0] || null,
      ...(editingId ? { id: editingId } : {}),
    } as any, { onSuccess: () => setSheetOpen(false) });
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
                        <div className="w-10 h-10 rounded-lg bg-muted" />
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
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-2 rounded-lg hover:bg-muted transition-colors"
                        >
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
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? 'প্রোডাক্ট এডিট' : 'নতুন প্রোডাক্ট'}</SheetTitle>
            <SheetDescription>প্রোডাক্টের সমস্ত তথ্য পূরণ করুন</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <FormField label="নাম *" value={form.name} onChange={v => setForm({ ...form, name: v })} />
            <FormField label="মূল্য *" type="number" value={String(form.price)} onChange={v => setForm({ ...form, price: Number(v) })} />
            <FormField label="সাবটাইটেল" value={form.subtitle} onChange={v => setForm({ ...form, subtitle: v })} />
            <FormField label="ভিডিও URL" value={form.video_url} onChange={v => setForm({ ...form, video_url: v })} />
            <FormField label="ছাড় %" type="number" value={String(form.discount_percent)} onChange={v => setForm({ ...form, discount_percent: Number(v) })} />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">টাইপ</label>
                <select value={form.product_type} onChange={e => setForm({ ...form, product_type: e.target.value })} className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
                  <option value="watch">ঘড়ি</option>
                  <option value="clothing">পোশাক</option>
                  <option value="electronics">ইলেকট্রনিক্স</option>
                  <option value="accessories">আনুষাঙ্গিক</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">স্টক</label>
                <select value={form.stock_status} onChange={e => setForm({ ...form, stock_status: e.target.value })} className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
                  <option value="in_stock">ইন স্টক</option>
                  <option value="out_of_stock">আউট অফ স্টক</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} className="rounded accent-accent" />
              ফিচার্ড প্রোডাক্ট
            </label>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">ছবির URL (প্রতি লাইনে একটি)</label>
              <textarea value={form.image_urls} onChange={e => setForm({ ...form, image_urls: e.target.value })} rows={3} className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm resize-none font-mono focus:outline-none focus:ring-2 focus:ring-accent/30" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">বিবরণ (প্রতি লাইনে একটি)</label>
              <textarea value={form.description_list} onChange={e => setForm({ ...form, description_list: e.target.value })} rows={3} className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/30" />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={saveProduct}
                disabled={upsertProduct.isPending}
                className="flex-1 gradient-gold text-white font-semibold py-3 rounded-xl text-sm hover:opacity-90 flex items-center justify-center gap-2 transition-all shadow-sm"
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
    <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">{label}</label>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
    />
  </div>
);

export default ProductsPage;
