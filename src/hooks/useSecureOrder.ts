import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SecureOrderData {
  customer_name: string;
  customer_email?: string | null;
  phone: string;
  address: string;
  watch_model: string;
  quantity: number;
  payment_method: string;
  trx_id?: string | null;
  delivery_location: string;
  selected_color?: string | null;
  turnstile_token?: string | null;
  payment_type?: string;
  advance_amount?: number;
  upazila?: string | null;
  district?: string | null;
  division?: string | null;
  fraud_total_parcels?: number;
  fraud_total_delivered?: number;
  fraud_total_cancel?: number;
  fraud_success_rate?: number;
  fraud_flag?: string;
  fraud_error_message?: string;
  coupon_code?: string;
  coupon_discount?: number;
  referrer_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
}

export const useSecureOrder = () => {
  return useMutation({
    mutationFn: async (order: SecureOrderData) => {
      console.log('[SecureOrder] Submitting order...');
      const { data, error } = await supabase.functions.invoke('create-order', {
        body: order,
      });
      if (error) {
        console.error('[SecureOrder] Function invoke error:', error);
        // Try to extract meaningful error message
        let msg = 'অর্ডার তৈরিতে সমস্যা হয়েছে।';
        if (error instanceof Error) {
          msg += ` (${error.message})`;
        }
        throw new Error(msg);
      }
      if (data?.error) {
        console.error('[SecureOrder] Server returned error:', data.error);
        throw new Error(data.error);
      }
      console.log('[SecureOrder] Order created successfully:', data?.order?.id);
      return data;
    },
    retry: 1,
  });
};
