import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { AdminThemeProvider, useAdminTheme } from '@/hooks/useAdminTheme';

const AdminLayoutInner = () => {
  const location = useLocation();
  const { theme } = useAdminTheme();

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background text-foreground transition-colors duration-300">
          <AdminSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <AdminTopbar />
            <main className="flex-1 p-4 md:p-6 overflow-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

const AdminLayout = () => (
  <AdminThemeProvider>
    <AdminLayoutInner />
  </AdminThemeProvider>
);

export default AdminLayout;
