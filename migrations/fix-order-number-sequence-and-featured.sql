-- ============================================================
-- MIGRACIÓN: Secuencia para order_number + campo is_featured
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Crear secuencia para order_number (evita race conditions)
--    Si ya existe la secuencia, este bloque la ignora.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'orders_order_number_seq') THEN
    CREATE SEQUENCE public.orders_order_number_seq
      START WITH 1
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      CACHE 1;
  END IF;
END $$;

-- 2. Sincronizar la secuencia con el máximo order_number actual
--    (para no repetir números ya usados)
SELECT setval(
  'public.orders_order_number_seq',
  COALESCE((SELECT MAX(order_number) FROM public.orders WHERE order_number IS NOT NULL), 0)
);

-- 3. Asignar la secuencia como valor por defecto de order_number
ALTER TABLE public.orders
  ALTER COLUMN order_number SET DEFAULT nextval('public.orders_order_number_seq');

-- 4. Agregar campo is_featured a products (si no existe)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

-- 5. Marcar como destacados los productos que estaban hardcodeados en el frontend
UPDATE public.products
SET is_featured = TRUE
WHERE name IN (
  'Fresh',
  'Stacker',
  'Bomba de Libra',
  'American B',
  'Crispy',
  'Criolla',
  'Barba Hot',
  'Napolitana',
  'Fried Onion'
);

-- Verificar resultados
SELECT name, is_featured FROM public.products ORDER BY is_featured DESC, name;
