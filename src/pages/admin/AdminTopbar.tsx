import { useLocation, useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bell, Search, X } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { toBengaliNum } from '@/lib/bengali';
import ThemeToggle from '@/components/admin/ThemeToggle';
import { supabase } from '@/integrations/supabase/client';

const pageTitles: Record<string, string> = {
  '/admin': 'ড্যাশবোর্ড',
  '/admin/orders': 'অর্ডার ম্যানেজমেন্ট',
  '/admin/products': 'প্রোডাক্ট ম্যানেজমেন্ট',
  '/admin/analytics': 'অ্যানালিটিক্স',
  '/admin/settings': 'সাইট কন্ট্রোল',
};

interface SearchResult {
  type: 'order' | 'product' | 'customer';
  id: string;
  title: string;
  subtitle: string;
}

const AdminTopbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const title = pageTitles[location.pathname] || 'ড্যাশবোর্ড';
  const [time, setTime] = useState(new Date());
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    const items: SearchResult[] = [];

    // Search orders by name, phone, or tracking_id
    const { data: orders } = await supabase
      .from('orders')
      .select('id, customer_name, phone, tracking_id, total_price')
      .or(`customer_name.ilike.%${q}%,phone.ilike.%${q}%,tracking_id.ilike.%${q}%`)
      .limit(5);

    orders?.forEach(o => items.push({
      type: 'order',
      id: o.id,
      title: o.customer_name,
      subtitle: `📱 ${o.phone} — ৳${o.total_price}`,
    }));

    // Search products by name
    const { data: products } = await supabase
      .from('products')
      .select('id, name, price')
      .ilike('name', `%${q}%`)
      .limit(5);

    products?.forEach(p => items.push({
      type: 'product',
      id: p.id,
      title: p.name,
      subtitle: `৳${p.price}`,
    }));

    setResults(items);
    setSearching(false);
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(() => doSearch(query), 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, doSearch]);

  const handleSelect = (r: SearchResult) => {
    setShowResults(false);
    setQuery('');
    if (r.type === 'order') navigate('/admin/orders');
    else if (r.type === 'product') navigate('/admin/products');
  };

  const formattedDate = time.toLocaleDateString('bn-BD', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const formattedTime = toBengaliNum(
    time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  );

  const typeLabels: Record<string, string> = { order: 'অর্ডার', product: 'প্রোডাক্ট', customer: 'কাস্টমার' };

  return (
    <header className="h-14 border-b border-border/50 bg-card sticky top-0 z-40 flex items-center justify-between px-4 md:px-6 gap-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors [&_svg]:!h-[22px] [&_svg]:!w-[22px]" />
        <div className="hidden sm:block">
          <h1 className="text-sm font-semibold text-foreground leading-tight">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Search with dropdown */}
        <div ref={containerRef} className="relative hidden md:block">
          <div className="flex items-center gap-2 bg-muted/50 border border-border/50 rounded-xl px-3 py-2 text-sm min-w-[220px]">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setShowResults(true); }}
              onFocus={() => query && setShowResults(true)}
              placeholder="অর্ডার, প্রোডাক্ট খুঁজুন..."
              className="bg-transparent border-none outline-none w-full text-sm text-foreground placeholder:text-muted-foreground"
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults([]); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {showResults && (query.trim()) && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-card border border-border/50 rounded-lg shadow-lg z-50 max-h-[320px] overflow-y-auto">
              {searching ? (
                <p className="p-3 text-xs text-muted-foreground text-center">খুঁজছে...</p>
              ) : results.length === 0 ? (
                <p className="p-3 text-xs text-muted-foreground text-center">কিছু পাওয়া যায়নি</p>
              ) : (
                results.map((r, i) => (
                  <button
                    key={`${r.type}-${r.id}-${i}`}
                    onClick={() => handleSelect(r)}
                    className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors flex items-center gap-3 border-b border-border/10 last:border-0"
                  >
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                      {typeLabels[r.type]}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{r.subtitle}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <ThemeToggle />

        <button className="relative p-2 rounded-xl hover:bg-muted transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full ring-2 ring-background"></span>
        </button>

        <div className="hidden lg:block text-right">
          <p className="text-[11px] text-muted-foreground leading-tight">{formattedDate}</p>
          <p className="text-xs font-inter font-semibold text-foreground">{formattedTime}</p>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
