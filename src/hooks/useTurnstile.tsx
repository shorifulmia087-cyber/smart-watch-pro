import { useEffect, useRef, useCallback, useState } from 'react';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

export const useTurnstile = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const isEnabled = !!TURNSTILE_SITE_KEY;

  const loadScript = useCallback(() => {
    if (!isEnabled) return;
    if (document.querySelector('script[src*="turnstile"]')) return;
    
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
    script.async = true;
    document.head.appendChild(script);
  }, [isEnabled]);

  const renderWidget = useCallback(() => {
    if (!isEnabled || !containerRef.current || !window.turnstile) return;
    if (widgetIdRef.current) {
      window.turnstile.remove(widgetIdRef.current);
    }
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (t: string) => setToken(t),
      'error-callback': () => setToken(null),
      'expired-callback': () => setToken(null),
      theme: 'auto',
      size: 'flexible',
    });
  }, [isEnabled]);

  useEffect(() => {
    if (!isEnabled) return;
    
    window.onTurnstileLoad = () => renderWidget();
    loadScript();
    
    // If script already loaded
    if (window.turnstile) renderWidget();
    
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [isEnabled, loadScript, renderWidget]);

  const reset = useCallback(() => {
    setToken(null);
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, []);

  return { containerRef, token, reset, isEnabled };
};
