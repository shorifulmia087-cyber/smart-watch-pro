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
import { motion } from 'framer-motion';

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
  const { user, signOut } = useAuth();
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
    <SidebarGroup>
      {!collapsed && (
        <SidebarGroupLabel className="px-4 text-[10px] uppercase tracking-[0.15em] font-semibold text-sidebar-foreground/35 mb-1">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = isActive(item.url);
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  onClick={() => handleNav(item.url)}
                  isActive={active}
                  tooltip={item.title}
                  className={`group relative h-9 mx-2 px-3 gap-3 transition-all duration-200 rounded-sm overflow-hidden ${
                    active
                      ? 'gradient-gold text-white shadow-[0_2px_8px_hsl(var(--gold)/0.3)]'
                      : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60'
                  }`}
                >
                  <item.icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${active ? 'text-white' : 'text-sidebar-foreground/50 group-hover:text-accent'}`} />
                  {!collapsed && (
                    <span className="text-[13px] font-medium truncate">{item.title}</span>
                  )}
                  {active && !collapsed && (
                    <motion.div
                      layoutId="sidebar-active-dot"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/50">
      <SidebarContent className="pt-2 scrollbar-none">
        {/* Brand Header */}
        <div className="px-4 pb-4 pt-3">
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-sm gradient-gold flex items-center justify-center shadow-[0_4px_12px_hsl(var(--gold)/0.35)]">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-sidebar-background" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-sidebar-foreground tracking-tight truncate">
                    {settings?.brand_name || 'Admin'}
                  </p>
                  <p className="text-[10px] font-medium text-accent tracking-wide uppercase">Enterprise</p>
                </div>
              </div>
              {isMobile && (
                <button
                  onClick={() => setOpenMobile(false)}
                  className="p-1.5 rounded-sm hover:bg-sidebar-accent transition-colors"
                >
                  <X className="h-5 w-5 text-sidebar-foreground/50" />
                </button>
              )}
            </div>
          ) : (
            <div className="relative mx-auto">
              <div className="w-10 h-10 rounded-sm gradient-gold flex items-center justify-center shadow-[0_4px_12px_hsl(var(--gold)/0.35)]">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-sidebar-background" />
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="mx-4 mb-2 h-px bg-sidebar-border/50" />

        {/* Navigation Groups */}
        {renderNavGroup('প্রধান', mainNav)}
        {renderNavGroup('ম্যানেজমেন্ট', managementNav)}
        {renderNavGroup('সিস্টেম', systemNav)}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-3">
        <div className={`rounded-sm border border-sidebar-border/50 bg-sidebar-accent/30 p-3 ${collapsed ? 'flex justify-center' : ''}`}>
          {!collapsed && (
            <div className="mb-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-sm bg-accent/10 flex items-center justify-center">
                <UserCog className="h-4 w-4 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-sidebar-foreground truncate">{user?.email}</p>
                <p className="text-[10px] text-accent font-medium">অ্যাডমিন</p>
              </div>
            </div>
          )}
          <button
            onClick={signOut}
            className={`flex items-center gap-2 text-xs font-medium rounded-sm px-2.5 py-1.5 w-full transition-colors text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 ${collapsed ? 'justify-center px-1.5' : ''}`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>লগআউট</span>}
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
