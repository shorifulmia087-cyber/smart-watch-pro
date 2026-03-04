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
  });
};

export const useCreateOrder = () => {
  return useMutation({
    mutationFn: async (order: OrderInsert) => {
      const { data, error } = await supabase.from('orders').insert(order).select().single();
      if (error) throw error;
      return data;
    },
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

// Settings
export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('*').limit(1).single();
      if (error) throw error;
      return data as Settings;
    },
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
