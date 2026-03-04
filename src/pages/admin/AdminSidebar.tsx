import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSupabaseData';
import {
  CircleGauge, Store, Boxes, PieChart, Wrench,
  LogOut, ChevronRight,
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

const navItems = [
  { title: 'ড্যাশবোর্ড', url: '/admin', icon: CircleGauge },
  { title: 'অর্ডার', url: '/admin/orders', icon: Store },
  { title: 'প্রোডাক্ট', url: '/admin/products', icon: Boxes },
  { title: 'অ্যানালিটিক্স', url: '/admin/analytics', icon: PieChart },
  { title: 'সাইট কন্ট্রোল', url: '/admin/settings', icon: Wrench },
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
                    <item.icon className={`h-[18px] w-[18px] shrink-0 ${isActive(item.url) ? 'text-sidebar-primary' : ''}`} />
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
