# Integracion WhatsApp para Todos los Pagos

## Cambios Implementados

### 1. Campo "Entre Calles" en el Formulario

Se agrego un campo opcional **"Entre calles"** en el checkout para ayudar al repartidor a encontrar la direccion mas facilmente.

**Ubicacion:** Aparece justo debajo del campo de "Direccion de entrega"

**Ejemplo:** "Entre Av. Santa Fe y Av. Cordoba"

---

### 2. Redireccion a WhatsApp para TODOS los Pedidos

Ahora **todos los pedidos** (tanto efectivo como Mercado Pago) se envian automaticamente a WhatsApp con el detalle completo.

#### Flujo de Efectivo/Transferencia:
1. Usuario completa el formulario
2. Selecciona "Efectivo/Transferencia"
3. Click en "Enviar pedido por WhatsApp"
4. Se crea el pedido en la BD
5. **Redirige automaticamente a WhatsApp** con el mensaje completo

#### Flujo de Mercado Pago:
1. Usuario completa el formulario
2. Selecciona "Mercado Pago"
3. Click en "Pagar con Mercado Pago"
4. Se crea el pedido en la BD
5. Va a Mercado Pago y paga
6. Vuelve a la pagina /success
7. **Redirige automaticamente a WhatsApp** con el mensaje indicando "PAGO YA REALIZADO"

---

### 3. Formato del Mensaje de WhatsApp

El mensaje incluye:

- **Numero de pedido** (secuencial)
- **Datos del cliente** (nombre, telefono)
- **Direccion completa** (incluye "entre calles" si se completo)
- **Distancia de delivery** y costo
- **Detalle completo del pedido** con extras
- **Totales** (subtotal + delivery)
- **Metodo de pago**:
  - 💵 Efectivo/Transferencia (pendiente)
  - 💳 Mercado Pago (PAGADO)

---

## Configuracion Requerida

### PASO 1: Actualizar Base de Datos

Ejecuta este script en **Supabase SQL Editor**:

```sql
-- Agregar columna between_streets a la tabla orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS between_streets TEXT;
```

**Archivo:** `agregar-campo-entre-calles.sql`

---

### PASO 2: Configurar Numero de WhatsApp

Debes reemplazar el numero de WhatsApp en **3 archivos**:

#### 1. `app/checkout/page.tsx` (linea ~313)
```typescript
const whatsappNumber = "5491112345678"; // TODO: Reemplazar con tu numero
```

#### 2. `app/success/page.tsx` (linea ~73)
```typescript
const whatsappNumber = "5491112345678"; // TODO: Reemplazar con tu numero
```

**Formato del numero:**
- Codigo de pais + codigo de area + numero (sin espacios ni guiones)
- Ejemplo Argentina: `549` + `11` + `12345678` = `5491112345678`

---

## Pruebas

### Probar Pedido en Efectivo:
1. Agrega productos al carrito
2. Ve a checkout
3. Completa todos los campos (incluye "entre calles")
4. Selecciona "Efectivo/Transferencia"
5. Click en "Enviar pedido por WhatsApp"
6. Verifica que se abra WhatsApp con el mensaje correcto

### Probar Pedido con Mercado Pago:
1. Agrega productos al carrito
2. Ve a checkout
3. Completa todos los campos (incluye "entre calles")
4. Selecciona "Mercado Pago"
5. Click en "Pagar con Mercado Pago"
6. Completa el pago en MP
7. Al volver a /success, verifica que se abra WhatsApp con "PAGO YA REALIZADO"

---

## Notas Importantes

- El campo "Entre calles" es **opcional**, pero ayuda mucho al delivery
- El mensaje de WhatsApp se genera **automaticamente** con todos los datos
- Para Mercado Pago, el mensaje dice claramente **"PAGO YA REALIZADO"**
- Para Efectivo, dice **"Efectivo/Transferencia"** (pendiente de pago)
- Los datos se guardan temporalmente en `localStorage` para generar el mensaje despues del pago de MP

---

## Deploy en Vercel

Los cambios ya estan en GitHub. Vercel se actualizara automaticamente.

**No olvides:**
1. Ejecutar el SQL en Supabase
2. Cambiar el numero de WhatsApp en ambos archivos
3. Hacer commit y push de esos cambios
