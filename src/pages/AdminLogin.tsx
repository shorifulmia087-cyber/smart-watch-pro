import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useSettings } from '@/hooks/useSupabaseData';
import { Loader2 } from 'lucide-react';

const AdminLogin = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [success, setSuccess] = useState('');
  const { checkLimit } = useRateLimit({ maxAttempts: 5, windowMs: 300_000 });
  const { data: settings } = useSettings();
  const brandName = settings?.brand_name?.trim() || 'Kronos';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!checkLimit()) {
      setError('অনেক বেশি চেষ্টা করা হয়েছে। ৫ মিনিট পর আবার চেষ্টা করুন।');
      setLoading(false);
      return;
    }

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setSuccess('অ্যাকাউন্ট তৈরি হয়েছে! এখন লগইন করুন।');
        setMode('login');
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) setError('ইমেইল বা পাসওয়ার্ড ভুল হয়েছে।');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">{brandName} Admin</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {mode === 'login' ? 'অ্যাডমিন প্যানেলে লগইন করুন' : 'নতুন অ্যাকাউন্ট তৈরি করুন'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ইমেইল"
            required
            className="w-full bg-ash border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="পাসওয়ার্ড"
            required
            minLength={6}
            className="w-full bg-ash border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
          {error && <p className="text-destructive text-sm">{error}</p>}
          {success && <p className="text-success text-sm">{success}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-gold text-surface font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {mode === 'login' ? 'লগইন' : 'সাইন আপ'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          {mode === 'login' ? (
            <>অ্যাকাউন্ট নেই? <button onClick={() => { setMode('signup'); setError(''); setSuccess(''); }} className="text-gold font-medium hover:underline">সাইন আপ করুন</button></>
          ) : (
            <>অ্যাকাউন্ট আছে? <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }} className="text-gold font-medium hover:underline">লগইন করুন</button></>
          )}
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
