# 🚀 Guía de Configuración Paso a Paso

Esta guía te llevará desde cero hasta tener la aplicación funcionando completamente.

## ✅ Checklist de Configuración

- [ ] Cuenta de Supabase creada
- [ ] Base de datos configurada
- [ ] Cuenta de Mercado Pago creada
- [ ] Credenciales obtenidas
- [ ] Variables de entorno configuradas
- [ ] Aplicación ejecutándose

---

## 1️⃣ Configurar Supabase

### Paso 1: Crear cuenta y proyecto

1. Ve a [https://supabase.com](https://supabase.com)
2. Haz clic en "Start your project"
3. Inicia sesión con GitHub (recomendado)
4. Clic en "New Project"
5. Configura:
   - **Organization**: Crea una nueva o selecciona una existente
   - **Name**: `hamburgueseria-premium` (o el nombre que prefieras)
   - **Database Password**: Genera una contraseña segura (guárdala!)
   - **Region**: Selecciona la más cercana a tu ubicación
6. Clic en "Create new project" (tarda ~2 minutos)

### Paso 2: Ejecutar el Schema SQL

1. En tu proyecto de Supabase, ve al menú lateral izquierdo
2. Clic en **SQL Editor**
3. Clic en **"New query"**
4. Copia **TODO** el contenido del archivo `supabase-schema.sql`
5. Pégalo en el editor
6. Clic en **"Run"** (abajo a la derecha)
7. Deberías ver: ✅ "Success. No rows returned"

### Paso 3: Habilitar Realtime

1. Ve a **Database** → **Replication**
2. Busca la tabla `orders` en la lista
3. Activa el switch para habilitar Realtime
4. Guarda los cambios

### Paso 4: Obtener las credenciales

1. Ve a **Settings** → **API** (en el menú lateral)
2. En la sección "Project API keys":
   - Copia **Project URL** → Esta es tu `NEXT_PUBLIC_SUPABASE_URL`
   - Copia **anon/public** key → Esta es tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **NO compartas** estas credenciales públicamente

---

## 2️⃣ Configurar Mercado Pago

### Paso 1: Crear cuenta de desarrollador

1. Ve a [https://www.mercadopago.com.ar/developers](https://www.mercadopago.com.ar/developers)
2. Inicia sesión con tu cuenta de Mercado Pago (o créala)
3. Acepta los términos y condiciones de desarrollador

### Paso 2: Crear una aplicación

1. Ve a **"Tus aplicaciones"** → **"Crear aplicación"**
2. Configura:
   - **Nombre**: "Hamburguesería Premium"
   - **Modelo de integración**: "Pagos online"
   - **Productos**: "Checkout Pro"
3. Clic en "Crear aplicación"

### Paso 3: Obtener credenciales de prueba

1. En tu aplicación, ve a **"Credenciales"**
2. Selecciona **"Credenciales de prueba"** (para desarrollo)
3. Copia:
   - **Public Key** → Esta es tu `NEXT_PUBLIC_MP_PUBLIC_KEY`
   - **Access Token** → Esta es tu `MP_ACCESS_TOKEN`

### Paso 4: Usuarios de prueba (opcional pero recomendado)

Para probar pagos sin dinero real:

1. Ve a **"Prueba tu integración"** → **"Usuarios de prueba"**
2. Crea dos usuarios:
   - **Vendedor**: El que recibe el pago
   - **Comprador**: El que realiza el pago
3. Usa las credenciales del **vendedor** en tu aplicación
4. Usa las credenciales del **comprador** para pagar en Mercado Pago

**Tarjetas de prueba** para usar:
- **VISA aprobada**: `4509 9535 6623 3704`
- **Mastercard rechazada**: `5031 7557 3453 0604`
- CVV: cualquier 3 dígitos
- Fecha de vencimiento: cualquier fecha futura

---

## 3️⃣ Configurar Variables de Entorno

1. Abre el archivo `.env.local` en la raíz del proyecto
2. Reemplaza los valores de ejemplo con tus credenciales reales:

```env
# Supabase (copiado del Paso 1)
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Mercado Pago (copiado del Paso 2)
NEXT_PUBLIC_MP_PUBLIC_KEY=TEST-1234567890abcdef-123456-abcd1234efgh5678ijkl9012-123456789
MP_ACCESS_TOKEN=TEST-1234567890123456-123456-abcdef1234567890abcdef1234567890-123456789

# URL de la aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Guarda el archivo**

---

## 4️⃣ Ejecutar la Aplicación

### Opción A: Modo Desarrollo (recomendado para probar)

```bash
npm run dev
```

La aplicación estará en: [http://localhost:3000](http://localhost:3000)

### Opción B: Modo Producción (build y start)

```bash
npm run build
npm start
```

---

## 5️⃣ Verificar que Todo Funcione

### ✅ Frontend (Cliente)

1. Abre [http://localhost:3000](http://localhost:3000)
2. Deberías ver:
   - Hero section con imagen de hamburguesa
   - Grid de productos (10 productos de ejemplo)
   - Botón flotante del carrito (abajo a la derecha)
3. Prueba:
   - Agregar productos al carrito
   - Abrir el carrito flotante
   - Ir a checkout
   - Completar el formulario
   - Hacer clic en "Pagar con Mercado Pago"
   - Serás redirigido a Mercado Pago

### ✅ Pago con Mercado Pago

1. En la pantalla de Mercado Pago, usa una tarjeta de prueba:
   - **Número**: `4509 9535 6623 3704`
   - **Fecha**: Cualquier fecha futura (ej: 12/25)
   - **CVV**: `123`
   - **Nombre**: Tu nombre
   - **Email**: Un email válido
2. Completa el pago
3. Serás redirigido a la página de éxito

### ✅ Dashboard Admin

1. Abre [http://localhost:3000/admin](http://localhost:3000/admin)
2. Deberías ver:
   - Dashboard vacío (si no hay órdenes)
   - O las órdenes activas si ya hiciste un pedido
3. Prueba:
   - Hacer un pedido desde otra ventana/navegador
   - Ver cómo aparece automáticamente en el dashboard
   - Cambiar el estado de la orden
   - Verificar que se actualiza en tiempo real

---

## 🐛 Solución de Problemas Comunes

### Error: "Missing Supabase environment variables"

**Solución**: Verifica que el archivo `.env.local` tenga las variables correctas y reinicia el servidor (`Ctrl+C` y `npm run dev` de nuevo).

### Error: "Error fetching products"

**Solución**: 
1. Verifica que ejecutaste el script SQL completo en Supabase
2. Ve a Supabase → Table Editor → Verifica que exista la tabla `products` con datos
3. Verifica las políticas RLS en Database → Policies

### Los productos no se ven (sin errores)

**Solución**: 
1. Verifica que las URLs de las imágenes de Unsplash estén permitidas en `next.config.js`
2. Reinicia el servidor de desarrollo

### El webhook de Mercado Pago no funciona en local

**Solución**:
- En desarrollo local, el webhook NO funcionará porque Mercado Pago no puede acceder a `localhost`
- Opciones:
  1. Usar [ngrok](https://ngrok.com) para exponer tu localhost
  2. Actualizar manualmente el estado de la orden en Supabase a "paid" para probar el dashboard

### El Realtime no funciona

**Solución**:
1. Verifica que habilitaste Realtime para la tabla `orders` en Supabase
2. Ve a Database → Replication
3. Activa el switch para `orders`
4. Verifica en la consola del navegador si hay errores de WebSocket

---

## 📚 Próximos Pasos

Una vez que todo funcione:

1. **Personaliza los productos**:
   - Edita los productos en Supabase (Table Editor)
   - O inserta nuevos productos con SQL

2. **Agrega autenticación al admin**:
   - Implementa Supabase Auth
   - Protege la ruta `/admin`

3. **Despliega en producción**:
   - Vercel (recomendado para Next.js)
   - Railway, Render, etc.

4. **Configura el webhook en producción**:
   - Una vez desplegado, configura la URL del webhook en Mercado Pago
   - `https://tu-dominio.com/api/webhooks/mercadopago`

---

## 💡 Consejos

- **Usa las credenciales de prueba** durante el desarrollo
- **No expongas las credenciales** en GitHub o públicamente
- **Revisa los logs** de Supabase y Mercado Pago para debugging
- **Prueba el flujo completo** antes de pasar a producción

---

¡Listo! Si seguiste todos los pasos, deberías tener la aplicación funcionando perfectamente. 🎉
