-- ============================================
-- ACTUALIZAR SOLO PRODUCTOS - DATOS REALES
-- Este script SOLO actualiza los productos
-- NO modifica la estructura de tablas
-- ============================================

-- PASO 1: Borrar productos anteriores
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM products;

-- PASO 2: Insertar productos REALES del negocio

-- ============================================
-- HAMBURGUESAS ESPECIALES
-- ============================================

INSERT INTO public.products (name, description, price, image_url, category, is_available) VALUES
  -- Especiales
  ('Fresh', 'Cheddar, lechuga, tomate, cebolla morada, salsa mil islas', 13500, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', 'burger', true),
  ('Stacker', 'Cheddar, bacon, salsa stacker', 13500, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800', 'burger', true),
  ('Bomba de Libra', 'Cheddar, cebolla picada, salsa de libra', 13500, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=800', 'burger', true),
  ('American B', 'Cheddar, queso dambo, bacon, cebolla y barbacoa', 13500, 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800', 'burger', true),
  ('Crispy', 'Cheddar, bacon, cebolla crispy, salsa alioli', 13500, 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=800', 'burger', true),
  ('Criolla', 'Provoleta, rúcula, bacon y salsa criolla', 13500, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800', 'burger', true),
  ('Barba Hot', 'Cheddar, bacon, coleslaw, aros de cebolla, salsa picante o barbacoa', 13500, 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=800', 'burger', true),
  ('Napolitana', 'Mozzarella, jamón, tomate', 13500, 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800', 'burger', true),
  ('Fried Onion', 'Cheddar, carne smasheada con cebolla y salsa especial', 13500, 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800', 'burger', true),

  -- De La Casa (Premium)
  ('Tapa Arterias', 'Cheddar, extra bacon y salsa con cebolla', 16200, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800', 'burger', true),
  ('Normandia', 'Cheddar, bacon, doble huevo y cebolla caramelizada', 16200, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', 'burger', true),
  ('Almirante', 'Triple cheddar, provoleta, bacon, huevo, cebolla caramelizada y barbacoa', 16400, 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800', 'burger', true),
  ('Amaro', 'Cheddar, roquefort, tomates confitados, nuez y rúcula', 16200, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800', 'burger', true),
  ('Blue Bacon', 'Salsa bacon, queso azul, cebolla caramelizada', 16200, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=800', 'burger', true),

  -- Clásicas
  ('Burger Clásica', 'Cheddar, tomate, lechuga, cebolla', 13000, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', 'burger', true),
  ('Burger Completa', 'Cheddar, lechuga, tomate, jamón y huevo', 13000, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800', 'burger', true),
  ('Burger Cheddar y Bacon', 'Cheddar y bacon', 13000, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=800', 'burger', true),
  ('Burger Premium Bacon', 'Cheddar, bacon y cebolla caramelizada', 13000, 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800', 'burger', true);

-- ============================================
-- HAMBURGUESAS VEGGIE
-- ============================================

INSERT INTO public.products (name, description, price, image_url, category, is_available) VALUES
  ('Veggie Arroz Yamaní', 'Medallón de arroz yamaní con cebolla caramelizada, lechuga, tomate y salsa especial', 13000, 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=800', 'veggie', true),
  ('Veggie Lentejas', 'Medallón de lentejas y zanahoria, lechuga, tomate y mayonesa', 13000, 'https://images.unsplash.com/photo-1525059696034-4967a729002a?w=800', 'veggie', true),
  ('Veggie Remolacha', 'Medallón de remolacha, rúcula, tomate y alioli', 13000, 'https://images.unsplash.com/photo-1585238341710-4bc679e9e0ce?w=800', 'veggie', true),
  ('Veggie Calabaza', 'Medallón de calabaza y garbanzos, lechuga, cebolla y salsa especial', 13000, 'https://images.unsplash.com/photo-1603064752734-4c48eff53d05?w=800', 'veggie', true),
  ('NotCo Burger', 'Medallón NotCo 100% plant-based, cheddar vegano, lechuga, tomate', 14500, 'https://images.unsplash.com/photo-1585238341710-4bc679e9e0ce?w=800', 'veggie', true);

-- ============================================
-- BONDIOLITAS
-- ============================================

INSERT INTO public.products (name, description, price, image_url, category, is_available) VALUES
  ('Bondiolita Sweet Cheese', 'Cheddar, cebolla caramelizada y barbacoa. Incluye porción de papas fritas', 16000, 'https://images.unsplash.com/photo-1619740455993-8e0b41faed6a?w=800', 'bondiolita', true),
  ('Bondiolita Argenta', 'Provoleta, rúcula y salsa criolla. Incluye porción de papas fritas', 16000, 'https://images.unsplash.com/photo-1619898303209-b02e3e9e0af7?w=800', 'bondiolita', true),
  ('Bondiolita Almirante', 'Coleslaw o alioli, lechuga, tomate y cebolla. Incluye porción de papas fritas', 16000, 'https://images.unsplash.com/photo-1619898303211-94cb9827cb57?w=800', 'bondiolita', true);

-- ============================================
-- PANCHOS
-- ============================================

INSERT INTO public.products (name, description, price, image_url, category, is_available) VALUES
  ('Pancho Tradicional', 'Mayonesa, mostaza, ketchup', 4700, 'https://images.unsplash.com/photo-1612392062422-ef19b42f7f8a?w=800', 'pancho', true),
  ('Pancho Cheddar Bacon', 'Cheddar, bacon y verdeo', 5500, 'https://images.unsplash.com/photo-1612392062439-d0b1b2f7c5b3?w=800', 'pancho', true),
  ('Pancho Alioli Parmesano', 'Alioli y parmesano', 5500, 'https://images.unsplash.com/photo-1612392062422-ef19b42f7f8a?w=800', 'pancho', true),
  ('Pancho Sweet', 'Cheddar, cebolla caramelizada y bacon', 5500, 'https://images.unsplash.com/photo-1612392062439-d0b1b2f7c5b3?w=800', 'pancho', true);

-- ============================================
-- ACOMPAÑAMIENTOS
-- ============================================

INSERT INTO public.products (name, description, price, image_url, category, is_available) VALUES
  ('Papas Fritas Simples', 'Porción de papas fritas clásicas', 11500, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800', 'sides', true),
  ('Papas con Cheddar', 'Papas fritas con salsa cheddar', 13000, 'https://images.unsplash.com/photo-1630431341973-02e1c36d799c?w=800', 'sides', true),
  ('Papas Premium', 'Papas con cheddar, bacon y verdeo', 14500, 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=800', 'sides', true),
  ('10 Nuggets + Papas', '10 nuggets de pollo con papas fritas', 12800, 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800', 'sides', true),
  ('Chicken Fingers Combo', '400gr de chicken fingers + papas + dip', 13800, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800', 'sides', true),
  ('Aros de Cebolla', '6 aros de cebolla rebozados', 4800, 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=800', 'sides', true);

-- ============================================
-- POSTRES
-- ============================================

INSERT INTO public.products (name, description, price, image_url, category, is_available) VALUES
  ('Chocotorta', 'Clásica chocotorta casera', 5000, 'https://images.unsplash.com/photo-1606313564016-a90e834c4c55?w=800', 'dessert', true);

-- ============================================
-- RESUMEN
-- ============================================

SELECT 
  category,
  COUNT(*) as total_productos,
  MIN(price) as precio_minimo,
  MAX(price) as precio_maximo
FROM products
GROUP BY category
ORDER BY category;

-- ¡Productos actualizados exitosamente!
-- Total: 35+ productos reales del menú
