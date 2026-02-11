-- Script para agregar el campo "between_streets" (Entre calles) a la tabla orders
-- Ejecutar en Supabase SQL Editor

-- Agregar columna between_streets a la tabla orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS between_streets TEXT;

-- Agregar comentario para documentacion
COMMENT ON COLUMN public.orders.between_streets IS 'Referencias de ubicacion (entre que calles se encuentra la direccion de entrega)';
