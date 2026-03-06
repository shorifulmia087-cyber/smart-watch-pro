import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

type AppRole = 'admin' | 'user' | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isOrderManager: boolean;
  hasAdminAccess: boolean;
  userRole: AppRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);

  const checkRole = async (userId: string) => {
    try {
      const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
      if (isAdmin) {
        setUserRole('admin');
        return;
      }
      const { data: isUser } = await supabase.rpc('has_role', { _user_id: userId, _role: 'user' });
      if (isUser) {
        setUserRole('user');
        return;
      }
      setUserRole(null);
    } catch {
      setUserRole(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const timeout = setTimeout(() => {
      if (mounted && loading) setLoading(false);
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          checkRole(session.user.id).finally(() => {
            if (mounted) setLoading(false);
          });
        }, 0);
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkRole(session.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
  };

  const isAdmin = userRole === 'admin';
  const isOrderManager = userRole === 'user';
  const hasAdminAccess = isAdmin || isOrderManager;

  return (
    <AuthContext.Provider value={{ session, user, isAdmin, isOrderManager, hasAdminAccess, userRole, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
