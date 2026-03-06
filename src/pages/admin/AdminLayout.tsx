import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { AdminThemeProvider, useAdminTheme } from '@/hooks/useAdminTheme';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import { supabase } from '@/integrations/supabase/client';
import { FlaskConical, ShieldCheck } from 'lucide-react';

const AdminLayoutInner = () => {
  const location = useLocation();
  const { theme } = useAdminTheme();
  useAutoLogout();

  const [sandboxMode, setSandboxMode] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSandboxMode = async () => {
      const { data } = await supabase.from('courier_settings' as any).select('is_sandbox, is_active');
      if (data && (data as any[]).length > 0) {
        const rows = data as any[];
        const activeRows = rows.filter((row: any) => row.is_active);
        const targetRows = activeRows.length > 0 ? activeRows : rows;

        const hasProduction = targetRows.some((row: any) => row.is_sandbox === false);
        const hasSandbox = targetRows.some((row: any) => row.is_sandbox === true);

        // If at least one active provider is in production, show production status.
        setSandboxMode(hasProduction ? false : hasSandbox ? true : null);
      }
    };
    checkSandboxMode();
  }, [location.pathname]);

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background text-foreground transition-colors duration-300">
          <AdminSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <AdminTopbar />

            {/* Sandbox Warning Bar */}
            {sandboxMode === true && (
              <div className="bg-warning/10 border-b border-warning/30 px-4 py-2.5 flex items-center gap-3">
                <FlaskConical className="h-4 w-4 text-warning shrink-0" />
                <p className="text-[12px] font-medium text-warning">
                  🧪 বর্তমানে আপনি <strong>টেস্ট মোডে</strong> আছেন। কোনো আসল পার্সেল বুক হবে না। প্রোডাকশনে যেতে কুরিয়ার সেটিংস থেকে মোড পরিবর্তন করুন।
                </p>
              </div>
            )}
            {sandboxMode === false && (
              <div className="bg-success/10 border-b border-success/30 px-4 py-2 flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-success shrink-0" />
                <p className="text-[11px] font-medium text-success">
                  ✅ প্রোডাকশন মোড সক্রিয় — আসল কুরিয়ার API ব্যবহার হচ্ছে
                </p>
              </div>
            )}

            <main className="flex-1 p-4 md:p-6 overflow-auto">
              <div className="max-w-[90rem] mx-auto">
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
              </div>
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
