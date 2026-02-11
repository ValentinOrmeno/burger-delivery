# Dashboard - Confirmacion de Pagos en Efectivo

## Nueva Funcionalidad Implementada

Se agrego la capacidad de confirmar pagos en efectivo/transferencia directamente desde el dashboard de cocina.

---

## Como Funciona

### 1. Pedidos en Efectivo/Transferencia

Cuando un cliente hace un pedido con metodo de pago "Efectivo/Transferencia":

1. El pedido se crea con **status: `pending`**
2. Se envia automaticamente por WhatsApp al negocio
3. Aparece en el dashboard con indicadores visuales especiales

---

### 2. Indicadores Visuales en el Dashboard

Los pedidos pendientes de pago se identifican facilmente:

#### Badge Amarillo Pulsante
```
⏳ Pendiente de pago
```
- Color: Amarillo
- Efecto: Pulsante (animate-pulse)
- Ubicacion: Junto al numero de orden

#### Alerta de Atencion
Un mensaje amarillo debajo de la informacion del cliente:
```
ATENCION - Pago pendiente
Esperando confirmacion de pago en efectivo o transferencia.
Una vez recibido el pago, confirma haciendo click en el boton verde.
```

#### Contador en Header
El header muestra cuantos pedidos estan pendientes:
```
Dashboard Cocina
3 ordenes activas (2 pendientes de pago)
```

---

### 3. Confirmar el Pago

Una vez que el cliente paga (efectivo en mano o comprobante de transferencia):

1. En el dashboard, busca la orden pendiente
2. Haz click en el boton verde **"💰 Confirmar pago recibido"**
3. El pedido cambia automaticamente a status `paid`
4. El badge cambia a verde: "Efectivo/Transferencia"
5. Ahora aparece el boton "Empezar a cocinar"

---

## Estados de los Pedidos

### Flujo Completo

```
EFECTIVO/TRANSFERENCIA:
pending → paid → preparing → ready → delivered
   ↓        ↓         ↓         ↓        ↓
Confirmar Empezar  Marcar   Marcar
 pago     cocinar   listo   entregado

MERCADO PAGO:
paid → preparing → ready → delivered
  ↓         ↓         ↓        ↓
Empezar Marcar   Marcar
cocinar  listo   entregado
```

---

## Estadisticas Actualizadas

El dashboard ahora muestra **4 contadores** en lugar de 3:

1. **Pendiente** (amarillo) - Esperando confirmacion de pago
2. **Pagado** (verde) - Listo para cocinar
3. **Preparando** (azul) - En cocina
4. **Listo** (morado) - Para entregar

---

## Informacion Adicional en Ordenes

Ahora tambien se muestra:

- **Entre calles**: Referencia de ubicacion del cliente
  ```
  Direccion: Calle Principal 123
  Entre: Av. Libertador y Calle 45
  ```

---

## Ejemplo de Uso

### Escenario 1: Pedido por WhatsApp (Efectivo)

1. Cliente hace pedido en la web, elige "Efectivo/Transferencia"
2. Te llega WhatsApp con el detalle completo
3. En el dashboard aparece con badge amarillo pulsante "⏳ Pendiente de pago"
4. Cliente viene al local y paga en efectivo
5. Confirmas el pago haciendo click en "💰 Confirmar pago recibido"
6. El pedido pasa a "Pagado" y podes empezar a cocinar

### Escenario 2: Pedido con Mercado Pago

1. Cliente paga online con Mercado Pago
2. El pedido llega directamente como "Pagado" (badge azul)
3. No necesitas confirmar nada, solo empezar a cocinar

---

## Ventajas

✅ Control total sobre pagos en efectivo/transferencia
✅ No empiezas a cocinar hasta confirmar el pago
✅ Alertas visuales claras para pedidos pendientes
✅ Flujo diferenciado entre efectivo y Mercado Pago
✅ Seguimiento preciso del estado de cada orden

---

## Deploy

Los cambios ya estan en:
- **GitHub**: https://github.com/ValentinOrmeno/burger-delivery
- **Vercel**: Se actualizara automaticamente en 1-2 minutos

**No se requiere actualizacion de base de datos** para esta funcionalidad.

---

## Notas

- Los pedidos de Mercado Pago siempre llegan como "paid" (ya pagados)
- Los pedidos en efectivo siempre llegan como "pending" (pendientes)
- El boton de confirmacion solo aparece en pedidos pendientes en efectivo
- Una vez confirmado el pago, no se puede revertir a "pending"
