import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { compressImage } from '@/lib/imageCompressor';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderInsert = Database['public']['Tables']['orders']['Insert'];
type OrderStatus = Database['public']['Enums']['order_status'];
type Product = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type Settings = Database['public']['Tables']['site_settings']['Row'];

// ─── Lightweight column sets for bandwidth optimization ───

const ORDER_LIST_COLUMNS = 'id,customer_name,phone,address,watch_model,quantity,total_price,delivery_charge,delivery_location,status,payment_method,payment_type,advance_amount,trx_id,selected_color,courier_booked,courier_provider,tracking_id,fraud_flag,fraud_success_rate,fraud_error_message,upazila,district,division,created_at' as const;

const ORDER_STATS_COLUMNS = 'id,customer_name,phone,customer_email,watch_model,quantity,total_price,delivery_charge,delivery_location,status,payment_method,payment_type,advance_amount,courier_booked,courier_provider,division,district,created_at' as const;

const PRODUCT_LIST_COLUMNS = 'id,name,subtitle,price,discount_percent,stock_status,is_featured,product_type,thumbnail_url,image_urls,sort_order,sourcing_cost' as const;

// ─── Orders ───

interface OrdersPaginatedParams {
  page: number;
  pageSize: number;
  statusFilter?: OrderStatus;
  paymentFilter?: 'cod' | 'online';
  search?: string;
}

interface OrdersPaginatedResult {
  data: Order[];
  totalCount: number;
}

/** Server-side paginated orders for the Orders admin table */
export const useOrdersPaginated = ({ page, pageSize, statusFilter, paymentFilter, search }: OrdersPaginatedParams) => {
  return useQuery({
    queryKey: ['orders_paginated', page, pageSize, statusFilter, paymentFilter, search],
    queryFn: async (): Promise<OrdersPaginatedResult> => {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('orders')
        .select(ORDER_LIST_COLUMNS, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (statusFilter) query = query.eq('status', statusFilter);

      if (paymentFilter === 'cod') {
        query = query.eq('payment_method', 'cod');
      } else if (paymentFilter === 'online') {
        query = query.neq('payment_method', 'cod');
      }

      if (search?.trim()) {
        const q = search.trim();
        query = query.or(`customer_name.ilike.%${q}%,phone.ilike.%${q}%,watch_model.ilike.%${q}%,trx_id.ilike.%${q}%`);
      }

      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: (data || []) as Order[], totalCount: count ?? 0 };
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
    placeholderData: (prev) => prev,
  });
};

/** Full order list (non-paginated) — only used for bulk operations */
export const useOrders = (statusFilter?: OrderStatus) => {
  return useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: async () => {
      let query = supabase.from('orders').select(ORDER_LIST_COLUMNS).order('created_at', { ascending: false });
      if (statusFilter) query = query.eq('status', statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data as Order[];
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
};

/** Lightweight orders for Dashboard/Analytics/Customers aggregation */
export const useOrdersLite = () => {
  return useQuery({
    queryKey: ['orders_lite'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(ORDER_STATS_COLUMNS)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['orders_lite'] });
      qc.invalidateQueries({ queryKey: ['orders_paginated'] });
    },
  });
};

// ─── Products ───

/** Full product data for edit forms */
export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('sort_order');
      if (error) throw error;
      return data as Product[];
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
};

/** Lightweight product list for admin table & dashboard */
export const useProductsLite = () => {
  return useQuery({
    queryKey: ['products_lite'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_LIST_COLUMNS)
        .order('sort_order');
      if (error) throw error;
      return data as Product[];
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
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
    staleTime: 60_000,
    refetchInterval: 120_000,
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['products_lite'] });
    },
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['products_lite'] });
    },
  });
};

export const useToggleStock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stock_status }: { id: string; stock_status: string }) => {
      const { error } = await supabase.from('products').update({ stock_status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['products_lite'] });
    },
  });
};

export const useToggleFeatured = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_featured }: { id: string; is_featured: boolean }) => {
      if (is_featured) {
        await supabase.from('products').update({ is_featured: false }).neq('id', id);
      }
      const { error } = await supabase.from('products').update({ is_featured }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['products_lite'] });
    },
  });
};

// ─── Settings ───

export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('*').limit(1).single();
      if (error) throw error;
      return data as Settings;
    },
    staleTime: 120_000,
    refetchInterval: 300_000,
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

// ─── Review Images ───

export const useReviewImages = () => {
  return useQuery({
    queryKey: ['review_images'],
    queryFn: async () => {
      const { data, error } = await supabase.from('review_images' as any).select('*').order('sort_order');
      if (error) throw error;
      return data as unknown as { id: string; image_url: string; sort_order: number; created_at: string }[];
    },
    staleTime: 120_000,
  });
};

export const useUploadReviewImage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, sort_order }: { file: File; sort_order: number }) => {
      const compressed = await compressImage(file);
      const ext = compressed.name.split('.').pop() || 'webp';
      const filePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('review-images').upload(filePath, compressed);
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
