-- Script para agregar columnas de delivery y número de orden
-- Ejecutar en el SQL Editor de Supabase

-- 1. Agregar columna order_number (número de orden secuencial)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_number INTEGER;

-- 2. Agregar columna delivery_distance (rango de distancia seleccionado)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_distance TEXT;

-- 3. Agregar columna delivery_cost (costo del delivery)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_cost NUMERIC DEFAULT 0;

-- 4. Agregar columna payment_method (método de pago: 'cash' o 'mercadopago')
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'mercadopago';

-- 5. Generar números de orden para las órdenes existentes
DO $$
DECLARE
  order_record RECORD;
  counter INTEGER := 1;
BEGIN
  FOR order_record IN 
    SELECT id FROM public.orders 
    ORDER BY created_at ASC
  LOOP
    UPDATE public.orders 
    SET order_number = counter 
    WHERE id = order_record.id;
    counter := counter + 1;
  END LOOP;
END $$;

-- 6. Hacer order_number NOT NULL y único después de generar los números
ALTER TABLE public.orders 
ALTER COLUMN order_number SET NOT NULL;

-- 7. Crear índice único en order_number
CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_key 
ON public.orders(order_number);

-- 8. Verificar que todo está correcto
SELECT 
  id, 
  order_number, 
  customer_name, 
  total_amount,
  delivery_cost,
  delivery_distance,
  payment_method,
  status,
  created_at
FROM public.orders 
ORDER BY created_at DESC 
LIMIT 10;
