# 📦 Implementación de Sistema de Delivery y Métodos de Pago

## ✅ Cambios Implementados

### 1. **Métodos de Pago Duales**
- ✅ **Mercado Pago**: Pago con tarjeta (crédito/débito)
- ✅ **Efectivo/Transferencia**: Coordinación vía WhatsApp

### 2. **Sistema de Delivery por Distancia**
Tarifas basadas en distancia del local:
- Hasta 950 m: $600
- De 1 km a 1,4 km: $1.400
- De 1,5 km a 2,4 km: $1.700
- De 2,5 km a 3,4 km: $2.000
- De 3,5 km a 4 km: $2.300

### 3. **Números de Orden Secuenciales**
- ❌ Ya no: `#a3f8b...` (UUID)
- ✅ Ahora: `#1`, `#2`, `#3`, etc.

### 4. **Dashboard Admin Mejorado**
- ✅ Muestra método de pago (💵 Efectivo/Transferencia o 💳 Mercado Pago)
- ✅ Muestra costo de delivery desglosado
- ✅ Números de orden simples
- ✅ Toggle para ver pedidos entregados

---

## 🔧 Pasos de Configuración

### **Paso 1: Ejecutar Script SQL en Supabase**

1. Abrí tu proyecto en Supabase
2. Andá a **SQL Editor**
3. Pegá y ejecutá este script completo:

```sql
-- Agregar columnas nuevas a la tabla orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_number INTEGER;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_distance TEXT;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_cost NUMERIC DEFAULT 0;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'mercadopago';

-- Generar números de orden para las órdenes existentes
DO $$
DECLARE
  order_record RECORD;
  counter INTEGER := 1;
BEGIN
  FOR order_record IN 
    SELECT id FROM public.orders 
    ORDER BY created_at ASC
  LOOP
    UPDATE public.orders 
    SET order_number = counter 
    WHERE id = order_record.id;
    counter := counter + 1;
  END LOOP;
END $$;

-- Hacer order_number NOT NULL y único
ALTER TABLE public.orders 
ALTER COLUMN order_number SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_key 
ON public.orders(order_number);
```

4. Verificá que funcione:
```sql
SELECT order_number, customer_name, total_amount, delivery_cost, payment_method, status
FROM public.orders 
ORDER BY created_at DESC 
LIMIT 10;
```

### **Paso 2: Configurar Número de WhatsApp**

1. Abrí `app/checkout/page.tsx`
2. Buscá la línea ~60:
```typescript
const whatsappNumber = "5491112345678"; // TODO: Reemplazar
```
3. Reemplazá con tu número en formato internacional:
   - **Argentina**: `549` + código de área SIN 0 + número SIN 15
   - Ejemplo: `5491145678901`

### **Paso 3: Reiniciar el Servidor**

```bash
npm run dev
```

---

## 🧪 Cómo Probar

### **Flujo 1: Pago en Efectivo/Transferencia**

1. Agregá productos al carrito
2. Andá al checkout
3. Completá el formulario:
   - Nombre, teléfono, dirección
   - **Seleccioná distancia de delivery** (obligatorio)
   - Seleccioná **💵 Efectivo/Transferencia**
4. Hacé clic en "Enviar pedido por WhatsApp"
5. ✅ Te redirige a WhatsApp con mensaje pre-armado:
   - Número de orden simple (#1, #2, etc.)
   - Detalle del pedido con extras
   - Costo de delivery
   - Total a pagar

### **Flujo 2: Pago con Mercado Pago**

1. Seguí los mismos pasos 1-3
2. Seleccioná **💳 Mercado Pago**
3. Hacé clic en "Pagar con Mercado Pago"
4. ✅ Modo DEMO: Pago automático (si no configuraste MP)
5. ✅ Modo REAL: Redirección a Mercado Pago (si está configurado)

---

## 📊 Dashboard Admin

### **Cómo Ver Pedidos**

1. Andá a `/admin`
2. Verás las órdenes con:
   - **Número simple**: #1, #2, #3
   - **Badge de método de pago**:
     - 💵 Efectivo/Transferencia
     - 💳 Mercado Pago
   - **Desglose de costos**:
     - Subtotal productos
     - 🚚 Delivery (con distancia)
     - Total a cobrar

### **Toggle de Pedidos Entregados**

- **Por defecto**: Muestra solo órdenes activas (pending, paid, preparing, ready)
- **Clic en "Ver entregadas"**: Muestra también las entregadas
- **Clic en "Ocultar entregadas"**: Vuelve al modo normal

---

## 📱 Mensaje de WhatsApp (Ejemplo)

```
🍔 *NUEVO PEDIDO - EFECTIVO/TRANSFERENCIA*

📋 *Pedido #5*

👤 *Cliente:* Juan Pérez
📞 *Teléfono:* +54 9 11 1234-5678
📍 *Dirección:* Av. Corrientes 1234, CABA
🚚 *Distancia:* De 1 km a 1,4 km

*DETALLE DEL PEDIDO:*

1. *American B* x1
   Extras: Doble, Bacon Extra
   Subtotal: $19.700

2. *Papas Fritas Premium* x1
   Subtotal: $4.500

📝 *Notas:* Sin cebolla en la burger

💵 Subtotal productos: $24.200
🚚 Costo delivery: $1.400
━━━━━━━━━━━━━━━━━━
💰 *TOTAL A PAGAR: $25.600*
💳 *Método: Efectivo o Transferencia*

✅ Pedido confirmado. Te contactaremos pronto!
```

---

## 🎯 Archivos Modificados

1. **`app/checkout/page.tsx`**
   - Selector de distancia de delivery
   - Selector de método de pago
   - Lógica para WhatsApp
   - Cálculo de total con delivery

2. **`app/api/checkout/route.ts`**
   - Generación de order_number secuencial
   - Guardado de delivery_distance y delivery_cost
   - Guardado de payment_method

3. **`app/api/checkout/cash/route.ts`** (NUEVO)
   - Endpoint para pedidos en efectivo
   - Generación de order_number
   - Status "pending"

4. **`app/admin/page.tsx`**
   - Muestra order_number simple
   - Badge de método de pago
   - Desglose de delivery cost
   - Toggle para ver entregadas (ya existía)

5. **`lib/supabase.ts`**
   - Tipos actualizados con nuevos campos

---

## ⚙️ Variables de Entorno

Asegurate de tener en `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key

# Mercado Pago (opcional)
NEXT_PUBLIC_MP_PUBLIC_KEY=TEST-tu-public-key
MP_ACCESS_TOKEN=TEST-tu-access-token

# URL de la app
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🚀 Todo Listo!

Ahora tenés:
- ✅ Dos métodos de pago funcionando
- ✅ Sistema de delivery con tarifas por distancia
- ✅ Números de orden simples
- ✅ Dashboard completo con toda la info
- ✅ WhatsApp automático para pedidos en efectivo

**¿Dudas o errores?** Revisá la consola del navegador y los logs del servidor.
