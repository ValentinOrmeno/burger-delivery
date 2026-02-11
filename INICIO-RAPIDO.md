# 🍔 INICIO RÁPIDO - Hamburguesería Premium

## ⚡ 3 Pasos para Empezar

### 📝 PASO 1: Configurar Credenciales (10 min)

#### A. Supabase
1. 🌐 Ir a https://supabase.com
2. ➕ Crear nuevo proyecto
3. 📋 En SQL Editor, pegar TODO el contenido de `supabase-schema.sql`
4. ▶️ Ejecutar (Run)
5. 📡 Database → Replication → Activar tabla `orders`
6. 🔑 Settings → API → Copiar:
   - `Project URL`
   - `anon/public key`

#### B. Mercado Pago (Opcional para empezar)
1. 🌐 Ir a https://www.mercadopago.com.ar/developers
2. ➕ Crear aplicación
3. 🔑 Credenciales → Credenciales de prueba → Copiar:
   - `Public Key`
   - `Access Token`

#### C. Editar `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=pegar-aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=pegar-aqui
NEXT_PUBLIC_MP_PUBLIC_KEY=pegar-aqui
MP_ACCESS_TOKEN=pegar-aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### 🚀 PASO 2: Ejecutar

```bash
npm run dev
```

---

### 🎯 PASO 3: Probar

#### 🛍️ Frontend (Cliente)
**URL**: http://localhost:3000

**Qué verás**:
- 🎨 Hero Section con imagen de hamburguesa
- 🍔 10 productos de ejemplo (burgers, papas, bebidas, postres)
- 🛒 Botón flotante del carrito (abajo a la derecha)

**Qué hacer**:
1. Hacer scroll y ver el catálogo
2. Clic en "Agregar" en cualquier producto
3. Clic en el carrito flotante
4. Ver el detalle, cambiar cantidades
5. Clic en "Ir a Pagar"
6. Completar el formulario
7. Clic en "Pagar con Mercado Pago"

#### 👨‍💼 Dashboard (Admin)
**URL**: http://localhost:3000/admin

**Qué verás**:
- 📊 Dashboard vacío (si no hay órdenes)
- 📈 Stats por estado
- 🔔 Toggle de sonido

**Qué hacer**:
1. Dejar esta pestaña abierta
2. En otra pestaña, hacer un pedido (paso anterior)
3. En el checkout, pagar con tarjeta de prueba:
   - **Número**: 4509 9535 6623 3704
   - **CVV**: 123
   - **Fecha**: 11/25
   - **Nombre**: APRO
4. Volver al dashboard
5. ¡Ver la orden aparecer en tiempo real! 🎉

---

## 📂 Estructura de Archivos

```
📁 hamburgueseria/
│
├── 📄 DOCS (Lee estos primero)
│   ├── PROYECTO-COMPLETADO.md  ← Estado del proyecto
│   ├── QUICKSTART.md           ← Inicio en 5 min
│   ├── SETUP.md                ← Guía completa
│   ├── README.md               ← Documentación general
│   ├── COMANDOS.md             ← Comandos útiles
│   └── INICIO-RAPIDO.md        ← Este archivo
│
├── 🗄️ DATABASE
│   └── supabase-schema.sql     ← Ejecutar en Supabase
│
├── ⚙️ CONFIG
│   ├── .env.local              ← Tus credenciales
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── next.config.js
│
├── 🎨 FRONTEND
│   ├── app/
│   │   ├── page.tsx            ← Home
│   │   ├── checkout/           ← Checkout
│   │   ├── admin/              ← Dashboard
│   │   ├── success/            ← Pago exitoso
│   │   ├── failure/            ← Pago fallido
│   │   └── pending/            ← Pago pendiente
│   │
│   └── components/
│       ├── product-card.tsx
│       ├── floating-cart.tsx
│       └── ui/                 ← Shadcn/UI
│
├── 🔌 API
│   └── app/api/
│       ├── checkout/           ← Crear pago
│       └── webhooks/           ← Recibir notificaciones
│
└── 📚 UTILS
    └── lib/
        ├── supabase.ts         ← Cliente DB
        ├── store/cart.ts       ← Estado del carrito
        └── utils.ts            ← Helpers
```

---

## ✅ Checklist de Verificación

Antes de empezar, verifica que tienes:

- [ ] Node.js 18+ instalado (`node -v`)
- [ ] npm instalado (`npm -v`)
- [ ] Cuenta de Supabase creada
- [ ] Script SQL ejecutado en Supabase
- [ ] Realtime habilitado en tabla `orders`
- [ ] Variables de entorno configuradas en `.env.local`
- [ ] Dependencias instaladas (`npm install` - ya hecho)

---

## 🎨 Preview de la UI

### 🏠 Home Page
```
┌─────────────────────────────────────────┐
│  🍔 BURGERS PREMIUM                     │
│  Las mejores hamburguesas gourmet      │
│  [Ver Menú ↓]                          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  NUESTRO MENÚ                           │
├─────────────────────────────────────────┤
│  Hamburguesas                           │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐              │
│  │ 🍔│ │ 🍔│ │ 🍔│ │ 🍔│              │
│  │ + │ │ + │ │ + │ │ + │              │
│  └───┘ └───┘ └───┘ └───┘              │
└─────────────────────────────────────────┘

                        🛒 [3]  ← Carrito flotante
```

### 🛒 Carrito
```
┌─────────────────────────────┐
│  🛒 Tu Carrito              │
├─────────────────────────────┤
│  🍔 Classic Burger          │
│  $12.99   [−] 2 [+]  🗑️    │
├─────────────────────────────┤
│  🍟 Papas Clásicas          │
│  $4.99    [−] 1 [+]  🗑️    │
├─────────────────────────────┤
│  Total:           $30.97    │
│  [Ir a Pagar]               │
└─────────────────────────────┘
```

### 👨‍💼 Dashboard Admin
```
┌─────────────────────────────────────┐
│  🔔 Dashboard Cocina    [🔕]  [↻]  │
├─────────────────────────────────────┤
│  💰 Pagado  👨‍🍳 Preparando  ✅ Listo│
│     2          1            0       │
├─────────────────────────────────────┤
│  📦 Orden #abc12345                 │
│  Juan Pérez - +54 9 11 1234-5678   │
│  📍 Calle 123, Piso 4               │
│  ────────────────────────────────   │
│  2x Classic Burger    $25.98        │
│  1x Papas Clásicas    $4.99         │
│  ────────────────────────────────   │
│  Total: $30.97                      │
│  [Empezar a cocinar]                │
└─────────────────────────────────────┘
```

---

## 🚨 Problemas Comunes

### ❌ "Missing Supabase environment variables"
**Causa**: `.env.local` no configurado o servidor no reiniciado  
**Solución**: 
1. Editar `.env.local`
2. `Ctrl+C` en la terminal
3. `npm run dev` de nuevo

### ❌ No se ven los productos
**Causa**: Script SQL no ejecutado en Supabase  
**Solución**: 
1. Ir a Supabase → SQL Editor
2. Ejecutar TODO `supabase-schema.sql`

### ❌ El carrito no persiste
**Causa**: LocalStorage está deshabilitado  
**Solución**: Es normal, Zustand guarda en localStorage del navegador

### ❌ Webhook no funciona
**Causa**: Mercado Pago no puede acceder a localhost  
**Solución**: 
- En desarrollo: Usar ngrok (ver COMANDOS.md)
- O actualizar estado manualmente en Supabase:
  ```sql
  UPDATE orders SET status = 'paid' WHERE id = 'order-id';
  ```

---

## 🎓 Siguientes Pasos

Una vez que todo funcione:

1. 📖 **Lee README.md** para entender la arquitectura
2. 🎨 **Personaliza los productos** en Supabase
3. 🎯 **Agrega autenticación** al dashboard admin
4. 🚀 **Despliega en Vercel** para producción
5. 🔗 **Configura el webhook** de Mercado Pago en producción

---

## 💡 Tips

- 🔑 **Usa credenciales de PRUEBA** de Mercado Pago
- 🔄 **Reinicia el servidor** después de cambiar `.env.local`
- 📱 **Prueba en móvil** para ver el diseño responsive
- 🎨 **Dark mode está activado** por defecto
- ⚡ **El dashboard se actualiza solo** con Supabase Realtime

---

## 🆘 Ayuda

Si tienes problemas:

1. 📚 Lee **SETUP.md** para la guía completa
2. 📋 Lee **COMANDOS.md** para troubleshooting
3. 🔍 Revisa los logs en la consola del navegador
4. 📊 Revisa los logs en Supabase (Database → Logs)

---

**¡Listo! Ahora tienes una aplicación de delivery completa y profesional. 🎉**

### 🎯 Tu Objetivo Ahora

1. ✅ Configurar credenciales (10 min)
2. ✅ Ejecutar `npm run dev`
3. ✅ Hacer un pedido de prueba
4. ✅ Ver la orden en el dashboard
5. 🎉 ¡Celebrar!

**¡Adelante! 🚀**
