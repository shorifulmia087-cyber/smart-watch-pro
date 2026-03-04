import { useLocation } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bell, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toBengaliNum } from '@/lib/bengali';

const pageTitles: Record<string, string> = {
  '/admin': 'ড্যাশবোর্ড',
  '/admin/orders': 'অর্ডার ম্যানেজমেন্ট',
  '/admin/products': 'প্রোডাক্ট ম্যানেজমেন্ট',
  '/admin/analytics': 'অ্যানালিটিক্স',
  '/admin/settings': 'সাইট কন্ট্রোল',
};

const AdminTopbar = () => {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'ড্যাশবোর্ড';
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const formattedDate = time.toLocaleDateString('bn-BD', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const formattedTime = toBengaliNum(
    time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  );

  return (
    <header className="h-16 border-b border-border/60 bg-background/70 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-4 md:px-6 gap-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
        <div className="hidden sm:block">
          <h1 className="text-base font-semibold text-foreground leading-tight">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <div className="hidden md:flex items-center gap-2 glass-card rounded-xl px-3 py-2 text-sm text-muted-foreground min-w-[220px]">
          <Search className="h-4 w-4 shrink-0" />
          <input
            type="text"
            placeholder="খুঁজুন..."
            className="bg-transparent border-none outline-none w-full text-sm placeholder:text-muted-foreground"
          />
        </div>

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
