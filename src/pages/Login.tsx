import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LogIn, Eye, EyeOff, ArrowLeft, Shield, Zap } from 'lucide-react';
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
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Grid pattern background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Gold glow orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[hsl(var(--gold))] opacity-[0.04] blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[400px] relative z-10"
      >
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            হোমে ফিরে যান
          </Link>
        </motion.div>

        {/* Card */}
        <div className="bg-card/80 backdrop-blur-xl border border-border/60 rounded-2xl p-8 shadow-[0_8px_40px_-12px_hsl(var(--gold)/0.08)]">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--gold-light))] flex items-center justify-center mx-auto mb-5 shadow-[0_4px_20px_-4px_hsl(var(--gold)/0.35)]">
              <LogIn className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">লগইন করুন</h1>
            <p className="text-muted-foreground text-sm mt-1.5">আপনার অ্যাকাউন্টে প্রবেশ করুন</p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-border/60" />
            <span className="text-[11px] text-muted-foreground/60 uppercase tracking-widest font-medium">credentials</span>
            <div className="h-px flex-1 bg-border/60" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-2">ইমেইল</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border/60 bg-muted/30 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gold)/0.4)] focus:border-[hsl(var(--gold)/0.5)] transition-all placeholder:text-muted-foreground/50"
                placeholder="example@mail.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-2">পাসওয়ার্ড</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border/60 bg-muted/30 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gold)/0.4)] focus:border-[hsl(var(--gold)/0.5)] transition-all placeholder:text-muted-foreground/50 pr-11"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-light))] text-white font-semibold text-sm shadow-[0_4px_16px_-4px_hsl(var(--gold)/0.4)] hover:shadow-[0_6px_24px_-4px_hsl(var(--gold)/0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  লগইন হচ্ছে...
                </span>
              ) : 'লগইন'}
            </motion.button>
          </form>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 mt-6 pt-5 border-t border-border/40">
            <div className="flex items-center gap-1.5 text-muted-foreground/60">
              <Shield className="h-3.5 w-3.5" />
              <span className="text-[11px]">নিরাপদ</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-border" />
            <div className="flex items-center gap-1.5 text-muted-foreground/60">
              <Zap className="h-3.5 w-3.5" />
              <span className="text-[11px]">এনক্রিপ্টেড</span>
            </div>
          </div>
        </div>

        {/* Bottom link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm text-muted-foreground mt-6"
        >
          অ্যাকাউন্ট নেই?{' '}
          <Link to="/signup" className="text-[hsl(var(--gold))] font-semibold hover:underline underline-offset-4">
            অ্যাকাউন্ট করুন
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Login;
