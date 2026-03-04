import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  useOrders, useUpdateOrderStatus,
  useProducts, useUpsertProduct, useDeleteProduct, useToggleStock, useToggleFeatured,
  useSettings, useUpdateSettings,
} from '@/hooks/useSupabaseData';
import { formatBengaliPrice, toBengaliNum } from '@/lib/bengali';
import {
  LogOut, Package, Settings, ShoppingCart, Loader2, Trash2, Save,
  Star, StarOff, ToggleLeft, ToggleRight, Globe, Palette, Type, Megaphone,
  Truck, CreditCard, Clock, Image, FileText
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type OrderStatus = Database['public']['Enums']['order_status'];
type SettingsRow = Database['public']['Tables']['site_settings']['Row'];

const statusLabels: Record<OrderStatus, string> = {
  pending: 'পেন্ডিং',
  processing: 'প্রসেসিং',
  shipped: 'শিপড',
  completed: 'সম্পন্ন',
};

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  completed: 'bg-emerald-100 text-emerald-800',
};

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const { data: settings } = useSettings();
  const [tab, setTab] = useState<'orders' | 'products' | 'settings'>('orders');

  const tabs = [
    { key: 'orders' as const, label: 'অর্ডার', icon: ShoppingCart },
    { key: 'products' as const, label: 'প্রোডাক্ট', icon: Package },
    { key: 'settings' as const, label: 'সাইট কন্ট্রোল', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-ash">
      <nav className="bg-surface border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-lg">{settings?.brand_name || 'Admin'}</h1>
            <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full font-medium">{settings?.product_type || 'watch'}</span>
          </div>
          <button onClick={signOut} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-sm">
            <LogOut className="w-4 h-4" /> লগআউট
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="flex gap-1 bg-surface rounded-xl p-1 w-fit">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === key ? 'bg-ink text-surface' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {tab === 'orders' && <OrdersPanel />}
        {tab === 'products' && <ProductsPanel />}
        {tab === 'settings' && <SettingsPanel />}
      </div>
    </div>
  );
};

// ─── Orders ────────────────────────────────────────────────
const OrdersPanel = () => {
  const [filter, setFilter] = useState<OrderStatus | undefined>();
  const { data: orders, isLoading } = useOrders(filter);
  const updateStatus = useUpdateOrderStatus();

  const orderCount = orders?.length ?? 0;
  const pendingCount = orders?.filter(o => o.status === 'pending').length ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="মোট অর্ডার" value={toBengaliNum(orderCount)} />
        <StatCard label="পেন্ডিং" value={toBengaliNum(pendingCount)} accent />
        <StatCard label="আজকের আয়" value={`৳${formatBengaliPrice(orders?.filter(o => {
          const today = new Date().toDateString();
          return new Date(o.created_at).toDateString() === today;
        }).reduce((s, o) => s + o.total_price, 0) ?? 0)}`} />
        <StatCard label="মোট আয়" value={`৳${formatBengaliPrice(orders?.reduce((s, o) => s + o.total_price, 0) ?? 0)}`} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">ফিল্টার:</span>
        {[undefined, 'pending', 'processing', 'shipped', 'completed'].map((s) => (
          <button
            key={s ?? 'all'}
            onClick={() => setFilter(s as OrderStatus | undefined)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === s ? 'bg-ink text-surface' : 'bg-surface text-muted-foreground hover:text-foreground'
            }`}
          >
            {s ? statusLabels[s as OrderStatus] : 'সব'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState />
      ) : !orders?.length ? (
        <EmptyState text="কোনো অর্ডার পাওয়া যায়নি।" />
      ) : (
        <div className="bg-surface rounded-2xl overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-ash">
                  {['নাম', 'ফোন', 'মডেল', 'পরিমাণ', 'মোট', 'TrxID', 'এলাকা', 'স্ট্যাটাস'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0 hover:bg-ash/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm">{o.customer_name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[180px]">{o.address}</p>
                      {o.customer_email && <p className="text-xs text-gold truncate">{o.customer_email}</p>}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-sm">{o.phone}</td>
                    <td className="px-4 py-3 text-sm">{o.watch_model}</td>
                    <td className="px-4 py-3 text-sm">{toBengaliNum(o.quantity)}</td>
                    <td className="px-4 py-3 font-semibold text-gold">৳{formatBengaliPrice(o.total_price)}</td>
                    <td className="px-4 py-3">
                      {o.trx_id ? (
                        <span className="bg-gold/10 text-gold px-2 py-1 rounded-lg text-xs font-mono font-semibold">{o.trx_id}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">COD</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">{o.delivery_location === 'dhaka' ? 'ঢাকা' : 'বাইরে'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={o.status}
                        onChange={(e) => updateStatus.mutate({ id: o.id, status: e.target.value as OrderStatus })}
                        className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border-0 cursor-pointer ${statusColors[o.status]}`}
                      >
                        {Object.entries(statusLabels).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Products ──────────────────────────────────────────────
const ProductsPanel = () => {
  const { data: products, isLoading } = useProducts();
  const upsertProduct = useUpsertProduct();
  const deleteProduct = useDeleteProduct();
  const toggleStock = useToggleStock();
  const toggleFeatured = useToggleFeatured();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', price: 0, subtitle: '', video_url: '', stock_status: 'in_stock',
    discount_percent: 0, product_type: 'watch', is_featured: false,
    image_urls: '' as string, description_list: '' as string,
  });

  const startEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      name: p.name, price: p.price, subtitle: p.subtitle || '',
      video_url: p.video_url || '', stock_status: p.stock_status,
      discount_percent: p.discount_percent, product_type: p.product_type,
      is_featured: p.is_featured,
      image_urls: (p.image_urls || []).join('\n'),
      description_list: (p.description_list || []).join('\n'),
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: '', price: 0, subtitle: '', video_url: '', stock_status: 'in_stock', discount_percent: 0, product_type: 'watch', is_featured: false, image_urls: '', description_list: '' });
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
    } as any, { onSuccess: resetForm });
  };

  return (
    <div className="space-y-4">
      <div className="bg-surface rounded-2xl p-6 border border-border space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <FileText className="w-4 h-4" />
          {editingId ? 'প্রোডাক্ট এডিট করুন' : 'নতুন প্রোডাক্ট যোগ করুন'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AdminInput value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="নাম *" />
          <AdminInput type="number" value={String(form.price)} onChange={v => setForm({ ...form, price: Number(v) })} placeholder="মূল্য *" />
          <AdminInput value={form.subtitle} onChange={v => setForm({ ...form, subtitle: v })} placeholder="সাবটাইটেল" />
          <AdminInput value={form.video_url} onChange={v => setForm({ ...form, video_url: v })} placeholder="ভিডিও URL (YouTube ID)" />
          <AdminInput type="number" value={String(form.discount_percent)} onChange={v => setForm({ ...form, discount_percent: Number(v) })} placeholder="ছাড় %" />
          <AdminSelect value={form.product_type} onChange={v => setForm({ ...form, product_type: v })} options={[
            { value: 'watch', label: 'ঘড়ি' }, { value: 'clothing', label: 'পোশাক' },
            { value: 'electronics', label: 'ইলেকট্রনিক্স' }, { value: 'accessories', label: 'আনুষাঙ্গিক' },
          ]} />
          <AdminSelect value={form.stock_status} onChange={v => setForm({ ...form, stock_status: v })} options={[
            { value: 'in_stock', label: 'ইন স্টক' }, { value: 'out_of_stock', label: 'আউট অফ স্টক' },
          ]} />
          <label className="flex items-center gap-2 text-sm cursor-pointer col-span-1">
            <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} className="rounded" />
            ফিচার্ড প্রোডাক্ট
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">ছবির URL (প্রতি লাইনে একটি)</label>
            <textarea value={form.image_urls} onChange={e => setForm({ ...form, image_urls: e.target.value })} rows={3} className="w-full bg-ash border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none font-mono" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">বিবরণ (প্রতি লাইনে একটি)</label>
            <textarea value={form.description_list} onChange={e => setForm({ ...form, description_list: e.target.value })} rows={3} className="w-full bg-ash border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none" />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={saveProduct} disabled={upsertProduct.isPending} className="gradient-gold text-surface font-semibold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 flex items-center gap-2">
            {upsertProduct.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editingId ? 'আপডেট' : 'যোগ করুন'}
          </button>
          {editingId && <button onClick={resetForm} className="px-6 py-2.5 rounded-xl text-sm border border-border text-muted-foreground">বাতিল</button>}
        </div>
      </div>

      {isLoading ? <LoadingState /> : !products?.length ? <EmptyState text="কোনো প্রোডাক্ট নেই।" /> : (
        <div className="grid gap-3">
          {products.map((p) => (
            <div key={p.id} className="bg-surface rounded-2xl p-4 border border-border flex items-center gap-4">
              {p.thumbnail_url && <img src={p.thumbnail_url} alt={p.name} className="w-14 h-14 rounded-xl object-cover bg-ash shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate">{p.name}</p>
                  {p.is_featured && <Star className="w-3.5 h-3.5 text-gold fill-gold shrink-0" />}
                  <span className="text-xs bg-ash px-2 py-0.5 rounded-full text-muted-foreground">{p.product_type}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  ৳{formatBengaliPrice(p.price)}
                  {p.discount_percent > 0 && <span className="text-gold ml-2">-{toBengaliNum(p.discount_percent)}%</span>}
                  {' · '}
                  <span className={p.stock_status === 'in_stock' ? 'text-emerald-600' : 'text-destructive'}>
                    {p.stock_status === 'in_stock' ? 'ইন স্টক' : 'আউট অফ স্টক'}
                  </span>
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => toggleFeatured.mutate({ id: p.id, is_featured: !p.is_featured })} className="p-2 rounded-lg hover:bg-ash transition-colors" title="ফিচার্ড">
                  {p.is_featured ? <Star className="w-4 h-4 text-gold fill-gold" /> : <StarOff className="w-4 h-4 text-muted-foreground" />}
                </button>
                <button onClick={() => toggleStock.mutate({ id: p.id, stock_status: p.stock_status === 'in_stock' ? 'out_of_stock' : 'in_stock' })} className="p-2 rounded-lg hover:bg-ash transition-colors" title="স্টক টগল">
                  {p.stock_status === 'in_stock' ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                </button>
                <button onClick={() => startEdit(p)} className="px-3 py-2 rounded-lg bg-ash text-xs font-medium hover:bg-muted transition-colors">এডিট</button>
                <button onClick={() => deleteProduct.mutate(p.id)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Settings (Full Site Control) ──────────────────────────
const SettingsPanel = () => {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [form, setForm] = useState<Partial<SettingsRow>>({});
  const [initialized, setInitialized] = useState(false);

  if (settings && !initialized) {
    setForm({ ...settings });
    setInitialized(true);
  }

  const save = () => updateSettings.mutate(form);

  if (isLoading) return <LoadingState />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Branding */}
      <SettingsCard title="ব্র্যান্ডিং" icon={<Globe className="w-4 h-4" />}>
        <AdminInput label="ব্র্যান্ড নাম" value={form.brand_name || ''} onChange={v => setForm({ ...form, brand_name: v })} />
        <AdminInput label="ব্র্যান্ড ট্যাগলাইন" value={form.brand_tagline || ''} onChange={v => setForm({ ...form, brand_tagline: v })} />
        <AdminSelect label="প্রোডাক্ট টাইপ" value={form.product_type || 'watch'} onChange={v => setForm({ ...form, product_type: v })} options={[
          { value: 'watch', label: 'ঘড়ি' }, { value: 'clothing', label: 'পোশাক' },
          { value: 'electronics', label: 'ইলেকট্রনিক্স' }, { value: 'accessories', label: 'আনুষাঙ্গিক' },
        ]} />
        <AdminInput label="প্রাইমারি কালার" value={form.primary_color || '#b8963e'} onChange={v => setForm({ ...form, primary_color: v })} />
      </SettingsCard>

      {/* Announcement */}
      <SettingsCard title="অ্যানাউন্সমেন্ট বার" icon={<Megaphone className="w-4 h-4" />}>
        <AdminInput label="অ্যানাউন্সমেন্ট টেক্সট" value={form.announcement_text || ''} onChange={v => setForm({ ...form, announcement_text: v })} />
        <AdminInput label="ছাড় %" type="number" value={String(form.discount_percent ?? 30)} onChange={v => setForm({ ...form, discount_percent: Number(v) })} />
        <AdminInput label="কাউন্টডাউন (ঘণ্টা)" type="number" value={String(form.countdown_hours ?? 2)} onChange={v => setForm({ ...form, countdown_hours: Number(v) })} />
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.timer_enabled ?? true} onChange={e => setForm({ ...form, timer_enabled: e.target.checked })} className="rounded" />
          টাইমার চালু
        </label>
      </SettingsCard>

      {/* Page Content */}
      <SettingsCard title="পেজ কন্টেন্ট" icon={<Type className="w-4 h-4" />}>
        <AdminInput label="হিরো সাবটাইটেল" value={form.hero_subtitle || ''} onChange={v => setForm({ ...form, hero_subtitle: v })} />
        <AdminInput label="ফিচার সেকশন শিরোনাম" value={form.features_section_title || ''} onChange={v => setForm({ ...form, features_section_title: v })} />
        <AdminInput label="ভিডিও সেকশন শিরোনাম" value={form.video_section_title || ''} onChange={v => setForm({ ...form, video_section_title: v })} />
        <AdminInput label="কালেকশন সেকশন শিরোনাম" value={form.collection_section_title || ''} onChange={v => setForm({ ...form, collection_section_title: v })} />
      </SettingsCard>

      {/* Footer */}
      <SettingsCard title="ফুটার ও CTA" icon={<FileText className="w-4 h-4" />}>
        <AdminInput label="CTA শিরোনাম" value={form.footer_cta_title || ''} onChange={v => setForm({ ...form, footer_cta_title: v })} />
        <AdminInput label="CTA সাবটাইটেল" value={form.footer_cta_subtitle || ''} onChange={v => setForm({ ...form, footer_cta_subtitle: v })} />
        <AdminInput label="ফুটার টেক্সট" value={form.footer_text || ''} onChange={v => setForm({ ...form, footer_text: v })} />
      </SettingsCard>

      {/* Payment */}
      <SettingsCard title="পেমেন্ট কনফিগ" icon={<CreditCard className="w-4 h-4" />}>
        <AdminInput label="বিকাশ নম্বর" value={form.bkash_number || ''} onChange={v => setForm({ ...form, bkash_number: v })} />
        <AdminInput label="নগদ নম্বর" value={form.nagad_number || ''} onChange={v => setForm({ ...form, nagad_number: v })} />
        <AdminInput label="রকেট নম্বর" value={form.rocket_number || ''} onChange={v => setForm({ ...form, rocket_number: v })} />
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.online_payment_enabled ?? true} onChange={e => setForm({ ...form, online_payment_enabled: e.target.checked })} className="rounded" />
          অনলাইন পেমেন্ট চালু
        </label>
      </SettingsCard>

      {/* Delivery */}
      <SettingsCard title="ডেলিভারি চার্জ" icon={<Truck className="w-4 h-4" />}>
        <AdminInput label="ঢাকার ভেতরে (৳)" type="number" value={String(form.delivery_charge_inside ?? 70)} onChange={v => setForm({ ...form, delivery_charge_inside: Number(v) })} />
        <AdminInput label="ঢাকার বাইরে (৳)" type="number" value={String(form.delivery_charge_outside ?? 150)} onChange={v => setForm({ ...form, delivery_charge_outside: Number(v) })} />
      </SettingsCard>

      {/* Save Button - full width */}
      <div className="lg:col-span-2">
        <button onClick={save} disabled={updateSettings.isPending} className="gradient-gold text-surface font-semibold px-8 py-3 rounded-xl text-sm hover:opacity-90 flex items-center gap-2">
          {updateSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          সমস্ত পরিবর্তন সংরক্ষণ করুন
        </button>
      </div>
    </div>
  );
};

// ─── Shared UI Components ──────────────────────────────────
const StatCard = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
  <div className="bg-surface rounded-xl p-4 border border-border">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={`text-xl font-bold mt-1 ${accent ? 'text-gold' : 'text-foreground'}`}>{value}</p>
  </div>
);

const SettingsCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="bg-surface rounded-2xl p-6 border border-border space-y-4">
    <h3 className="font-semibold flex items-center gap-2 text-sm">{icon} {title}</h3>
    {children}
  </div>
);

const AdminInput = ({ label, value, onChange, type = 'text', placeholder }: {
  label?: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) => (
  <div>
    {label && <span className="text-xs text-muted-foreground mb-1 block">{label}</span>}
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || label}
      className="w-full bg-ash border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
    />
  </div>
);

const AdminSelect = ({ label, value, onChange, options }: {
  label?: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) => (
  <div>
    {label && <span className="text-xs text-muted-foreground mb-1 block">{label}</span>}
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-ash border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const LoadingState = () => (
  <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="bg-surface rounded-2xl p-12 text-center text-muted-foreground">{text}</div>
);

export default AdminDashboard;
