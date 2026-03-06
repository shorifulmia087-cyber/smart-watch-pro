import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSupabaseData';
import {
  LayoutDashboard, ShoppingCart, Package, BarChart3, Settings2,
  LogOut, X, Star, CreditCard, UserCog, Users, Truck, Activity,
  MessageSquare, UsersRound, Route, Wallet, Sparkles,
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

const mainNav = [
  { title: 'ড্যাশবোর্ড', url: '/admin', icon: LayoutDashboard },
  { title: 'অর্ডার', url: '/admin/orders', icon: ShoppingCart },
  { title: 'প্রোডাক্ট', url: '/admin/products', icon: Package },
  { title: 'কাস্টমার', url: '/admin/customers', icon: Users },
];

const managementNav = [
  { title: 'রিভিউ', url: '/admin/reviews', icon: Star },
  { title: 'টিম', url: '/admin/team', icon: UsersRound },
  { title: 'পেমেন্ট', url: '/admin/payment', icon: CreditCard },
  { title: 'কুরিয়ার', url: '/admin/courier', icon: Truck },
  { title: 'কুরিয়ার পেমেন্ট', url: '/admin/courier-payments', icon: Wallet },
  { title: 'ট্র্যাকিং', url: '/admin/tracking', icon: Route },
];

const systemNav = [
  { title: 'SMS', url: '/admin/sms', icon: MessageSquare },
  { title: 'অ্যানালিটিক্স', url: '/admin/analytics', icon: BarChart3 },
  { title: 'FB Pixel', url: '/admin/pixel', icon: Activity },
  { title: 'সাইট কন্ট্রোল', url: '/admin/settings', icon: Settings2 },
  { title: 'প্রোফাইল', url: '/admin/profile', icon: UserCog },
];

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAdmin, isOrderManager } = useAuth();
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === 'collapsed';
  const { data: settings } = useSettings();
  const isMobile = useIsMobile();

  const isActive = (url: string) => {
    if (url === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(url);
  };

  const handleNav = (url: string) => {
    navigate(url);
    if (isMobile) setOpenMobile(false);
  };

  const renderNavGroup = (label: string, items: typeof mainNav) => (
    <SidebarGroup className="py-0">
      {!collapsed && (
        <SidebarGroupLabel className="px-5 pt-4 pb-1.5 text-[10px] uppercase tracking-[0.18em] font-semibold text-muted-foreground/40 select-none">
          {label}
        </SidebarGroupLabel>
      )}
      {collapsed && <div className="pt-3" />}
      <SidebarGroupContent>
        <SidebarMenu className="space-y-0.5 px-2">
          {items.map((item) => {
            const active = isActive(item.url);
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  onClick={() => handleNav(item.url)}
                  isActive={active}
                  tooltip={item.title}
                  className={`group relative h-9 px-3 gap-3 rounded-sm transition-all duration-200 ${
                    active
                      ? 'bg-accent/[0.12] text-accent shadow-[inset_0_0_0_1px_hsl(var(--gold)/0.15),0_0_12px_-3px_hsl(var(--gold)/0.2)]'
                      : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }`}
                >
                  {/* Active indicator bar */}
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-4 rounded-r-full bg-accent" />
                  )}
                  <item.icon
                    className={`h-[17px] w-[17px] shrink-0 transition-colors duration-200 ${
                      active
                        ? 'text-accent'
                        : 'text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70'
                    }`}
                    strokeWidth={active ? 2 : 1.5}
                  />
                  {!collapsed && (
                    <span className={`text-sm truncate transition-colors duration-200 ${
                      active ? 'font-semibold text-accent' : 'font-medium'
                    }`}>
                      {item.title}
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  const userInitial = user?.email?.charAt(0)?.toUpperCase() || 'A';

  return (
    <Sidebar collapsible="icon" className="border-r-[0.5px] border-border/40">
      <SidebarContent className="pt-1 overflow-y-auto overflow-x-hidden scrollbar-none">
        {/* Brand */}
        <div className="px-4 py-4">
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-sm gradient-gold flex items-center justify-center shadow-[0_2px_8px_hsl(var(--gold)/0.25)] overflow-hidden">
                  {settings?.logo_url ? (
                    <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-white" strokeWidth={1.5} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[13px] text-sidebar-foreground tracking-tight truncate leading-tight">
                    {settings?.brand_name || 'Admin'}
                  </p>
                  <p className="text-[9px] font-medium text-accent/70 tracking-[0.1em] uppercase leading-tight mt-0.5">
                    Enterprise Panel
                  </p>
                </div>
              </div>
              {isMobile && (
                <button
                  onClick={() => setOpenMobile(false)}
                  className="p-1 rounded-sm hover:bg-sidebar-accent transition-colors"
                >
                  <X className="h-4 w-4 text-sidebar-foreground/40" strokeWidth={1.5} />
                </button>
              )}
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-sm gradient-gold flex items-center justify-center shadow-[0_2px_8px_hsl(var(--gold)/0.25)] overflow-hidden">
                {settings?.logo_url ? (
                  <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Sparkles className="h-4 w-4 text-white" strokeWidth={1.5} />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Thin separator */}
        <div className="mx-4 h-px bg-border/30" />

        {/* Nav Groups */}
        {renderNavGroup('প্রধান', mainNav)}
        <div className="mx-4 h-px bg-border/20" />
        {renderNavGroup('ম্যানেজমেন্ট', managementNav)}
        <div className="mx-4 h-px bg-border/20" />
        {renderNavGroup('সিস্টেম', systemNav)}
      </SidebarContent>

      {/* Profile Footer — Bento Card */}
      <SidebarFooter className="p-2.5">
        <div className={`rounded-sm bg-surface dark:bg-card border border-border/30 shadow-[0_1px_3px_0_hsl(0_0%_0%/0.04)] ${collapsed ? 'p-2' : 'p-3'}`}>
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-7 h-7 rounded-sm gradient-gold flex items-center justify-center text-[11px] font-bold text-white font-inter shadow-sm">
                  {userInitial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-foreground truncate leading-tight">
                    {user?.email}
                  </p>
                  <p className="text-[9px] font-medium text-accent leading-tight mt-0.5">অ্যাডমিন</p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 text-[11px] font-medium rounded-sm px-2 py-1.5 w-full transition-all duration-200 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/[0.06]"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                <span>লগআউট</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-7 h-7 rounded-sm gradient-gold flex items-center justify-center text-[11px] font-bold text-white font-inter shadow-sm">
                {userInitial}
              </div>
              <button
                onClick={signOut}
                className="p-1 rounded-sm text-muted-foreground/50 hover:text-destructive hover:bg-destructive/[0.06] transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
