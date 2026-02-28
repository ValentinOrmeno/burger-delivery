import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

function createSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
}

export const supabase = createSupabaseClient();

/**
 * Cliente con service_role para uso solo en API routes (server).
 * Bypasea RLS; usar solo para operaciones de admin (ej. eliminar orden).
 * Singleton: se crea una sola vez por proceso para evitar conexiones redundantes.
 */
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) return _supabaseAdmin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  }
  _supabaseAdmin = createClient(url, serviceKey);
  return _supabaseAdmin;
}

// Tipos de base de datos
export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: 'burger' | 'veggie' | 'bondiolita' | 'pancho' | 'sides' | 'dessert';
  is_available: boolean;
  is_featured?: boolean | null;
  promo_price?: number | null;
  promo_active?: boolean | null;
  promo_only_pickup?: boolean | null;
  promo_only_cash?: boolean | null;
  size_options?: {
    simple?: number;
    doble?: number;
    triple?: number;
    cuadruple?: number;
  };
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  order_number?: number;
  created_at: string;
  updated_at: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  between_streets?: string;
  delivery_distance?: string;
  delivery_cost?: number;
  payment_id?: string;
  payment_status?: string;
  payment_method?: 'cash' | 'mercadopago';
  order_type?: 'delivery' | 'pickup';
  notes?: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  extras?: Array<{
    addon_id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  created_at: string;
};

export type OrderWithItems = Order & {
  order_items: (OrderItem & {
    products: Product;
  })[];
};
