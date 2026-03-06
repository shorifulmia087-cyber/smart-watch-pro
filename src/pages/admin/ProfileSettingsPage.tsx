import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Lock, Mail, Shield, Loader2 } from 'lucide-react';

const ProfileSettingsPage = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('নতুন পাসওয়ার্ড মিলছে না!'); return; }
    if (newPassword.length < 6) { toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'); return; }
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '', password: currentPassword,
      });
      if (signInError) { toast.error('বর্তমান পাসওয়ার্ড ভুল!'); setLoading(false); return; }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5 w-full max-w-[700px]">
      {/* Bento Header */}
      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-4 md:p-5">
        <h2 className="text-lg font-bold text-foreground">প্রোফাইল সেটিংস</h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">আপনার লগইন ডিটেইলস ও পাসওয়ার্ড পরিবর্তন করুন</p>
      </div>

      {/* Account Info */}
      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5 md:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-accent/10 flex items-center justify-center">
            <Mail className="h-5 w-5 text-gold" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">অ্যাকাউন্ট তথ্য</h3>
            <p className="text-[11px] text-muted-foreground">আপনার লগইন ইমেইল</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-sm bg-muted/30 border border-border/40">
          <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">{user?.email}</p>
            <p className="text-[10px] text-muted-foreground">অ্যাডমিন অ্যাকাউন্ট</p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5 md:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-accent/10 flex items-center justify-center">
            <Lock className="h-5 w-5 text-gold" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">পাসওয়ার্ড পরিবর্তন</h3>
            <p className="text-[11px] text-muted-foreground">নতুন পাসওয়ার্ড সেট করুন</p>
          </div>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground">বর্তমান পাসওয়ার্ড</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" required
              className="w-full bg-muted/30 border border-border/40 rounded-sm px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground">নতুন পাসওয়ার্ড</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" required
              className="w-full bg-muted/30 border border-border/40 rounded-sm px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground">পাসওয়ার্ড নিশ্চিত করুন</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required
              className="w-full bg-muted/30 border border-border/40 rounded-sm px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full gradient-gold text-white font-semibold py-2.5 rounded-sm text-sm hover:opacity-90 flex items-center justify-center gap-2 transition-all shadow-sm"
            style={{ boxShadow: '0 4px 12px -4px hsl(var(--gold) / 0.3)' }}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? 'পরিবর্তন হচ্ছে...' : 'পাসওয়ার্ড পরিবর্তন করুন'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
