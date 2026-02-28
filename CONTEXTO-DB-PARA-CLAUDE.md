# Contexto de base de datos para Claude

Copiá y pegá este bloque cuando Claude te pida cómo están definidas las tablas de products y addons (o si tienen is_available / stock).

---

## Tabla `products`

```sql
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price decimal(10,2) not null check (price >= 0),
  image_url text,
  category text not null check (category in ('burger', 'veggie', 'bondiolita', 'pancho', 'sides', 'dessert')),
  is_available boolean default true,
  is_featured boolean default false,
  size_options jsonb,  -- ej. {"simple": 13500, "doble": 16700, "triple": 19000}
  promo_active boolean default false,
  promo_price decimal(10,2),
  promo_only_pickup boolean default false,
  promo_only_cash boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
```

- **is_available:** sí existe. Booleano. Se usa para mostrar u ocultar productos en el menú (RLS: solo se pueden leer los que tienen `is_available = true`).
- **Stock:** no hay columna de stock. Solo disponibilidad con `is_available`.

---

## Tabla `addons`

```sql
create table public.addons (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price decimal(10,2) not null check (price >= 0),
  category text not null check (category in ('size', 'meat', 'topping', 'fries', 'sauce')),
  applicable_to text[],  -- qué categorías de producto pueden usar este addon (ej. ARRAY['burger','veggie'])
  is_available boolean default true,
  created_at timestamptz default now() not null
);
```

- **is_available:** sí existe. Booleano. Se usa para mostrar u ocultar extras en el personalizador.
- **Stock:** no hay columna de stock. Solo disponibilidad con `is_available`.

---

## Resumen para Claude

- **products:** tiene `is_available` (boolean), no tiene columna de stock.
- **addons:** tiene `is_available` (boolean), no tiene columna de stock.
- Los extras de cada ítem del pedido se guardan en `order_items.extras` (jsonb), con addon_id, name, price, quantity; no hay tabla intermedia product-addon, los addons se aplican por categoría de producto (`applicable_to`).

Si Claude recomienda agregar stock u otra columna, podés decirle que tenés Supabase (PostgreSQL) y que preferís migraciones SQL compatibles con el proyecto actual.
