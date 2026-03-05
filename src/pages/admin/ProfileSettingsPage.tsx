import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Lock, Mail, Shield } from 'lucide-react';

const ProfileSettingsPage = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('নতুন পাসওয়ার্ড মিলছে না!');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    setLoading(true);
    try {
      // Re-authenticate with current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });
      if (signInError) {
        toast.error('বর্তমান পাসওয়ার্ড ভুল!');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground">প্রোফাইল সেটিংস</h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">আপনার লগইন ডিটেইলস ও পাসওয়ার্ড পরিবর্তন করুন</p>
      </div>

      {/* Account Info */}
      <Card className="rounded-2xl border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-sm">অ্যাকাউন্ট তথ্য</CardTitle>
              <CardDescription className="text-[11px]">আপনার লগইন ইমেইল</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
            <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">{user?.email}</p>
              <p className="text-[10px] text-muted-foreground">অ্যাডমিন অ্যাকাউন্ট</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="rounded-2xl border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Lock className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-sm">পাসওয়ার্ড পরিবর্তন</CardTitle>
              <CardDescription className="text-[11px]">নতুন পাসওয়ার্ড সেট করুন</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current" className="text-xs">বর্তমান পাসওয়ার্ড</Label>
              <Input
                id="current"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new" className="text-xs">নতুন পাসওয়ার্ড</Label>
              <Input
                id="new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-xs">পাসওয়ার্ড নিশ্চিত করুন</Label>
              <Input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="rounded-xl"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-xl">
              {loading ? 'পরিবর্তন হচ্ছে...' : 'পাসওয়ার্ড পরিবর্তন করুন'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSettingsPage;
