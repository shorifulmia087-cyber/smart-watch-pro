import { useAuth } from '@/hooks/useAuth';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import { Loader2 } from 'lucide-react';

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!user) return <AdminLogin />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">অ্যাক্সেস নেই</h2>
          <p className="text-muted-foreground text-sm">আপনার অ্যাডমিন অ্যাক্সেস নেই। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।</p>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
};

export default Admin;
