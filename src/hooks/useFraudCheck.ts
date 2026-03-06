import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FraudResult {
  allowed: boolean;
  flag: 'low_success' | 'new_customer' | 'good' | null;
  total_parcels: number;
  total_delivered: number;
  total_cancel: number;
  success_rate: number | null;
  message: string | null;
}

export const useFraudCheck = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FraudResult | null>(null);

  const checkPhone = useCallback(async (phone: string) => {
    const clean = phone.replace(/[\s-]/g, '');
    if (!/^01[3-9]\d{8}$/.test(clean)) {
      setResult(null);
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-fraud', {
        body: { phone: clean },
      });

      if (error) {
        console.error('Fraud check error:', error);
        setResult(null);
        return null;
      }

      setResult(data as FraudResult);
      return data as FraudResult;
    } catch (err) {
      console.error('Fraud check failed:', err);
      setResult(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setLoading(false);
  }, []);

  return { checkPhone, loading, result, reset };
};
