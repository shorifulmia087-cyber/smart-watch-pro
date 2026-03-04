import { useAuth } from '@/hooks/useAuth';
import AdminLogin from './AdminLogin';
import AdminLayout from './admin/AdminLayout';
import DashboardPage from './admin/DashboardPage';
import OrdersPage from './admin/OrdersPage';
import ProductsPage from './admin/ProductsPage';
import AnalyticsPage from './admin/AnalyticsPage';
import SiteControlPage from './admin/SiteControlPage';
import { Loader2 } from 'lucide-react';
import { Routes, Route } from 'react-router-dom';

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) return <AdminLogin />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">অ্যাক্সেস নেই</h2>
          <p className="text-muted-foreground text-sm">আপনার অ্যাডমিন অ্যাক্সেস নেই।</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SiteControlPage />} />
      </Route>
    </Routes>
  );
};

export default Admin;
