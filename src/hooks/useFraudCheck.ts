import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FraudResult {
  allowed: boolean;
  flag: 'low_success' | 'new_customer' | 'good' | 'check_failed' | null;
  total_parcels: number;
  total_delivered: number;
  total_cancel: number;
  success_rate: number | null;
  message: string | null;
  error_message: string | null;
}

export const useFraudCheck = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FraudResult | null>(null);

  const checkPhone = useCallback(async (phone: string): Promise<FraudResult | null> => {
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
        // On invoke error, allow order but flag as check_failed
        const failResult: FraudResult = {
          allowed: true,
          flag: 'check_failed',
          total_parcels: 0,
          total_delivered: 0,
          total_cancel: 0,
          success_rate: null,
          message: null,
          error_message: 'ফাংশন কল ব্যর্থ হয়েছে',
        };
        setResult(failResult);
        return failResult;
      }

      const res = data as FraudResult;
      setResult(res);
      return res;
    } catch (err) {
      console.error('Fraud check failed:', err);
      const failResult: FraudResult = {
        allowed: true,
        flag: 'check_failed',
        total_parcels: 0,
        total_delivered: 0,
        total_cancel: 0,
        success_rate: null,
        message: null,
        error_message: 'নেটওয়ার্ক ত্রুটি',
      };
      setResult(failResult);
      return failResult;
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
