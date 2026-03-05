import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderInsert = Database['public']['Tables']['orders']['Insert'];
type OrderStatus = Database['public']['Enums']['order_status'];
type Product = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type Settings = Database['public']['Tables']['site_settings']['Row'];

// Orders
export const useOrders = (statusFilter?: OrderStatus) => {
  return useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: async () => {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (statusFilter) query = query.eq('status', statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data as Order[];
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
};

export const useCreateOrder = () => {
  return useMutation({
    mutationFn: async (order: OrderInsert) => {
      const { data, error } = await supabase.from('orders').insert(order).select().single();
      if (error) {
        console.error('Order creation error:', error.message, error.details, error.hint);
        throw new Error('অর্ডার তৈরিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
      return data;
    },
    retry: 1,
  });
};

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
};

// Products
export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('sort_order');
      if (error) throw error;
      return data as Product[];
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
};

export const useFeaturedProduct = () => {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').eq('is_featured', true).order('sort_order').limit(1).maybeSingle();
      if (error) throw error;
      return data as Product | null;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
};

export const useUpsertProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: ProductInsert & { id?: string }) => {
      const { data, error } = await supabase.from('products').upsert(product).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useToggleStock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stock_status }: { id: string; stock_status: string }) => {
      const { error } = await supabase.from('products').update({ stock_status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useToggleFeatured = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_featured }: { id: string; is_featured: boolean }) => {
      // If setting as featured, unfeatured all others first
      if (is_featured) {
        await supabase.from('products').update({ is_featured: false }).neq('id', id);
      }
      const { error } = await supabase.from('products').update({ is_featured }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

// Settings
export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('*').limit(1).single();
      if (error) throw error;
      return data as Settings;
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
};

export const useUpdateSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<Settings>) => {
      const { data: current } = await supabase.from('site_settings').select('id').limit(1).single();
      if (!current) throw new Error('No settings row');
      const { error } = await supabase.from('site_settings').update(updates).eq('id', current.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
};

// Review Images
export const useReviewImages = () => {
  return useQuery({
    queryKey: ['review_images'],
    queryFn: async () => {
      const { data, error } = await supabase.from('review_images' as any).select('*').order('sort_order');
      if (error) throw error;
      return data as unknown as { id: string; image_url: string; sort_order: number; created_at: string }[];
    },
    staleTime: 60_000,
  });
};

export const useUploadReviewImage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, sort_order }: { file: File; sort_order: number }) => {
      const ext = file.name.split('.').pop();
      const filePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('review-images').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('review-images').getPublicUrl(filePath);
      const image_url = urlData.publicUrl;
      const { error } = await supabase.from('review_images' as any).insert({ image_url, sort_order } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['review_images'] }),
  });
};

export const useDeleteReviewImage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('review_images' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['review_images'] }),
  });
};
