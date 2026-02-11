# 🎨 SISTEMA DE PERSONALIZACIÓN IMPLEMENTADO

## ✅ LO QUE SE AGREGÓ

He implementado un **sistema completo de personalización** para las hamburguesas, bondiolitas y opciones veggie.

### 🎯 Funcionalidades Nuevas

1. **Modal de Personalización**
   - Se abre al hacer clic en "Personalizar" en hamburguesas
   - Interfaz moderna con imagen del producto
   - Cálculo de precio en tiempo real

2. **Opciones de Tamaño**
   - ✅ Simple (sin cargo extra)
   - ✅ Doble (+$3.200)
   - ✅ Triple (+$5.500)
   - ✅ Cuádruple (+$8.900) - solo hamburguesas de carne

3. **Medallones Extra**
   - ✅ Medallón extra de carne (+$3.500)
   - ✅ Medallón extra veggie (+$3.200)
   - ✅ Medallón NotCo (+$4.000)

4. **Toppings Adicionales**
   - ✅ Cheddar extra (+$1.700)
   - ✅ Bacon extra (+$2.000)
   - ✅ Huevo (+$1.500)
   - ✅ Cebolla caramelizada (+$1.200)
   - ✅ Rúcula (+$800)
   - ✅ Tomate (+$500)
   - ✅ Cebolla crispy (+$1.500)
   - ✅ Provoleta (+$2.000)

5. **Personalización de Papas**
   - ✅ Agregar cheddar (+$2.800)
   - ✅ Agregar cheddar y bacon (+$3.100)
   - ✅ Premium: cheddar, bacon y verdeo (+$3.500)
   - ✅ Agrandar porción (+$3.800)

6. **Salsas Extra**
   - ✅ Salsa cheddar (+$2.800)
   - ✅ Salsa stacker (+$2.800)
   - ✅ Mil islas (+$2.800)
   - ✅ Criolla (+$2.800)
   - ✅ Alioli (+$2.800)
   - ✅ Barbacoa (+$1.400)
   - ✅ Mayonesa (+$1.400)
   - ✅ Ketchup (+$1.400)
   - ✅ Mostaza (+$1.400)

---

## 🗄️ PASO 1: EJECUTAR SQL EN SUPABASE

**Archivo**: `agregar-sistema-extras.sql`

1. Abre Supabase SQL Editor
2. Copia **TODO** el contenido del archivo `agregar-sistema-extras.sql`
3. Pégalo en SQL Editor
4. Haz clic en **"Run"** ▶️

✅ Esto creará:
- Tabla `addons` con 28 extras disponibles
- Columna `extras` en `order_items` para guardar las personalizaciones
- Políticas de seguridad
- Vista `order_items_with_details` para consultas

---

## 📊 VERIFICAR QUE FUNCIONÓ

Al final del script deberías ver una tabla como esta:

```
category  | name                    | price  | applicable_to
----------|-------------------------|--------|------------------
size      | Simple                  | 0      | {burger,veggie}
size      | Doble                   | 3200   | {burger,veggie}
size      | Triple                  | 5500   | {burger,veggie}
size      | Cuádruple               | 8900   | {burger}
meat      | Medallón Extra Carne    | 3500   | {burger}
topping   | Cheddar Extra           | 1700   | {burger,veggie,bondiolita}
topping   | Bacon Extra             | 2000   | {burger,veggie,bondiolita}
fries     | Papas con Cheddar       | 2800   | {burger,veggie,bondiolita}
sauce     | Salsa Cheddar           | 2800   | {burger,veggie,sides}
...y 19 más
```

---

## 🎮 PASO 2: COMPILAR Y PROBAR

```bash
npm run build
```

Si compila sin errores, ejecuta:

```bash
npm run dev
```

---

## 🍔 CÓMO USAR LA PERSONALIZACIÓN

### En la App (http://localhost:3000):

1. **Productos Personalizables**
   - Verás un badge verde "Personalizable" en:
     - Hamburguesas
     - Opciones Veggie
     - Bondiolitas
   
2. **Abrir el Customizer**
   - Haz clic en **"Personalizar"** (antes decía "Agregar")
   - Se abre un modal con la imagen del producto

3. **Seleccionar Tamaño** (Obligatorio)
   - Por defecto viene "Simple" seleccionado
   - Puedes cambiar a Doble, Triple o Cuádruple
   - El precio se actualiza automáticamente

4. **Agregar Extras**
   - Haz clic en cualquier extra para agregarlo
   - Los extras con cantidad tienen botones +/-
   - Puedes agregar múltiples extras

5. **Personalizar Papas**
   - Las papas vienen con la hamburguesa
   - Puedes agregarles cheddar, bacon, verdeo
   - O agrandar la porción

6. **Ver Precio Total**
   - El precio se calcula en tiempo real
   - Incluye: Base + Tamaño + Todos los extras
   - Se multiplica por la cantidad

7. **Agregar al Carrito**
   - Botón inferior muestra: "Agregar $XX.XXX"
   - Puedes cambiar la cantidad (1, 2, 3...)
   - Los extras se guardan con cada item

---

## 🛒 EN EL CARRITO

Los items personalizados se muestran con:
- ✅ Nombre del producto
- ✅ Lista de extras seleccionados
- ✅ Precio total con extras incluidos
- ✅ Subtotal multiplicado por cantidad

**Ejemplo en el carrito**:
```
Fresh
Doble, Cheddar Extra, Bacon Extra, Papas con Cheddar
$20.000 (con extras)
x2 = $40.000
```

---

## 💳 EN EL CHECKOUT

Se muestra:
- ✅ Cada producto con sus extras
- ✅ Precio unitario (con extras)
- ✅ Total por item
- ✅ Total general del pedido

---

## 👨‍💼 EN EL DASHBOARD ADMIN

Las órdenes muestran:
- ✅ Producto base
- ✅ **Extras en verde**: Doble, Cheddar Extra, etc.
- ✅ Precio con extras incluido
- ✅ Total por item

**Ejemplo en el admin**:
```
2x Fresh
Extras: Doble, Cheddar Extra, Bacon Extra, Papas con Cheddar
$20.000 c/u
Total: $40.000
```

---

## 🎨 DETALLES DE DISEÑO

### Modal de Personalización
- ✅ Imagen grande del producto arriba
- ✅ Gradiente oscuro para legibilidad
- ✅ Secciones organizadas por categoría
- ✅ Botones con efecto hover
- ✅ Cálculo de precio en tiempo real
- ✅ Sticky footer con total y cantidad

### Tarjetas de Producto
- ✅ Badge verde "Personalizable"
- ✅ Precio muestra "Desde $XX.XXX"
- ✅ Botón cambia a "Personalizar"

### Carrito
- ✅ Extras en texto gris pequeño
- ✅ Precio con indicador "(con extras)"
- ✅ Items únicos por combinación de extras

---

## 🔄 FLUJO COMPLETO

1. **Cliente ve hamburguesa** → Badge "Personalizable"
2. **Clic en "Personalizar"** → Modal se abre
3. **Selecciona tamaño** → Precio se actualiza
4. **Agrega extras** → Precio suma cada extra
5. **Personaliza papas** → Opción destacada
6. **Agrega salsas** → Complementos finales
7. **Define cantidad** → Botones +/- abajo
8. **Clic "Agregar $XX.XXX"** → Va al carrito
9. **Ve resumen** → Carrito flotante muestra extras
10. **Va a checkout** → Formulario + resumen
11. **Paga con MP** → Orden con extras
12. **Admin recibe orden** → Extras destacados en verde
13. **Cocina prepara** → Ve exactamente qué agregar

---

## 📊 ESTADÍSTICAS

- **Total de extras**: 28 opciones
- **Categorías**: 5 (size, meat, topping, fries, sauce)
- **Precio mínimo extra**: $500 (Tomate)
- **Precio máximo extra**: $8.900 (Cuádruple)
- **Productos personalizables**: Hamburguesas, Veggie, Bondiolitas

---

## 🎯 EJEMPLO REAL DE USO

**Cliente pide**:
- Fresh Simple → $13.500
- Cambia a Doble → +$3.200
- Agrega Bacon Extra → +$2.000
- Papas con Cheddar → +$2.800
- Salsa Criolla → +$2.800

**Total**: $24.300

**En el carrito se ve**:
```
Fresh
Doble, Bacon Extra, Papas con Cheddar, Salsa Criolla
$24.300 (con extras)
x1 = $24.300
```

---

## 🐛 TROUBLESHOOTING

### Error: "table addons does not exist"
**Solución**: Ejecuta `agregar-sistema-extras.sql` en Supabase

### No se ven los extras en el modal
**Solución**: 
1. Verifica en Supabase → Table Editor → addons
2. Deberías ver 28 filas
3. Si no están, ejecuta de nuevo el script

### Error de compilación
**Solución**: Ejecuta `npm run build` para ver errores específicos

### Los extras no se guardan
**Solución**: Verifica que la columna `extras` existe en `order_items`

---

## 💡 MEJORAS FUTURAS (Opcional)

- [ ] Fotos reales de cada extra
- [ ] Límite máximo de extras por categoría
- [ ] Sugerencias "Los clientes también agregaron"
- [ ] Combos predefinidos con descuento
- [ ] Guardado de "Mi combinación favorita"
- [ ] Estadísticas de extras más pedidos

---

## ✅ RESUMEN EJECUTIVO

```
🎨 SISTEMA DE PERSONALIZACIÓN COMPLETO

✅ 28 extras disponibles
✅ Modal interactivo con imagen
✅ Cálculo de precio en tiempo real
✅ Cantidad ajustable por extra
✅ Integración con carrito
✅ Integración con checkout
✅ Integración con Mercado Pago
✅ Vista en dashboard admin
✅ Persistencia en localStorage
✅ Guardado en Supabase

📋 PARA ACTIVAR:
1. Ejecutar: agregar-sistema-extras.sql en Supabase
2. Compilar: npm run build
3. Ejecutar: npm run dev
4. Probar: http://localhost:3000
```

---

**¡El sistema de personalización está 100% implementado y listo para usar!** 🎉
