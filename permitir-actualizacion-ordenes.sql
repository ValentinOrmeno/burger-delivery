-- ============================================
-- PERMITIR ACTUALIZACIÓN DE ÓRDENES SIN AUTH
-- Solo para testing del dashboard
-- ============================================

-- Eliminar la política restrictiva actual
DROP POLICY IF EXISTS "Only authenticated users can update orders" ON public.orders;

-- Crear nueva política que permite actualizaciones públicas
CREATE POLICY "Anyone can update orders" 
  ON public.orders 
  FOR UPDATE 
  USING (true)
  WITH CHECK (true);

-- Verificar que funcionó
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'orders';

-- ✅ Ahora el dashboard admin puede cambiar estados sin autenticación
