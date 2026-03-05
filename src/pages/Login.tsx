import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ title: 'লগইন ব্যর্থ', description: 'ইমেইল বা পাসওয়ার্ড ভুল হয়েছে।', variant: 'destructive' });
    } else {
      toast({ title: 'সফলভাবে লগইন হয়েছে!' });
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
            <LogIn className="h-6 w-6 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">লগইন করুন</h1>
          <p className="text-muted-foreground text-sm mt-1">আপনার অ্যাকাউন্টে প্রবেশ করুন</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">ইমেইল</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-shadow"
              placeholder="example@mail.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">পাসওয়ার্ড</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-shadow pr-10"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'লগইন হচ্ছে...' : 'লগইন'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          অ্যাকাউন্ট নেই?{' '}
          <Link to="/signup" className="text-accent font-medium hover:underline">
            অ্যাকাউন্ট করুন
          </Link>
        </p>
        <p className="text-center mt-4">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← হোমে ফিরে যান
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
