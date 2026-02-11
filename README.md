# 🍔 Hamburguesería Premium - Delivery App

Aplicación web moderna de delivery para hamburguesería con dashboard de cocina en tiempo real.

## 🚀 Stack Tecnológico

- **Framework**: Next.js 15 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS + Shadcn/UI
- **Iconos**: Lucide React
- **Estado Global**: Zustand (con persistencia)
- **Base de Datos**: Supabase (PostgreSQL + Realtime)
- **Pagos**: Mercado Pago
- **Diseño**: Dark Mode con colores Negro, Naranja y Blanco

## 📋 Requisitos Previos

- Node.js 18.x o superior
- Cuenta de Supabase (https://supabase.com)
- Cuenta de Mercado Pago (https://www.mercadopago.com.ar/developers)

## 🛠️ Instalación

### 1. Clonar o inicializar el proyecto

```bash
cd hamburgueseria
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Supabase

1. Crear un nuevo proyecto en [Supabase](https://supabase.com)
2. En el SQL Editor de Supabase, ejecutar el archivo `supabase-schema.sql`
3. Habilitar Realtime para la tabla `orders`:
   - Ir a Database > Replication
   - Activar la tabla `orders`

### 4. Configurar Mercado Pago

1. Crear una cuenta de desarrollador en [Mercado Pago Developers](https://www.mercadopago.com.ar/developers)
2. Obtener las credenciales de prueba (Access Token y Public Key)
3. Para producción, obtener las credenciales de producción

### 5. Variables de Entorno

Crear un archivo `.env.local` en la raíz del proyecto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui

# Mercado Pago
NEXT_PUBLIC_MP_PUBLIC_KEY=tu-public-key-de-mercado-pago
MP_ACCESS_TOKEN=tu-access-token-de-mercado-pago

# URL de la aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Cómo obtener las credenciales:**

#### Supabase:
1. En tu proyecto de Supabase, ir a Settings > API
2. Copiar `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
3. Copiar `anon/public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Mercado Pago:
1. Ir a [Tus credenciales](https://www.mercadopago.com.ar/developers/panel/credentials)
2. Seleccionar "Credenciales de prueba" o "Credenciales de producción"
3. Copiar `Public Key` → `NEXT_PUBLIC_MP_PUBLIC_KEY`
4. Copiar `Access Token` → `MP_ACCESS_TOKEN`

### 6. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📱 Estructura del Proyecto

```
hamburgueseria/
├── app/                          # Next.js App Router
│   ├── admin/                    # Dashboard de cocina
│   ├── api/                      # API Routes
│   │   ├── checkout/             # Crear preferencia de MP
│   │   └── webhooks/             # Webhooks de MP
│   ├── checkout/                 # Página de checkout
│   ├── success/                  # Pago exitoso
│   ├── failure/                  # Pago fallido
│   ├── pending/                  # Pago pendiente
│   ├── layout.tsx                # Layout principal
│   ├── page.tsx                  # Home page
│   └── globals.css               # Estilos globales
├── components/                   # Componentes React
│   ├── ui/                       # Componentes de Shadcn/UI
│   ├── product-card.tsx          # Tarjeta de producto
│   └── floating-cart.tsx         # Carrito flotante
├── lib/                          # Utilidades y configuración
│   ├── store/                    # Zustand stores
│   │   └── cart.ts               # Estado del carrito
│   ├── supabase.ts               # Cliente de Supabase
│   └── utils.ts                  # Funciones auxiliares
└── supabase-schema.sql           # Schema de la base de datos
```

## 🎯 Funcionalidades

### Cliente (Frontend público)

- ✅ **Hero Section**: Imagen impactante con CTA
- ✅ **Catálogo de productos**: Grid responsive con categorías
- ✅ **Carrito de compras**: Flotante, con contador y persistencia
- ✅ **Checkout**: Formulario simple con validación
- ✅ **Integración Mercado Pago**: Pago seguro y redireccionamiento
- ✅ **Páginas de confirmación**: Success, Failure, Pending

### Admin (Dashboard de cocina)

- ✅ **Tiempo real**: Actualización automática con Supabase Realtime
- ✅ **Notificaciones sonoras**: Alerta cuando llega una orden nueva
- ✅ **Kanban de estados**: Paid → Preparing → Ready → Delivered
- ✅ **Información completa**: Detalles del cliente, productos, notas
- ✅ **Actualización de estado**: Botones rápidos para cambiar estados

## 🔄 Flujo de una Orden

1. **Cliente**: Agrega productos al carrito
2. **Cliente**: Completa el formulario de checkout
3. **Sistema**: Crea la orden en Supabase (status: `pending`)
4. **Sistema**: Crea preferencia en Mercado Pago
5. **Cliente**: Redirige a Mercado Pago para pagar
6. **Mercado Pago**: Procesa el pago
7. **Webhook**: Actualiza el estado a `paid`
8. **Dashboard**: Recibe la orden en tiempo real con sonido
9. **Cocina**: Cambia estado a `preparing`
10. **Cocina**: Cambia estado a `ready`
11. **Delivery**: Cambia estado a `delivered`

## 🔐 Configurar Webhook de Mercado Pago

Para que funcione el webhook en **producción**, debes:

1. Desplegar la aplicación (Vercel, Railway, etc.)
2. Configurar la URL del webhook en Mercado Pago:
   - Ir a [Tus integraciones](https://www.mercadopago.com.ar/developers/panel/app)
   - Seleccionar tu aplicación
   - En "Webhooks", agregar: `https://tu-dominio.com/api/webhooks/mercadopago`

En **desarrollo local**, puedes usar [ngrok](https://ngrok.com):

```bash
ngrok http 3000
```

Luego configurar el webhook con la URL de ngrok.

## 🎨 Personalización

### Colores

Los colores principales están definidos en `app/globals.css`:

- **Background**: `#09090b` (zinc-950)
- **Primary (Naranja)**: `#f97316` (orange-600)
- **Texto**: Blanco y grises

### Productos de ejemplo

Los productos de ejemplo se cargan desde el script SQL. Para agregar más:

```sql
INSERT INTO public.products (name, description, price, image_url, category) VALUES
  ('Nueva Burger', 'Descripción', 14.99, 'https://...', 'burger');
```

## 🚀 Despliegue en Producción

### Vercel (Recomendado)

1. Push del código a GitHub
2. Importar proyecto en [Vercel](https://vercel.com)
3. Configurar las variables de entorno
4. Desplegar

### Variables de entorno en producción

Asegúrate de configurar:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_MP_PUBLIC_KEY`
- `MP_ACCESS_TOKEN`
- `NEXT_PUBLIC_APP_URL` (URL de tu dominio)

## 📞 Soporte

Para reportar problemas o solicitar nuevas funcionalidades, crear un issue en el repositorio.

## 📄 Licencia

Este proyecto es de uso libre para fines educativos y comerciales.

---

**Desarrollado con ❤️ usando Next.js 15 y las mejores prácticas de desarrollo web moderno.**
