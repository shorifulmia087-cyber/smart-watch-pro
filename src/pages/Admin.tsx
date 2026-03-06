import { useAuth } from '@/hooks/useAuth';
import AdminLogin from './AdminLogin';
import AdminLayout from './admin/AdminLayout';
import DashboardPage from './admin/DashboardPage';
import OrdersPage from './admin/OrdersPage';
import ProductsPage from './admin/ProductsPage';
import CustomersPage from './admin/CustomersPage';
import AnalyticsPage from './admin/AnalyticsPage';
import SiteControlPage from './admin/SiteControlPage';
import ReviewsPage from './admin/ReviewsPage';
import PaymentSettingsPage from './admin/PaymentSettingsPage';
import AdvancePaymentsPage from './admin/AdvancePaymentsPage';
import ProfileSettingsPage from './admin/ProfileSettingsPage';
import CourierSettingsPage from './admin/CourierSettingsPage';
import CourierPaymentsPage from './admin/CourierPaymentsPage';
import TrackingDashboardPage from './admin/TrackingDashboardPage';
import FacebookPixelPage from './admin/FacebookPixelPage';
import SmsSettingsPage from './admin/SmsSettingsPage';
import TeamPage from './admin/TeamPage';
import { Loader2 } from 'lucide-react';
import { Routes, Route, Navigate } from 'react-router-dom';

const Admin = () => {
  const { user, hasAdminAccess, isOrderManager, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) return <AdminLogin />;

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">অ্যাক্সেস নেই</h2>
          <p className="text-muted-foreground text-sm">আপনার অ্যাডমিন অ্যাক্সেস নেই।</p>
        </div>
      </div>
    );
  }

  // Order manager: only orders, tracking, and profile
  if (isOrderManager) {
    return (
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/orders" replace />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="tracking" element={<TrackingDashboardPage />} />
          <Route path="profile" element={<ProfileSettingsPage />} />
          <Route path="*" element={<Navigate to="/admin/orders" replace />} />
        </Route>
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="payment" element={<PaymentSettingsPage />} />
        <Route path="advance-payments" element={<AdvancePaymentsPage />} />
        <Route path="courier" element={<CourierSettingsPage />} />
        <Route path="courier-payments" element={<CourierPaymentsPage />} />
        <Route path="tracking" element={<TrackingDashboardPage />} />
        <Route path="sms" element={<SmsSettingsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="pixel" element={<FacebookPixelPage />} />
        <Route path="settings" element={<SiteControlPage />} />
        <Route path="profile" element={<ProfileSettingsPage />} />
      </Route>
    </Routes>
  );
};

export default Admin;
