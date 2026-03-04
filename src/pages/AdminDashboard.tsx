import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOrders, useUpdateOrderStatus } from '@/hooks/useSupabaseData';
import { useProducts, useUpsertProduct, useDeleteProduct } from '@/hooks/useSupabaseData';
import { useSettings, useUpdateSettings } from '@/hooks/useSupabaseData';
import { formatBengaliPrice, toBengaliNum } from '@/lib/bengali';
import { LogOut, Package, Settings, ShoppingCart, Loader2, Trash2, Save, Plus } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type OrderStatus = Database['public']['Enums']['order_status'];

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
  const [tab, setTab] = useState<'orders' | 'products' | 'settings'>('orders');

  return (
    <div className="min-h-screen bg-ash">
      {/* Top Nav */}
      <nav className="bg-surface border-b border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-bold text-lg">Kronos Admin</h1>
          <button onClick={signOut} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-sm">
            <LogOut className="w-4 h-4" /> লগআউট
          </button>
        </div>
      </nav>

      {/* Tab Nav */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="flex gap-1 bg-surface rounded-xl p-1 w-fit">
          {([['orders', 'অর্ডার', ShoppingCart], ['products', 'প্রোডাক্ট', Package], ['settings', 'সেটিংস', Settings]] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === key ? 'bg-ink text-surface' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {tab === 'orders' && <OrdersPanel />}
        {tab === 'products' && <ProductsPanel />}
        {tab === 'settings' && <SettingsPanel />}
      </div>
    </div>
  );
};

// ─── Orders Panel ──────────────────────────────────────────
const OrdersPanel = () => {
  const [filter, setFilter] = useState<OrderStatus | undefined>();
  const { data: orders, isLoading } = useOrders(filter);
  const updateStatus = useUpdateOrderStatus();

  return (
    <div className="space-y-4">
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
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : !orders?.length ? (
        <div className="bg-surface rounded-2xl p-12 text-center text-muted-foreground">কোনো অর্ডার পাওয়া যায়নি।</div>
      ) : (
        <div className="bg-surface rounded-2xl overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-ash">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">নাম</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">ফোন</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">মডেল</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">মোট</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">TrxID</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0 hover:bg-ash/50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{o.customer_name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{o.address}</p>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{o.phone}</td>
                    <td className="px-4 py-3">{o.watch_model}</td>
                    <td className="px-4 py-3 font-semibold text-gold">৳{formatBengaliPrice(o.total_price)}</td>
                    <td className="px-4 py-3">
                      {o.trx_id ? (
                        <span className="bg-gold/10 text-gold px-2 py-1 rounded-lg text-xs font-mono font-semibold">{o.trx_id}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">COD</span>
                      )}
                    </td>
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

// ─── Products Panel ────────────────────────────────────────
const ProductsPanel = () => {
  const { data: products, isLoading } = useProducts();
  const upsertProduct = useUpsertProduct();
  const deleteProduct = useDeleteProduct();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', price: 0, subtitle: '', video_url: '', stock_status: 'in_stock', discount_percent: 0 });

  const startEdit = (p: any) => {
    setEditingId(p.id);
    setForm({ name: p.name, price: p.price, subtitle: p.subtitle || '', video_url: p.video_url || '', stock_status: p.stock_status, discount_percent: p.discount_percent });
  };

  const saveProduct = () => {
    if (!form.name || !form.price) return;
    upsertProduct.mutate({ ...form, id: editingId || undefined } as any, {
      onSuccess: () => { setEditingId(null); setForm({ name: '', price: 0, subtitle: '', video_url: '', stock_status: 'in_stock', discount_percent: 0 }); }
    });
  };

  return (
    <div className="space-y-4">
      {/* Add/Edit form */}
      <div className="bg-surface rounded-2xl p-6 border border-border space-y-4">
        <h3 className="font-semibold">{editingId ? 'প্রোডাক্ট এডিট করুন' : 'নতুন প্রোডাক্ট যোগ করুন'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="নাম" className="bg-ash border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30" />
          <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} placeholder="মূল্য" className="bg-ash border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30" />
          <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="সাবটাইটেল" className="bg-ash border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30" />
          <input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="ভিডিও URL" className="bg-ash border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30" />
          <input type="number" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })} placeholder="ছাড় %" className="bg-ash border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30" />
          <select value={form.stock_status} onChange={(e) => setForm({ ...form, stock_status: e.target.value })} className="bg-ash border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30">
            <option value="in_stock">ইন স্টক</option>
            <option value="out_of_stock">আউট অফ স্টক</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={saveProduct} disabled={upsertProduct.isPending} className="gradient-gold text-surface font-semibold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 flex items-center gap-2">
            {upsertProduct.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editingId ? 'আপডেট করুন' : 'যোগ করুন'}
          </button>
          {editingId && (
            <button onClick={() => { setEditingId(null); setForm({ name: '', price: 0, subtitle: '', video_url: '', stock_status: 'in_stock', discount_percent: 0 }); }} className="px-6 py-2.5 rounded-xl text-sm border border-border text-muted-foreground hover:text-foreground">
              বাতিল
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : !products?.length ? (
        <div className="bg-surface rounded-2xl p-12 text-center text-muted-foreground">কোনো প্রোডাক্ট নেই।</div>
      ) : (
        <div className="grid gap-3">
          {products.map((p) => (
            <div key={p.id} className="bg-surface rounded-2xl p-5 border border-border flex items-center justify-between">
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-muted-foreground">৳{formatBengaliPrice(p.price)} · {p.stock_status === 'in_stock' ? 'ইন স্টক' : 'আউট অফ স্টক'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(p)} className="px-3 py-2 rounded-lg bg-ash text-sm font-medium hover:bg-muted transition-colors">এডিট</button>
                <button onClick={() => deleteProduct.mutate(p.id)} className="px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
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

// ─── Settings Panel ────────────────────────────────────────
const SettingsPanel = () => {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [form, setForm] = useState({
    bkash_number: '',
    nagad_number: '',
    rocket_number: '',
    delivery_charge_inside: 70,
    delivery_charge_outside: 150,
    countdown_hours: 2,
    discount_percent: 30,
  });
  const [initialized, setInitialized] = useState(false);

  if (settings && !initialized) {
    setForm({
      bkash_number: settings.bkash_number,
      nagad_number: settings.nagad_number,
      rocket_number: settings.rocket_number,
      delivery_charge_inside: settings.delivery_charge_inside,
      delivery_charge_outside: settings.delivery_charge_outside,
      countdown_hours: settings.countdown_hours,
      discount_percent: settings.discount_percent,
    });
    setInitialized(true);
  }

  const save = () => {
    updateSettings.mutate(form);
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="bg-surface rounded-2xl p-6 border border-border space-y-6 max-w-2xl">
      <h3 className="font-semibold text-lg">সাইট সেটিংস</h3>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">পেমেন্ট নম্বর</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-xs text-muted-foreground">বিকাশ</span>
              <input value={form.bkash_number} onChange={(e) => setForm({ ...form, bkash_number: e.target.value })} className="w-full bg-ash border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">নগদ</span>
              <input value={form.nagad_number} onChange={(e) => setForm({ ...form, nagad_number: e.target.value })} className="w-full bg-ash border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">রকেট</span>
              <input value={form.rocket_number} onChange={(e) => setForm({ ...form, rocket_number: e.target.value })} className="w-full bg-ash border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30" />
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">ডেলিভারি চার্জ</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-muted-foreground">ঢাকার ভেতরে (৳)</span>
              <input type="number" value={form.delivery_charge_inside} onChange={(e) => setForm({ ...form, delivery_charge_inside: Number(e.target.value) })} className="w-full bg-ash border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">ঢাকার বাইরে (৳)</span>
              <input type="number" value={form.delivery_charge_outside} onChange={(e) => setForm({ ...form, delivery_charge_outside: Number(e.target.value) })} className="w-full bg-ash border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30" />
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">অফার সেটিংস</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-muted-foreground">কাউন্টডাউন (ঘণ্টা)</span>
              <input type="number" value={form.countdown_hours} onChange={(e) => setForm({ ...form, countdown_hours: Number(e.target.value) })} className="w-full bg-ash border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">ছাড় (%)</span>
              <input type="number" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })} className="w-full bg-ash border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30" />
            </div>
          </div>
        </div>
      </div>

      <button onClick={save} disabled={updateSettings.isPending} className="gradient-gold text-surface font-semibold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 flex items-center gap-2">
        {updateSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        সংরক্ষণ করুন
      </button>
    </div>
  );
};

export default AdminDashboard;
