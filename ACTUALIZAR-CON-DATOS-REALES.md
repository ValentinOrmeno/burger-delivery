# 🔄 ACTUALIZAR CON DATOS REALES DEL NEGOCIO

## 📋 QUÉ SE ACTUALIZÓ

He actualizado TODO el proyecto con los datos reales del menú que me compartiste:

### ✅ Cambios Aplicados

1. **Nuevo script SQL**: `supabase-schema-REAL.sql`
   - 35+ productos reales del menú
   - Categorías correctas (burger, veggie, bondiolita, pancho, sides, dessert)
   - Precios reales en pesos argentinos
   - Sistema de tamaños (Simple/Doble/Triple/Cuádruple)

2. **Formateo de precios**:
   - Ahora muestra: `$13.500` (pesos argentinos sin decimales)
   - Antes mostraba: `$13.50` (dólares)

3. **Categorías actualizadas**:
   - ✅ Hamburguesas
   - ✅ Opciones Veggie
   - ✅ Bondiolitas
   - ✅ Panchos Alemanes
   - ✅ Acompañamientos
   - ✅ Postres

4. **Productos reales**:
   - Fresh, Stacker, Bomba de Libra, American B, Crispy, Criolla, etc.
   - Tapa Arterias, Normandia, Almirante, Amaro, Blue Bacon
   - 5 opciones veggie (Arroz Yamaní, Lentejas, Remolacha, Calabaza, NotCo)
   - 3 bondiolitas
   - 4 tipos de panchos
   - Nuggets, chicken fingers, aros, papas
   - Chocotorta

---

## 🚀 CÓMO ACTUALIZAR LA BASE DE DATOS

### Opción 1: Borrar y Reemplazar (Recomendado)

**Paso 1**: Ir a Supabase SQL Editor

**Paso 2**: Borrar los productos de ejemplo

```sql
-- Borrar productos de ejemplo
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM products;
```

**Paso 3**: Ejecutar el nuevo script

- Abre el archivo: `supabase-schema-REAL.sql`
- Copia **TODO** el contenido
- Pégalo en SQL Editor
- Haz clic en **"Run"**

✅ Listo! Ahora tienes los 35+ productos reales.

---

### Opción 2: Solo Agregar Productos (Sin borrar)

Si ya tienes órdenes de prueba y no quieres perderlas:

**Paso 1**: Ir a Supabase SQL Editor

**Paso 2**: Copiar solo la sección de productos del archivo `supabase-schema-REAL.sql`

Busca desde:
```sql
-- ============================================
-- PRODUCTOS REALES - HAMBURGUESAS ESPECIALES
-- ============================================
```

Hasta el final de los productos (antes de "CONFIGURACIÓN REALTIME").

**Paso 3**: Pegar y ejecutar en SQL Editor

✅ Esto agregará los productos reales sin borrar las órdenes existentes.

---

## 🎯 VERIFICAR QUE FUNCIONÓ

### En Supabase

1. Ve a **Table Editor** > **products**
2. Deberías ver productos como:
   - Fresh ($13.500)
   - Tapa Arterias ($16.200)
   - Veggie Arroz Yamaní ($13.000)
   - Bondiolita Sweet Cheese ($16.000)
   - Pancho Tradicional ($4.700)

### En la Aplicación

1. Ejecuta: `npm run dev`
2. Abre: http://localhost:3000
3. Deberías ver:
   - Secciones: Hamburguesas, Opciones Veggie, Bondiolitas, etc.
   - Precios en formato: `$13.500`
   - Descripciones reales: "Cheddar, lechuga, tomate..."

---

## 📊 DATOS DEL NEGOCIO

Para ver todos los detalles del menú real, abre:

```
DATOS-REALES-NEGOCIO.md
```

Ahí encontrarás:
- ✅ Menú completo con precios
- ✅ Todas las categorías
- ✅ Ingredientes de cada producto
- ✅ Tarifas de delivery
- ✅ Estadísticas del negocio

---

## 🎨 PERSONALIZACIÓN ADICIONAL (Opcional)

### Cambiar Imágenes de Productos

Las imágenes actuales son de Unsplash (genéricas). Para usar fotos reales:

1. **Sube las fotos** del negocio a Supabase Storage o un CDN
2. **Actualiza las URLs** en la base de datos:

```sql
-- Ejemplo: Actualizar imagen de "Fresh"
UPDATE products 
SET image_url = 'https://tu-storage.com/fresh.jpg'
WHERE name = 'Fresh';
```

### Cambiar Colores (de Naranja a Amarillo/Dorado)

Edita `app/globals.css` y cambia:

```css
/* Actual (Naranja) */
--primary: 24 95% 53%; /* #f97316 */

/* Cambiar a (Amarillo/Dorado) */
--primary: 45 93% 58%; /* #f59e0b - Amarillo dorado */
```

---

## 🔍 COMPARACIÓN: ANTES vs AHORA

### ANTES (Datos de Ejemplo)
- ❌ Classic Burger, Bacon Deluxe (genéricos)
- ❌ Categorías: burgers, fries, drinks
- ❌ Precios en dólares: $12.99
- ❌ 10 productos de ejemplo

### AHORA (Datos Reales)
- ✅ Fresh, Tapa Arterias, Almirante (del menú real)
- ✅ Categorías: burger, veggie, bondiolita, pancho, sides
- ✅ Precios en pesos: $13.500
- ✅ 35+ productos reales del negocio

---

## 🚀 SIGUIENTE PASO

Una vez que actualices la base de datos:

1. **Ejecuta la app**: `npm run dev`
2. **Verifica que todo se vea bien**
3. **Prueba el carrito** con productos reales
4. **Muéstrale al cliente** el demo con SU menú

---

## 💡 CONSEJOS PARA LA DEMO

### Destacar al Cliente:

1. **"Ya cargué todo tu menú"**
   - Muestra la pantalla con sus productos
   - Resalta que son sus precios reales

2. **"Sistema de tamaños incluido"**
   - Explica que puede vender Simple/Doble/Triple
   - Sin complicaciones técnicas

3. **"Fácil de actualizar"**
   - Puedes cambiar precios en segundos
   - Agregar nuevos productos es simple

4. **"Delivery calculado automáticamente"**
   - Según la distancia del cliente
   - Basado en tu tabla de precios

### Próximas Funcionalidades a Vender:

- 📊 Panel de estadísticas de ventas
- 🎟️ Sistema de cupones de descuento
- 📱 Integración con WhatsApp Business
- 📍 Tracking de pedido en tiempo real
- ⭐ Sistema de reviews de clientes

---

## 📞 RESUMEN EJECUTIVO

```
✅ Proyecto actualizado con datos REALES
✅ 35+ productos del menú actual
✅ Precios en pesos argentinos
✅ Categorías correctas
✅ Listo para demo al cliente

📋 TODO:
1. Ejecutar nuevo SQL en Supabase
2. Verificar en la app (npm run dev)
3. Configurar Mercado Pago
4. Hacer demo al cliente
```

---

**¡El proyecto está listo con los datos reales del negocio! Solo falta ejecutar el SQL y probar.** 🎉
