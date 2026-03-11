import { useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PixelSettings {
  pixel_id: string;
  enabled_events: string[];
}

const usePixelSettings = () => useQuery({
  queryKey: ['pixel_settings_public'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('facebook_pixel_settings')
      .select('pixel_id, enabled_events')
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return data as PixelSettings | null;
  },
  staleTime: 300_000,
});

export const useFacebookPixel = () => {
  const { data: settings } = usePixelSettings();

  // Load fbq script
  useEffect(() => {
    if (!settings?.pixel_id) return;

    // Don't load twice
    if ((window as any).fbq) return;

    const f = window as any;
    const n: any = (f.fbq = function (...args: any[]) {
      n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);

    (window as any).fbq('init', settings.pixel_id);

    // Fire PageView if enabled
    if (settings.enabled_events.includes('PageView')) {
      (window as any).fbq('track', 'PageView');
    }

    return () => {
      // Cleanup script on unmount (rare)
      try { document.head.removeChild(script); } catch {}
    };
  }, [settings?.pixel_id]);

  const trackEvent = useCallback((eventName: string, data?: Record<string, any>) => {
    if (!settings?.pixel_id || !settings.enabled_events.includes(eventName)) return;
    if (!(window as any).fbq) return;
    (window as any).fbq('track', eventName, data);
  }, [settings]);

  return { trackEvent };
};
