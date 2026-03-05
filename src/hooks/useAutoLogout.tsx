import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export const useAutoLogout = () => {
  const { signOut, user } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (user) {
        signOut();
        window.location.href = '/admin';
      }
    }, INACTIVITY_TIMEOUT);
  }, [signOut, user]);

  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    const handler = () => resetTimer();

    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    resetTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user, resetTimer]);
};
