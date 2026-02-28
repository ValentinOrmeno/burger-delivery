# Contexto de la app — El Almirante (hamburguesería)

Documento para dar a otra IA o desarrollador. Proyecto: **pedidos y delivery de hamburguesería** en Moreno, Buenos Aires, Argentina.

---

## 1. Stack técnico

- **Framework:** Next.js 15 (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS, Shadcn/UI (Radix), componentes en `components/ui/`
- **Estado del carrito:** Zustand con persistencia (`lib/store/cart.ts`)
- **Backend/DB:** Supabase (PostgreSQL, Realtime, Service Role para admin)
- **Pagos:** Mercado Pago (checkout y webhook)
- **Comunicación:** WhatsApp (número en `lib/constants.ts`: `WHATSAPP_NUMBER`)
- **Geocoding/autocompletado:** Google Places Autocomplete API + Google Geocoding API → `GOOGLE_MAPS_API_KEY` (server-only). Fallback automático a Mapbox si no hay key de Google.
- **Rutas/distancia GPS:** Mapbox Directions v5 → `MAPBOX_ACCESS_TOKEN` (server-only)

---

## 2. Estructura de carpetas relevante

```
app/
  layout.tsx          # Layout global
  page.tsx            # Home: menú por categorías, promos arriba, carrito flotante
  checkout/page.tsx    # Formulario de entrega, pago, autocompletado dirección, GPS/distancia
  admin/page.tsx      # Panel admin: órdenes, estados, promociones, login con contraseña
  success/page.tsx    # Post-pago MP OK + link WhatsApp
  failure/page.tsx    # Post-pago MP fallido
  pending/page.tsx    # Pago MP pendiente
  globals.css
  api/
    geocode/route.ts           # GET ?q=... → Mapbox Geocoding, sugerencias solo Moreno
    calculate-distance/route.ts# POST { latitude, longitude } → Mapbox Directions + fallback Haversine
    checkout/route.ts          # POST crear orden y preferencia Mercado Pago
    checkout/cash/route.ts     # POST orden en efectivo
    orders/[orderId]/route.ts  # GET detalle orden (para mensaje WhatsApp)
    webhooks/mercadopago/route.ts # POST webhook MP
    admin/products/route.ts    # GET productos (admin)
    admin/products/[productId]/route.ts # PATCH promo (promo_active, promo_price, etc.)
    admin/orders/[orderId]/route.ts    # PATCH estado orden, DELETE orden
lib/
  constants.ts   # WHATSAPP_NUMBER, DELIVERY_RATES, getDeliveryCost, getDeliveryCostByDistanceKm
  supabase.ts    # Cliente Supabase, getSupabaseAdmin(), tipos Product, Order, OrderItem, OrderWithItems
  store/cart.ts  # Zustand: items, addItem, removeItem, getTotal(context?), getEffectiveUnitPrice(..., context?)
  hooks/useAdminAuth.ts
  utils.ts       # formatPrice, formatDate
components/
  product-card.tsx, product-customizer.tsx, floating-cart.tsx, site-footer.tsx
  AdminLoginScreen.tsx
  ui/            # button, input, card, badge, dialog
```

---

## 3. Base de datos (Supabase)

- **products:** id, name, description, price, image_url, category, is_available, **is_featured**, promo_active, promo_price, promo_only_pickup, promo_only_cash, size_options, created_at, updated_at.
- **orders:** id, order_number, total_amount, status (pending | paid | preparing | ready | delivered | cancelled), customer_name, customer_phone, customer_address, between_streets, delivery_distance, delivery_cost, payment_id, payment_status, payment_method (cash | mercadopago), order_type (delivery | pickup), notes, …
- **order_items:** order_id, product_id, quantity, unit_price, extras (JSON), …
- Cliente normal: `supabase` (anon). Admin/operaciones sensibles: `getSupabaseAdmin()` (service role) solo en API routes.

---

## 4. Carrito y promos

- **Zustand** persiste el carrito (localStorage).
- **PromoContext:** `{ paymentMethod?: 'cash' | 'mercadopago', orderType?: 'delivery' | 'pickup' }`.
- `getTotal(context?)` y `getEffectiveUnitPrice(product, extras, context?)` aplican precio promocional si `promo_active` y se cumplen `promo_only_cash` / `promo_only_pickup`.
- En checkout el total y los ítems usan `promoContext = { paymentMethod, orderType }` donde `orderType` puede ser `'delivery'` o `'pickup'` (el usuario elige en el formulario).

---

## 5. Envío y distancia

- **Rangos y precios** en `lib/constants.ts`: `DELIVERY_RATES` (ej. hasta 950 m = 600, 1–1.4 km = 1400, … hasta 4 km). `getDeliveryCostByDistanceKm(km)` devuelve `{ cost, range, outOfRange }`.
- **Origen fijo:** `STORE_COORDINATES = { lat: -34.627961, lng: -58.766381 }` (en `app/api/calculate-distance/route.ts`).
- **API calculate-distance (POST):**
  - Si llegan `latitude`, `longitude`: llama **Mapbox Directions** (driving) origen → destino; aplica **SAFETY_FACTOR = 1.5** al resultado en km; redondeo a 1 decimal. Si falla o no hay token, usa **Haversine** × **STRAIGHT_LINE_FACTOR = 2.0** y mismo redondeo.
  - Sin coordenadas: solo simulación (dev) o mensaje de error.
- Respuesta: `distance_km`, `distance_text`, `duration_text`, `delivery_cost`, `delivery_range`; si `outOfRange` devuelve error.
- En checkout: botón “Usar mi ubicación” → GPS → POST calculate-distance → se muestra distancia y costo; opción “Cambiar” para elegir rango a mano. Si el usuario elige una sugerencia del autocompletado con coordenadas, se llama calculate-distance con esas coords para prellenar distancia/costo.

---

## 6. Autocompletado de direcciones (geocode)

- **GET /api/geocode?q=...** (q mínimo 3 caracteres).
- Llama **Mapbox Geocoding v6** (forward) con:
  - `q` = texto tal cual (sin concatenar ", Moreno, Buenos Aires").
  - `bbox` = partido de Moreno: `-58.98,-34.74,-58.72,-34.50` (evita Ituzaingó).
  - `proximity` = coordenadas del local en formato lng,lat: `-58.766381,-34.627961` (mismo que STORE_COORDINATES).
  - `country=AR`, `language=es`, `types=address,street,place,locality,neighborhood`, `limit=10`.
- Se mapean features a `{ address, context, full_address, latitude, longitude }` (address con calle + número desde `context.address` cuando exista).
- Filtro opcional: si la primera palabra del query tiene ≥3 letras, solo se devuelven sugerencias cuya dirección (lowercase) la contenga; si eso deja 0 resultados, se devuelven todas (sin filtrar).
- Si el query tiene dígitos, se ordenan primero tipos `address` y `street`.
- En checkout: input “Calle y número” con debounce 350 ms llama a `/api/geocode` y muestra un dropdown; al elegir una sugerencia se rellena el campo y, si hay coordenadas, se llama a `/api/calculate-distance` para actualizar distancia y costo.

---

## 7. Checkout y pagos

- **Efectivo:** POST `/api/checkout/cash` con datos del formulario; se crea orden en Supabase; se muestra mensaje/link WhatsApp.
- **Mercado Pago:** POST `/api/checkout` crea orden y preferencia MP; redirección a `init_point`; webhook POST `/api/webhooks/mercadopago` actualiza estado de la orden (paid, etc.).
- Validaciones en checkout: entre calles o notas obligatorios; nombre, teléfono, dirección, distancia de envío obligatorios.
- Precios y totales en checkout y en el mensaje WhatsApp usan `getEffectiveUnitPrice` y `getTotal(promoContext)` según método de pago.

---

## 8. Admin

- **Ruta:** `/admin`. Protegido con **useAdminAuth** (contraseña en `NEXT_PUBLIC_ADMIN_PASSWORD`, sesión en sessionStorage). Componente **AdminLoginScreen** si no está autenticado.
- **Pestañas:** Órdenes (lista por estado, actualización en tiempo real con Supabase Realtime) y Promociones (tabla de productos con promo_active, promo_price, promo_only_cash, promo_only_pickup; PATCH por producto).
- Acciones por orden: cambiar estado (pending → paid → preparing → ready → delivered), cancelar con motivo, eliminar (DELETE con service role). Botón WhatsApp por orden (link wa.me con número normalizado y mensaje prearmado).
- Historial de órdenes completadas con búsqueda por nombre de cliente o número de orden.
- API admin: `getSupabaseAdmin()` para leer/actualizar órdenes y productos.

---

## 9. Variables de entorno (resumen)

- **Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Mercado Pago:** `NEXT_PUBLIC_MP_PUBLIC_KEY`, `MP_ACCESS_TOKEN`
- **App:** `NEXT_PUBLIC_APP_URL` (ej. para webhooks), `NEXT_PUBLIC_ADMIN_PASSWORD`
- **Google Maps:** `GOOGLE_MAPS_API_KEY` (Places Autocomplete + Geocoding; solo servidor). Fallback a Mapbox si no está configurada.
- **Mapbox:** `MAPBOX_ACCESS_TOKEN` (Directions v5 para cálculo de distancia GPS; solo servidor)

---

## 10. Convenciones útiles

- Precios en pesos; `formatPrice` en `lib/utils.ts`.
- WhatsApp: número fijo en `lib/constants.ts`; normalización de teléfono para wa.me en admin (incluir 549 para Argentina).
- Imágenes: Next.js Image con `remotePatterns` en `next.config.js` (Unsplash, Supabase).
- Tipos de orden: `delivery` | `pickup`; método de pago: `cash` | `mercadopago`; estados de orden listados arriba.
- Zona de delivery: partido de Moreno; bbox y proximity fijos en `app/api/geocode/route.ts` y coordenadas del local en `app/api/calculate-distance/route.ts`.

---

## 11. Flujos principales

1. **Usuario:** Home → agrega productos (y extras) al carrito → Checkout → completa datos (nombre, teléfono, dirección con autocompletado, entre calles/notas, distancia por GPS o manual, método de pago) → En efectivo: POST cash + mensaje WhatsApp; con MP: redirección a MP → success/failure/pending + link WhatsApp.
2. **Admin:** Login → Ver órdenes por estado, cambiar estados, cancelar, eliminar, abrir WhatsApp por orden; Promociones: editar precios y restricciones de promo por producto.
3. **Sistema:** Webhook MP actualiza estado de orden; Realtime actualiza la vista de órdenes en admin.

Usar este documento como referencia única para entender la app y tomar decisiones coherentes con el resto del código (GPS, autocompletado, promos, pagos, admin).
