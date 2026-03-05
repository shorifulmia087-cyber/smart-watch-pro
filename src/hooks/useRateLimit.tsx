import { useRef, useCallback } from 'react';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

export const useRateLimit = ({ maxAttempts = 5, windowMs = 60_000 }: RateLimitConfig = { maxAttempts: 5, windowMs: 60_000 }) => {
  const attemptsRef = useRef<number[]>([]);

  const checkLimit = useCallback((): boolean => {
    const now = Date.now();
    attemptsRef.current = attemptsRef.current.filter(t => now - t < windowMs);
    if (attemptsRef.current.length >= maxAttempts) {
      return false; // rate limited
    }
    attemptsRef.current.push(now);
    return true; // allowed
  }, [maxAttempts, windowMs]);

  const getRemainingTime = useCallback((): number => {
    if (attemptsRef.current.length === 0) return 0;
    const oldest = attemptsRef.current[0];
    return Math.max(0, windowMs - (Date.now() - oldest));
  }, [windowMs]);

  return { checkLimit, getRemainingTime };
};
