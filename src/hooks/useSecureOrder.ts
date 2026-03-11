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
}

export const useSecureOrder = () => {
  return useMutation({
    mutationFn: async (order: SecureOrderData) => {
      const { data, error } = await supabase.functions.invoke('create-order', {
        body: order,
      });
      if (error) {
        throw new Error('অর্ডার তৈরিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
      if (data?.error) {
        throw new Error(data.error);
      }
      return data;
    },
    retry: 1,
  });
};
