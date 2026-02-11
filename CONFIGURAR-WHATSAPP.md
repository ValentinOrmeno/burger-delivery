# ⚙️ Configurar Número de WhatsApp para Pedidos en Efectivo

## 📍 Ubicación del código

El número de WhatsApp está configurado en:
```
app/checkout/page.tsx
Línea ~60 (aproximadamente)
```

## 🔧 Cómo cambiarlo

1. Abrí el archivo `app/checkout/page.tsx`

2. Buscá esta línea (aprox. línea 60):
```typescript
const whatsappNumber = "5491112345678"; // TODO: Reemplazar con tu número
```

3. Reemplazá `5491112345678` con tu número de WhatsApp en formato internacional:

### ✅ Formato correcto:
- **Argentina**: `549` + código de área SIN 0 + número SIN 15
  - Ejemplo: `5491145678901` (Buenos Aires)
  - Ejemplo: `5493514567890` (Córdoba)
  
- **Otros países**: 
  - México: `52` + código de área + número
  - Chile: `56` + código de área + número
  - España: `34` + número

### ❌ Errores comunes:
- ❌ Incluir el `+` → Usar solo números
- ❌ Incluir espacios o guiones → `54 9 11 1234-5678`
- ❌ Incluir el `0` del código de área → `54 0 11`
- ❌ Incluir el `15` → `54 9 15 11`

### ✅ Ejemplo final:
```typescript
const whatsappNumber = "5491145678901"; // Tu número real de WhatsApp Business
```

4. Guardá el archivo y reiniciá el servidor:
```bash
npm run dev
```

## 🧪 Cómo probar

1. Agregá productos al carrito
2. Andá al checkout
3. Completá el formulario
4. Seleccioná "Efectivo" como método de pago
5. Hacé clic en "Enviar pedido por WhatsApp"
6. Verificá que te redirija a WhatsApp con el mensaje del pedido

## 📱 Configuración recomendada

**WhatsApp Business** es ideal para esto porque permite:
- Mensajes automáticos de bienvenida
- Etiquetas para organizar pedidos
- Respuestas rápidas predefinidas
- Catálogo de productos

Descargalo en: https://www.whatsapp.com/business

## 💡 Tip adicional

Podés crear un archivo `.env.local` con:
```env
NEXT_PUBLIC_WHATSAPP_NUMBER=5491145678901
```

Y luego usar en el código:
```typescript
const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5491112345678";
```

Esto te permite cambiar el número sin tocar el código.
