-- Columnas de promoción en products (ejecutar en SQL Editor de Supabase si no existen)
-- promo_only_cash: la promo aplica solo si el cliente paga en efectivo
-- promo_only_pickup: la promo aplica solo si el cliente retira en el local

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS promo_active BOOLEAN DEFAULT false;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS promo_price NUMERIC;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS promo_only_pickup BOOLEAN DEFAULT false;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS promo_only_cash BOOLEAN DEFAULT false;
