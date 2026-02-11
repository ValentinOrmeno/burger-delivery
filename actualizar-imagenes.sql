-- Script para actualizar las URLs de las imágenes de productos
-- Ejecutar en el SQL Editor de Supabase

-- HAMBURGUESAS VEGGIE (mejores imágenes)
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1585238342024-78d788df621e?w=800&q=80' WHERE name = 'Veggie Arroz Yamaní';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1585238341710-4bc679e9e0ce?w=800&q=80' WHERE name = 'Veggie Lentejas';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1525059696034-4967a729002a?w=800&q=80' WHERE name = 'Veggie Remolacha';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=800&q=80' WHERE name = 'Veggie Calabaza';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80' WHERE name = 'NotCo Burger';

-- BONDIOLITAS (mejores imágenes de sándwiches de carne)
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=800&q=80' WHERE name = 'Bondiolita Sweet Cheese';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1619898303209-b02e3e9e0af7?w=800&q=80' WHERE name = 'Bondiolita Argenta';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&q=80' WHERE name = 'Bondiolita Almirante';

-- MEJORAR TODAS LAS HAMBURGUESAS DESTACADAS
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80' WHERE name = 'Fresh';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80' WHERE name = 'Stacker';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=800&q=80' WHERE name = 'Bomba de Libra';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=800&q=80' WHERE name = 'American B';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80' WHERE name = 'Crispy';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800&q=80' WHERE name = 'Criolla';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&q=80' WHERE name = 'Barba Hot';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800&q=80' WHERE name = 'Napolitana';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&q=80' WHERE name = 'Fried Onion';

-- PANCHOS
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1612392166886-ee8475b03af2?w=800&q=80' WHERE name LIKE 'Pancho%';

-- ACOMPAÑAMIENTOS
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1630384082810-3c1a6895fb13?w=800&q=80' WHERE name = 'Papas Fritas Premium';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=800&q=80' WHERE name LIKE '%Onion Rings%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=800&q=80' WHERE name LIKE '%Nuggets%';

-- POSTRES
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80' WHERE name LIKE '%Brownie%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80' WHERE name LIKE '%Helado%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1562440499-64c9a111f713?w=800&q=80' WHERE name LIKE '%Choco%';
