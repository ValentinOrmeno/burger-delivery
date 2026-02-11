-- ============================================
-- HAMBURGUESERÍA REAL - DATABASE SCHEMA
-- Basado en el menú actual del negocio
-- ============================================

-- Habilitar extensiones necesarias
create extension if not exists "uuid-ossp";

-- ============================================
-- TABLA: products
-- ============================================
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price decimal(10,2) not null check (price >= 0),
  image_url text,
  category text not null check (category in ('burger', 'veggie', 'bondiolita', 'pancho', 'sides', 'dessert')),
  is_available boolean default true,
  size_options jsonb, -- Para Simple/Doble/Triple
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- TABLA: orders
-- ============================================
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  total_amount decimal(10,2) not null check (total_amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'preparing', 'ready', 'delivered', 'cancelled')),
  customer_name text not null,
  customer_phone text not null,
  customer_address text,
  delivery_distance text,
  delivery_cost decimal(10,2),
  payment_id text,
  payment_status text,
  notes text
);

-- ============================================
-- TABLA: order_items
-- ============================================
create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price decimal(10,2) not null check (unit_price >= 0),
  size text, -- Simple, Doble, Triple, Cuádruple
  extras text, -- Bacon extra, etc
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- ÍNDICES
-- ============================================
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_available on public.products(is_available);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Políticas: products
create policy "Anyone can view available products" on public.products for select using (is_available = true);
create policy "Only authenticated users can insert products" on public.products for insert with check (auth.role() = 'authenticated');
create policy "Only authenticated users can update products" on public.products for update using (auth.role() = 'authenticated');
create policy "Only authenticated users can delete products" on public.products for delete using (auth.role() = 'authenticated');

-- Políticas: orders
create policy "Anyone can create orders" on public.orders for insert with check (true);
create policy "Anyone can view orders" on public.orders for select using (true);
create policy "Only authenticated users can update orders" on public.orders for update using (auth.role() = 'authenticated');

-- Políticas: order_items
create policy "Anyone can create order items" on public.order_items for insert with check (true);
create policy "Anyone can view order items" on public.order_items for select using (true);

-- ============================================
-- TRIGGER: Actualizar updated_at
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.products for each row execute procedure public.handle_updated_at();
create trigger set_updated_at before update on public.orders for each row execute procedure public.handle_updated_at();

-- ============================================
-- PRODUCTOS REALES - HAMBURGUESAS ESPECIALES
-- ============================================

INSERT INTO public.products (name, description, price, image_url, category, size_options) VALUES
  -- Especiales
  ('Fresh', 'Cheddar, lechuga, tomate, cebolla morada, salsa mil islas', 13500, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', 'burger', '{"simple": 13500, "doble": 16700, "triple": 19000}'),
  ('Stacker', 'Cheddar, bacon, salsa stacker', 13500, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800', 'burger', '{"simple": 13500, "doble": 16700, "triple": 19000}'),
  ('Bomba de Libra', 'Cheddar, cebolla picada, salsa de libra', 13500, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=800', 'burger', '{"simple": 13500, "doble": 16700, "triple": 19000}'),
  ('American B', 'Cheddar, queso dambo, bacon, cebolla y barbacoa', 13500, 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800', 'burger', '{"simple": 13500, "doble": 16700, "triple": 19000}'),
  ('Crispy', 'Cheddar, bacon, cebolla crispy, salsa alioli', 13500, 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=800', 'burger', '{"simple": 13500, "doble": 16700, "triple": 19000}'),
  ('Criolla', 'Provoleta, rúcula, bacon y salsa criolla', 13500, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800', 'burger', '{"simple": 13500, "doble": 16700, "triple": 19000}'),
  ('Barba Hot', 'Cheddar, bacon, coleslaw, aros de cebolla, salsa picante o barbacoa', 13500, 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=800', 'burger', '{"simple": 13500, "doble": 16700, "triple": 19000}'),
  ('Napolitana', 'Mozzarella, jamón, tomate', 13500, 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800', 'burger', '{"simple": 13500, "doble": 16700, "triple": 19000}'),
  ('Fried Onion', 'Cheddar, carne smasheada con cebolla y salsa especial', 13500, 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800', 'burger', '{"simple": 13500, "doble": 16700, "triple": 19000}'),

  -- De La Casa (Premium)
  ('Tapa Arterias', 'Cheddar, extra bacon y salsa con cebolla', 16200, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800', 'burger', '{"simple": 16200, "doble": 18000, "triple": 19500, "cuadruple": 22400}'),
  ('Normandia', 'Cheddar, bacon, doble huevo y cebolla caramelizada', 16200, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', 'burger', '{"simple": 16200, "doble": 18000, "triple": 19500, "cuadruple": 22400}'),
  ('Almirante', 'Triple cheddar, provoleta, bacon, huevo, cebolla caramelizada y barbacoa', 16400, 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800', 'burger', '{"simple": 16400, "doble": 18200, "triple": 19700, "cuadruple": 22600}'),
  ('Amaro', 'Cheddar, roquefort, tomates confitados, nuez y rúcula', 16200, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800', 'burger', '{"simple": 16200, "doble": 18000, "triple": 19500, "cuadruple": 22400}'),
  ('Blue Bacon', 'Salsa bacon, queso azul, cebolla caramelizada', 16200, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=800', 'burger', '{"simple": 16200, "doble": 18000, "triple": 19500, "cuadruple": 22400}'),

  -- Clásicas
  ('Burger Clásica', 'Cheddar, tomate, lechuga, cebolla', 13000, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', 'burger', '{"simple": 13000, "doble": 16200, "triple": 18500}'),
  ('Burger Completa', 'Cheddar, lechuga, tomate, jamón y huevo', 13000, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800', 'burger', '{"simple": 13000, "doble": 16200, "triple": 18500}'),
  ('Burger Cheddar y Bacon', 'Cheddar y bacon', 13000, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=800', 'burger', '{"simple": 13000, "doble": 16200, "triple": 18500}'),
  ('Burger Premium Bacon', 'Cheddar, bacon y cebolla caramelizada', 13000, 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800', 'burger', '{"simple": 13000, "doble": 16200, "triple": 18500}')
ON CONFLICT DO NOTHING;

-- ============================================
-- PRODUCTOS VEGGIE
-- ============================================

INSERT INTO public.products (name, description, price, image_url, category, size_options) VALUES
  ('Veggie Arroz Yamaní', 'Medallón de arroz yamaní con cebolla caramelizada, lechuga, tomate y salsa especial', 13000, 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=800', 'veggie', '{"simple": 13000, "doble": 16200}'),
  ('Veggie Lentejas', 'Medallón de lentejas y zanahoria, lechuga, tomate y mayonesa', 13000, 'https://images.unsplash.com/photo-1525059696034-4967a729002a?w=800', 'veggie', '{"simple": 13000, "doble": 16200}'),
  ('Veggie Remolacha', 'Medallón de remolacha, rúcula, tomate y alioli', 13000, 'https://images.unsplash.com/photo-1585238341710-4bc679e9e0ce?w=800', 'veggie', '{"simple": 13000, "doble": 16200}'),
  ('Veggie Calabaza', 'Medallón de calabaza y garbanzos, lechuga, cebolla y salsa especial', 13000, 'https://images.unsplash.com/photo-1603064752734-4c48eff53d05?w=800', 'veggie', '{"simple": 13000, "doble": 16200}'),
  ('NotCo Burger', 'Medallón NotCo 100% plant-based, cheddar vegano, lechuga, tomate', 14500, 'https://images.unsplash.com/photo-1585238341710-4bc679e9e0ce?w=800', 'veggie', '{"simple": 14500, "doble": 17400}')
ON CONFLICT DO NOTHING;

-- ============================================
-- BONDIOLITAS
-- ============================================

INSERT INTO public.products (name, description, price, image_url, category) VALUES
  ('Bondiolita Sweet Cheese', 'Cheddar, cebolla caramelizada y barbacoa. Incluye porción de papas fritas', 16000, 'https://images.unsplash.com/photo-1619740455993-8e0b41faed6a?w=800', 'bondiolita'),
  ('Bondiolita Argenta', 'Provoleta, rúcula y salsa criolla. Incluye porción de papas fritas', 16000, 'https://images.unsplash.com/photo-1619898303209-b02e3e9e0af7?w=800', 'bondiolita'),
  ('Bondiolita Almirante', 'Coleslaw o alioli, lechuga, tomate y cebolla. Incluye porción de papas fritas', 16000, 'https://images.unsplash.com/photo-1619898303211-94cb9827cb57?w=800', 'bondiolita')
ON CONFLICT DO NOTHING;

-- ============================================
-- PANCHOS
-- ============================================

INSERT INTO public.products (name, description, price, image_url, category) VALUES
  ('Pancho Tradicional', 'Mayonesa, mostaza, ketchup', 4700, 'https://images.unsplash.com/photo-1612392062422-ef19b42f7f8a?w=800', 'pancho'),
  ('Pancho Cheddar Bacon', 'Cheddar, bacon y verdeo', 5500, 'https://images.unsplash.com/photo-1612392062439-d0b1b2f7c5b3?w=800', 'pancho'),
  ('Pancho Alioli Parmesano', 'Alioli y parmesano', 5500, 'https://images.unsplash.com/photo-1612392062422-ef19b42f7f8a?w=800', 'pancho'),
  ('Pancho Sweet', 'Cheddar, cebolla caramelizada y bacon', 5500, 'https://images.unsplash.com/photo-1612392062439-d0b1b2f7c5b3?w=800', 'pancho')
ON CONFLICT DO NOTHING;

-- ============================================
-- ACOMPAÑAMIENTOS
-- ============================================

INSERT INTO public.products (name, description, price, image_url, category) VALUES
  ('Papas Fritas Simples', 'Porción de papas fritas clásicas', 11500, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800', 'sides'),
  ('Papas con Cheddar', 'Papas fritas con salsa cheddar', 13000, 'https://images.unsplash.com/photo-1630431341973-02e1c36d799c?w=800', 'sides'),
  ('Papas Premium', 'Papas con cheddar, bacon y verdeo', 14500, 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=800', 'sides'),
  ('10 Nuggets + Papas', '10 nuggets de pollo con papas fritas', 12800, 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800', 'sides'),
  ('Chicken Fingers Combo', '400gr de chicken fingers + papas + dip', 13800, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800', 'sides'),
  ('Aros de Cebolla', '6 aros de cebolla rebozados', 4800, 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=800', 'sides')
ON CONFLICT DO NOTHING;

-- ============================================
-- POSTRES
-- ============================================

INSERT INTO public.products (name, description, price, image_url, category) VALUES
  ('Chocotorta', 'Clásica chocotorta casera', 5000, 'https://images.unsplash.com/photo-1606313564016-a90e834c4c55?w=800', 'dessert')
ON CONFLICT DO NOTHING;

-- ============================================
-- CONFIGURACIÓN REALTIME
-- ============================================
alter publication supabase_realtime add table public.orders;

-- ============================================
-- GRANTS
-- ============================================
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;

-- ============================================
-- FINALIZADO
-- ============================================
-- Base de datos configurada con productos reales
-- Total de productos: ~35 items
