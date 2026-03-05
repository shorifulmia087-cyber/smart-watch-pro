import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSupabaseData';
import {
  LayoutDashboard, ShoppingCart, Package, BarChart3, Settings2,
  LogOut, ChevronRight, X, Star, CreditCard, UserCog, Users, Truck, Activity,
  MessageSquare, UsersRound,
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

const navItems = [
  { title: 'ড্যাশবোর্ড', url: '/admin', icon: LayoutDashboard },
  { title: 'অর্ডার', url: '/admin/orders', icon: ShoppingCart },
  { title: 'প্রোডাক্ট', url: '/admin/products', icon: Package },
  { title: 'কাস্টমার', url: '/admin/customers', icon: Users },
  { title: 'রিভিউ', url: '/admin/reviews', icon: Star },
  { title: 'টিম', url: '/admin/team', icon: UsersRound },
  { title: 'পেমেন্ট', url: '/admin/payment', icon: CreditCard },
  { title: 'কুরিয়ার', url: '/admin/courier', icon: Truck },
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
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="pt-4">
        {/* Brand */}
        <div className="px-4 pb-6 pt-2">
          {!collapsed && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl gradient-gold flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm font-inter">K</span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-sidebar-foreground truncate">
                    {settings?.brand_name || 'Admin'}
                  </p>
                  <p className="text-[11px] text-sidebar-foreground/50">এন্টারপ্রাইজ প্যানেল</p>
                </div>
              </div>
              {isMobile && (
                <button
                  onClick={() => setOpenMobile(false)}
                  className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
                >
                  <X className="h-5 w-5 text-sidebar-foreground/60" />
                </button>
              )}
            </div>
          )}
          {collapsed && (
            <div className="w-9 h-9 rounded-xl gradient-gold flex items-center justify-center mx-auto shadow-md">
              <span className="text-white font-bold text-sm font-inter">K</span>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    onClick={() => handleNav(item.url)}
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className={`h-10 px-3 gap-3 transition-all duration-200 rounded-xl ${
                      isActive(item.url)
                        ? 'bg-sidebar-accent text-sidebar-primary border-l-[3px] border-sidebar-primary'
                        : 'border-l-[3px] border-transparent hover:bg-sidebar-accent/50'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 shrink-0 ${isActive(item.url) ? 'text-sidebar-primary' : ''}`} />
                    {!collapsed && <span className="text-sm">{item.title}</span>}
                    {!collapsed && isActive(item.url) && (
                      <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className={`rounded-xl bg-sidebar-accent/50 p-3 ${collapsed ? 'flex justify-center' : ''}`}>
          {!collapsed && (
            <div className="mb-2">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.email}</p>
              <p className="text-[10px] text-sidebar-foreground/50">অ্যাডমিন</p>
            </div>
          )}
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors w-full"
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
