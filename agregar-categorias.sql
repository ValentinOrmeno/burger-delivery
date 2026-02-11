-- ============================================
-- AGREGAR CATEGORÍAS NUEVAS A LA TABLA
-- Solo si usaste el script SQL original
-- ============================================

-- Eliminar la restricción antigua de categorías
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;

-- Crear la nueva restricción con todas las categorías
ALTER TABLE products ADD CONSTRAINT products_category_check 
  CHECK (category IN ('burger', 'veggie', 'bondiolita', 'pancho', 'sides', 'dessert'));

-- Verificar que funcionó
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'products_category_check';

-- ✅ Listo! Ahora puedes insertar productos con las nuevas categorías
