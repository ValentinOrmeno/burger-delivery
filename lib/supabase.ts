import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Tipos de base de datos
export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: 'burger' | 'veggie' | 'bondiolita' | 'pancho' | 'sides' | 'dessert';
  is_available: boolean;
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
