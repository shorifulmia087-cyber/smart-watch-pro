import { useAuth } from '@/hooks/useAuth';
import AdminLogin from './AdminLogin';
import AdminLayout from './admin/AdminLayout';
import { Loader2 } from 'lucide-react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Lazy load all admin pages for route-level code splitting
const DashboardPage = lazy(() => import('./admin/DashboardPage'));
const OrdersPage = lazy(() => import('./admin/OrdersPage'));
const ProductsPage = lazy(() => import('./admin/ProductsPage'));
const CustomersPage = lazy(() => import('./admin/CustomersPage'));
const AnalyticsPage = lazy(() => import('./admin/AnalyticsPage'));
const SiteControlPage = lazy(() => import('./admin/SiteControlPage'));
const ReviewsPage = lazy(() => import('./admin/ReviewsPage'));
const PaymentSettingsPage = lazy(() => import('./admin/PaymentSettingsPage'));
const AdvancePaymentsPage = lazy(() => import('./admin/AdvancePaymentsPage'));
const ProfileSettingsPage = lazy(() => import('./admin/ProfileSettingsPage'));
const CourierSettingsPage = lazy(() => import('./admin/CourierSettingsPage'));
const CourierPaymentsPage = lazy(() => import('./admin/CourierPaymentsPage'));
const TrackingDashboardPage = lazy(() => import('./admin/TrackingDashboardPage'));
const FacebookPixelPage = lazy(() => import('./admin/FacebookPixelPage'));
const SmsSettingsPage = lazy(() => import('./admin/SmsSettingsPage'));
const TeamPage = lazy(() => import('./admin/TeamPage'));
const FraudCheckerPage = lazy(() => import('./admin/FraudCheckerPage'));
const CouponsPage = lazy(() => import('./admin/CouponsPage'));
const UtmBuilderPage = lazy(() => import('./admin/UtmBuilderPage'));
const HelpGuidePage = lazy(() => import('./admin/HelpGuidePage'));

const AdminPageLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="w-6 h-6 animate-spin text-accent" />
  </div>
);

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
          <Route path="orders" element={<Suspense fallback={<AdminPageLoader />}><OrdersPage /></Suspense>} />
          <Route path="tracking" element={<Suspense fallback={<AdminPageLoader />}><TrackingDashboardPage /></Suspense>} />
          <Route path="profile" element={<Suspense fallback={<AdminPageLoader />}><ProfileSettingsPage /></Suspense>} />
          <Route path="*" element={<Navigate to="/admin/orders" replace />} />
        </Route>
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Suspense fallback={<AdminPageLoader />}><DashboardPage /></Suspense>} />
        <Route path="orders" element={<Suspense fallback={<AdminPageLoader />}><OrdersPage /></Suspense>} />
        <Route path="products" element={<Suspense fallback={<AdminPageLoader />}><ProductsPage /></Suspense>} />
        <Route path="customers" element={<Suspense fallback={<AdminPageLoader />}><CustomersPage /></Suspense>} />
        <Route path="reviews" element={<Suspense fallback={<AdminPageLoader />}><ReviewsPage /></Suspense>} />
        <Route path="fraud-checker" element={<Suspense fallback={<AdminPageLoader />}><FraudCheckerPage /></Suspense>} />
        <Route path="coupons" element={<Suspense fallback={<AdminPageLoader />}><CouponsPage /></Suspense>} />
        <Route path="team" element={<Suspense fallback={<AdminPageLoader />}><TeamPage /></Suspense>} />
        <Route path="payment" element={<Suspense fallback={<AdminPageLoader />}><PaymentSettingsPage /></Suspense>} />
        <Route path="advance-payments" element={<Suspense fallback={<AdminPageLoader />}><AdvancePaymentsPage /></Suspense>} />
        <Route path="courier" element={<Suspense fallback={<AdminPageLoader />}><CourierSettingsPage /></Suspense>} />
        <Route path="courier-payments" element={<Suspense fallback={<AdminPageLoader />}><CourierPaymentsPage /></Suspense>} />
        <Route path="tracking" element={<Suspense fallback={<AdminPageLoader />}><TrackingDashboardPage /></Suspense>} />
        <Route path="sms" element={<Suspense fallback={<AdminPageLoader />}><SmsSettingsPage /></Suspense>} />
        <Route path="analytics" element={<Suspense fallback={<AdminPageLoader />}><AnalyticsPage /></Suspense>} />
        <Route path="utm-builder" element={<Suspense fallback={<AdminPageLoader />}><UtmBuilderPage /></Suspense>} />
        <Route path="pixel" element={<Suspense fallback={<AdminPageLoader />}><FacebookPixelPage /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<AdminPageLoader />}><SiteControlPage /></Suspense>} />
        <Route path="profile" element={<Suspense fallback={<AdminPageLoader />}><ProfileSettingsPage /></Suspense>} />
      </Route>
    </Routes>
  );
};

export default Admin;
