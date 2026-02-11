-- ============================================
-- HAMBURGUESERÍA PREMIUM - DATABASE SCHEMA
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
  category text not null check (category in ('burger', 'fries', 'drink', 'dessert', 'combo')),
  is_available boolean default true,
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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- ÍNDICES para mejor performance
-- ============================================
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_available on public.products(is_available);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- ============================================
-- POLÍTICAS: products
-- ============================================

-- Todos pueden leer productos disponibles
create policy "Anyone can view available products"
  on public.products for select
  using (is_available = true);

-- Solo admin autenticados pueden insertar/actualizar/eliminar productos
create policy "Only authenticated users can insert products"
  on public.products for insert
  with check (auth.role() = 'authenticated');

create policy "Only authenticated users can update products"
  on public.products for update
  using (auth.role() = 'authenticated');

create policy "Only authenticated users can delete products"
  on public.products for delete
  using (auth.role() = 'authenticated');

-- ============================================
-- POLÍTICAS: orders
-- ============================================

-- Todos pueden crear órdenes (clientes anónimos)
create policy "Anyone can create orders"
  on public.orders for insert
  with check (true);

-- Todos pueden leer órdenes (para tracking)
create policy "Anyone can view orders"
  on public.orders for select
  using (true);

-- Solo usuarios autenticados pueden actualizar órdenes (admin)
create policy "Only authenticated users can update orders"
  on public.orders for update
  using (auth.role() = 'authenticated');

-- ============================================
-- POLÍTICAS: order_items
-- ============================================

-- Todos pueden crear items de orden
create policy "Anyone can create order items"
  on public.order_items for insert
  with check (true);

-- Todos pueden leer items de orden
create policy "Anyone can view order items"
  on public.order_items for select
  using (true);

-- ============================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers para actualizar updated_at
create trigger set_updated_at
  before update on public.products
  for each row
  execute procedure public.handle_updated_at();

create trigger set_updated_at
  before update on public.orders
  for each row
  execute procedure public.handle_updated_at();

-- ============================================
-- DATOS DE EJEMPLO (Productos)
-- ============================================
insert into public.products (name, description, price, image_url, category, is_available) values
  ('Classic Burger', 'Hamburguesa clásica con carne Angus, lechuga, tomate y salsa especial', 12.99, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', 'burger', true),
  ('Bacon Deluxe', 'Doble carne, bacon crujiente, queso cheddar y cebolla caramelizada', 15.99, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800', 'burger', true),
  ('Veggie Supreme', 'Hamburguesa vegetal con aguacate, hongos y mayonesa de chipotle', 13.99, 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=800', 'burger', true),
  ('BBQ Monster', 'Triple carne, aros de cebolla, salsa BBQ ahumada y jalapeños', 18.99, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=800', 'burger', true),
  ('Papas Clásicas', 'Papas fritas corte tradicional con sal marina', 4.99, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800', 'fries', true),
  ('Papas Cheddar Bacon', 'Papas con queso cheddar fundido y bacon bits', 6.99, 'https://images.unsplash.com/photo-1630431341973-02e1c36d799c?w=800', 'fries', true),
  ('Coca Cola', 'Refresco Coca Cola 500ml', 2.99, 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800', 'drink', true),
  ('Limonada Natural', 'Limonada fresca hecha en casa con menta', 3.99, 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9f?w=800', 'drink', true),
  ('Milkshake Oreo', 'Batido cremoso de Oreo con crema chantilly', 5.99, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800', 'dessert', true),
  ('Brownie Chocolate', 'Brownie tibio con helado de vainilla y salsa de chocolate', 6.99, 'https://images.unsplash.com/photo-1606313564016-a90e834c4c55?w=800', 'dessert', true)
on conflict do nothing;

-- ============================================
-- CONFIGURACIÓN REALTIME
-- ============================================
-- Habilitar realtime para la tabla orders
alter publication supabase_realtime add table public.orders;

-- ============================================
-- GRANTS (Permisos)
-- ============================================
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;

-- ============================================
-- FINALIZADO
-- ============================================
-- Script ejecutado exitosamente.
-- Próximo paso: Configurar las variables de entorno en Next.js
