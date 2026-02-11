# 🔴 CÓMO HABILITAR REALTIME EN SUPABASE

## 📍 Paso a Paso (2 minutos)

### **Paso 1: Ir a tu proyecto en Supabase**

1. Ve a [https://supabase.com](https://supabase.com)
2. Abre tu proyecto: **wjnnkolvmxjnelrxctmn**

---

### **Paso 2: Navegar a Replication**

En el menú lateral izquierdo:

```
1. Busca y haz clic en: "Database" 🗄️
2. Se abrirá un submenú
3. Haz clic en: "Replication" 📡
```

**Ruta completa**: `Database > Replication`

---

### **Paso 3: Habilitar la tabla "orders"**

Verás una lista de todas tus tablas:

```
┌─────────────────────────────────────────┐
│  Replication                            │
├─────────────────────────────────────────┤
│  Source: supabase_realtime              │
│                                         │
│  Tables:                                │
│  ☐ order_items                          │
│  ☐ orders          ← ACTIVAR ESTE      │
│  ☐ products                             │
└─────────────────────────────────────────┘
```

**Acción**:
1. Busca la fila que dice **"orders"**
2. Activa el **switch/toggle** (casilla) al lado de "orders"
3. Se pondrá en **verde** ✅

---

### **Paso 4: Verificar que está activo**

Deberías ver:

```
✅ orders - Realtime enabled
```

---

## 🎯 Alternativa: Si NO ves "Replication"

Si no encuentras "Replication" en el menú, prueba esto:

### **Opción A: Buscar "Publications"**

```
Database > Publications
```

Y ahí busca `supabase_realtime` y agrega la tabla `orders`.

### **Opción B: Habilitar desde Table Editor**

1. Ve a `Table Editor`
2. Selecciona la tabla `orders`
3. Haz clic en el botón de configuración (⚙️)
4. Busca la opción "Enable Realtime" o "Replication"
5. Actívala

### **Opción C: Ejecutar SQL Manual**

Si nada funciona, ejecuta esto en **SQL Editor**:

```sql
-- Habilitar Realtime para la tabla orders
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
```

---

## ✅ Confirmación

Para verificar que funcionó, ejecuta en **SQL Editor**:

```sql
-- Ver qué tablas tienen Realtime habilitado
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

Deberías ver `orders` en el resultado.

---

## 🚀 Siguiente Paso

Una vez habilitado Realtime:

1. Cierra y vuelve a abrir este documento
2. Ejecuta: `npm run dev`
3. Abre: http://localhost:3000
4. ¡Ya debería funcionar! 🎉

---

## 📸 Referencia Visual

La pantalla se ve así:

```
┌──────────────────────────────────────────────────────┐
│  Database                                            │
│  ├─ Tables                                           │
│  ├─ Triggers                                         │
│  ├─ Functions                                        │
│  ├─ Extensions                                       │
│  ├─ Roles                                            │
│  ├─ Replication          ← CLICK AQUÍ               │
│  ├─ Publications                                     │
│  └─ Webhooks                                         │
└──────────────────────────────────────────────────────┘
```

---

## 🆘 Ayuda

Si tienes problemas:

1. Refresca la página de Supabase (F5)
2. Cierra y vuelve a abrir el proyecto
3. Usa la Opción C (SQL manual) que siempre funciona

---

**Una vez habilitado, avísame y te ayudo con Mercado Pago! 🚀**
