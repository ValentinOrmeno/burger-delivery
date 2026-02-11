# 🚀 EJECUTAR EN SUPABASE (PASO A PASO)

## 📝 QUÉ HACER AHORA

Tienes que ejecutar **2 scripts cortos** en Supabase SQL Editor.

---

## ⚡ PASO 1: Agregar Categorías Nuevas

**Archivo**: `agregar-categorias.sql`

1. Abre Supabase SQL Editor
2. Copia **TODO** el contenido del archivo `agregar-categorias.sql`
3. Pégalo en SQL Editor
4. Haz clic en **"Run"** ▶️

✅ Esto actualiza las categorías para permitir: veggie, bondiolita, pancho, sides

---

## ⚡ PASO 2: Cargar Productos Reales

**Archivo**: `actualizar-productos-SOLO.sql`

1. En el mismo SQL Editor de Supabase
2. Copia **TODO** el contenido del archivo `actualizar-productos-SOLO.sql`
3. Pégalo en SQL Editor
4. Haz clic en **"Run"** ▶️

✅ Esto:
- Borra los 10 productos de ejemplo
- Carga 35+ productos reales del menú
- Muestra un resumen al final

---

## 📊 VERIFICAR QUE FUNCIONÓ

Al final deberías ver una tabla como esta:

```
category     | total_productos | precio_minimo | precio_maximo
-------------|-----------------|---------------|---------------
bondiolita   | 3               | 16000         | 16000
burger       | 18              | 13000         | 16400
dessert      | 1               | 5000          | 5000
pancho       | 4               | 4700          | 5500
sides        | 6               | 4800          | 14500
veggie       | 5               | 13000         | 14500
```

---

## 🎯 DESPUÉS DE EJECUTAR

Ejecuta la aplicación:

```bash
npm run dev
```

Abre: http://localhost:3000

**Deberías ver**:
- ✅ Fresh ($13.500)
- ✅ Tapa Arterias ($16.200)
- ✅ Veggie Arroz Yamaní ($13.000)
- ✅ Bondiolita Sweet Cheese ($16.000)
- ✅ Pancho Tradicional ($4.700)
- ✅ Y 30 productos más...

---

## 🆘 SI HAY ERROR

### Error: "violates check constraint"

**Solución**: Ejecuta primero el `agregar-categorias.sql`

### Error: No se ven los productos

**Solución**: 
1. Verifica en Supabase → Table Editor → products
2. Deberías ver 35+ productos
3. Si no están, ejecuta de nuevo `actualizar-productos-SOLO.sql`

### Error: "relation does not exist"

**Solución**: Las tablas no existen. Ejecuta el script completo `supabase-schema.sql` primero.

---

## ✅ RESUMEN RÁPIDO

```bash
# En Supabase SQL Editor:

# 1. Ejecutar:
agregar-categorias.sql

# 2. Ejecutar:
actualizar-productos-SOLO.sql

# 3. En tu terminal:
npm run dev

# 4. Abrir:
http://localhost:3000
```

---

**¡Listo! Con estos 2 scripts tendrás todos los productos reales cargados.** 🎉
