-- Agregar order_type a orders (delivery | pickup)
-- Ejecutar en el SQL Editor de Supabase si la columna no existe

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'delivery' CHECK (order_type IN ('delivery', 'pickup'));

COMMENT ON COLUMN public.orders.order_type IS 'delivery = envío a domicilio, pickup = retiro en local';
