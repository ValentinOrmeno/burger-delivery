-- ============================================
-- SISTEMA DE EXTRAS Y PERSONALIZACIONES
-- ============================================

-- Tabla de addons/extras disponibles
CREATE TABLE IF NOT EXISTS public.addons (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price decimal(10,2) not null check (price >= 0),
  category text not null check (category in ('size', 'meat', 'topping', 'fries', 'sauce')),
  applicable_to text[], -- Categorías de productos a las que aplica
  is_available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden ver addons disponibles
CREATE POLICY "Anyone can view available addons" 
  ON public.addons FOR SELECT 
  USING (is_available = true);

-- Política: Solo admin puede modificar addons
CREATE POLICY "Only authenticated users can manage addons" 
  ON public.addons FOR ALL 
  USING (auth.role() = 'authenticated');

-- Índice
CREATE INDEX IF NOT EXISTS idx_addons_category ON public.addons(category);

-- ============================================
-- EXTRAS REALES DEL NEGOCIO
-- ============================================

INSERT INTO public.addons (name, description, price, category, applicable_to) VALUES
  -- Tamaños de hamburguesa
  ('Simple', 'Un medallón', 0, 'size', ARRAY['burger', 'veggie']),
  ('Doble', 'Dos medallones', 3200, 'size', ARRAY['burger', 'veggie']),
  ('Triple', 'Tres medallones', 5500, 'size', ARRAY['burger', 'veggie']),
  ('Cuádruple', 'Cuatro medallones', 8900, 'size', ARRAY['burger']),
  
  -- Medallones extra
  ('Medallón Extra Carne', 'Medallón de carne adicional', 3500, 'meat', ARRAY['burger']),
  ('Medallón Extra Veggie', 'Medallón veggie adicional', 3200, 'meat', ARRAY['veggie']),
  ('Medallón NotCo', 'Medallón NotCo plant-based', 4000, 'meat', ARRAY['veggie']),
  
  -- Toppings extras
  ('Cheddar Extra', 'Porción adicional de cheddar', 1700, 'topping', ARRAY['burger', 'veggie', 'bondiolita']),
  ('Bacon Extra', 'Bacon crujiente adicional', 2000, 'topping', ARRAY['burger', 'veggie', 'bondiolita']),
  ('Huevo Extra', 'Huevo frito', 1500, 'topping', ARRAY['burger', 'veggie']),
  ('Cebolla Caramelizada', 'Cebolla caramelizada casera', 1200, 'topping', ARRAY['burger', 'veggie']),
  ('Rúcula', 'Rúcula fresca', 800, 'topping', ARRAY['burger', 'veggie', 'bondiolita']),
  ('Tomate', 'Rodaja de tomate fresco', 500, 'topping', ARRAY['burger', 'veggie', 'bondiolita']),
  ('Cebolla Crispy', 'Aros de cebolla crispy', 1500, 'topping', ARRAY['burger', 'veggie']),
  ('Provoleta', 'Queso provoleta', 2000, 'topping', ARRAY['burger', 'veggie']),
  
  -- Extras para papas
  ('Papas con Cheddar', 'Agregar cheddar a las papas', 2800, 'fries', ARRAY['burger', 'veggie', 'bondiolita']),
  ('Papas con Cheddar y Bacon', 'Agregar cheddar y bacon a las papas', 3100, 'fries', ARRAY['burger', 'veggie', 'bondiolita']),
  ('Papas Premium', 'Cheddar, bacon y verdeo en las papas', 3500, 'fries', ARRAY['burger', 'veggie', 'bondiolita']),
  ('Agrandar Papas', 'Porción grande de papas', 3800, 'fries', ARRAY['burger', 'veggie', 'bondiolita']),
  
  -- Salsas extras
  ('Salsa Cheddar', 'Porción de salsa cheddar', 2800, 'sauce', ARRAY['burger', 'veggie', 'sides']),
  ('Salsa Stacker', 'Salsa especial stacker', 2800, 'sauce', ARRAY['burger', 'veggie']),
  ('Salsa Mil Islas', 'Salsa mil islas', 2800, 'sauce', ARRAY['burger', 'veggie']),
  ('Salsa Criolla', 'Salsa criolla casera', 2800, 'sauce', ARRAY['burger', 'veggie', 'bondiolita']),
  ('Salsa Alioli', 'Alioli casero', 2800, 'sauce', ARRAY['burger', 'veggie', 'bondiolita']),
  ('Barbacoa', 'Salsa barbacoa ahumada', 1400, 'sauce', ARRAY['burger', 'veggie', 'bondiolita']),
  ('Mayonesa', 'Mayonesa', 1400, 'sauce', ARRAY['burger', 'veggie', 'bondiolita', 'sides']),
  ('Ketchup', 'Ketchup', 1400, 'sauce', ARRAY['burger', 'veggie', 'sides']),
  ('Mostaza', 'Mostaza', 1400, 'sauce', ARRAY['burger', 'veggie', 'sides'])
ON CONFLICT DO NOTHING;

-- ============================================
-- MODIFICAR TABLA ORDER_ITEMS PARA SOPORTAR EXTRAS
-- ============================================

-- Agregar columna para extras en JSON
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS extras jsonb DEFAULT '[]'::jsonb;

-- Agregar comentario explicativo
COMMENT ON COLUMN public.order_items.extras IS 
  'Array de extras seleccionados en formato: [{"addon_id": "uuid", "name": "Cheddar Extra", "price": 1700}]';

-- ============================================
-- VISTA PARA FACILITAR CONSULTAS
-- ============================================

CREATE OR REPLACE VIEW order_items_with_details AS
SELECT 
  oi.*,
  p.name as product_name,
  p.image_url as product_image,
  p.category as product_category,
  (oi.unit_price + COALESCE((
    SELECT SUM((extra->>'price')::decimal)
    FROM jsonb_array_elements(oi.extras) as extra
  ), 0)) as total_price_with_extras
FROM order_items oi
JOIN products p ON oi.product_id = p.id;

-- ============================================
-- GRANTS
-- ============================================
GRANT ALL ON public.addons TO anon, authenticated;
GRANT SELECT ON order_items_with_details TO anon, authenticated;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver todos los addons disponibles
SELECT 
  category,
  name,
  price,
  applicable_to
FROM addons
WHERE is_available = true
ORDER BY category, price;

-- ✅ Sistema de extras listo!
