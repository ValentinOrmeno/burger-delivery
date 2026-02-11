# 🔧 Comandos Útiles

## 🚀 Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Ejecutar en modo producción
npm run build && npm start

# Linter
npm run lint
```

---

## 📦 Gestión de Dependencias

```bash
# Instalar todas las dependencias
npm install

# Actualizar dependencias
npm update

# Auditar vulnerabilidades
npm audit

# Limpiar caché y reinstalar
rm -rf node_modules package-lock.json
npm install
```

---

## 🗄️ Supabase (SQL Editor)

### Ver todas las órdenes
```sql
SELECT * FROM orders ORDER BY created_at DESC;
```

### Ver órdenes con sus items
```sql
SELECT 
  o.*,
  json_agg(
    json_build_object(
      'product', p.name,
      'quantity', oi.quantity,
      'price', oi.unit_price
    )
  ) as items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
GROUP BY o.id
ORDER BY o.created_at DESC;
```

### Cambiar estado de una orden manualmente
```sql
UPDATE orders 
SET status = 'paid' 
WHERE id = 'tu-order-id-aqui';
```

### Ver productos disponibles
```sql
SELECT * FROM products WHERE is_available = true;
```

### Agregar un nuevo producto
```sql
INSERT INTO products (name, description, price, image_url, category, is_available)
VALUES (
  'Nueva Burger',
  'Descripción de la burger',
  16.99,
  'https://images.unsplash.com/photo-...',
  'burger',
  true
);
```

### Eliminar todas las órdenes (CUIDADO!)
```sql
DELETE FROM orders;
```

---

## 🧪 Testing en Desarrollo

### Tarjetas de Prueba Mercado Pago

**Tarjeta APROBADA (Visa)**
```
Número: 4509 9535 6623 3704
CVV: 123
Fecha: 11/25 (cualquier futura)
Nombre: APRO (importante!)
```

**Tarjeta RECHAZADA (Mastercard)**
```
Número: 5031 7557 3453 0604
CVV: 123
Fecha: 11/25
Nombre: OTHE
```

**Tarjeta PENDIENTE**
```
Número: 5031 4332 1540 6351
CVV: 123
Fecha: 11/25
Nombre: CONT
```

### Simular Webhook Manualmente

Si el webhook no funciona en desarrollo, puedes simular el pago:

```bash
# 1. Hacer un pedido y obtener el order_id
# 2. En Supabase SQL Editor:
UPDATE orders 
SET status = 'paid', payment_status = 'approved' 
WHERE id = 'order-id-del-pedido';
```

---

## 🌐 Exponer localhost con ngrok

Para que Mercado Pago pueda enviar webhooks a tu localhost:

```bash
# Instalar ngrok
# https://ngrok.com/download

# Ejecutar
ngrok http 3000

# Copiar la URL pública (ej: https://abc123.ngrok.io)
# Configurar en MP Webhooks:
# https://abc123.ngrok.io/api/webhooks/mercadopago
```

---

## 🔍 Debugging

### Ver logs en tiempo real

```bash
# En la terminal donde ejecutas npm run dev
# Los logs de API routes aparecen aquí
```

### Ver logs de Supabase

1. Ir a tu proyecto en Supabase
2. Database > Logs
3. Seleccionar "API Logs" o "Postgres Logs"

### Ver logs de Mercado Pago

1. Ir a [Mercado Pago Developers](https://www.mercadopago.com.ar/developers)
2. Tu aplicación → Actividad
3. Ver todas las requests y responses

### Limpiar caché de Next.js

```bash
rm -rf .next
npm run dev
```

---

## 📊 Útiles para Producción

### Ver tamaño del build

```bash
npm run build
# Al final muestra el tamaño de cada ruta
```

### Analizar bundle

```bash
# Instalar el analizador
npm install --save-dev @next/bundle-analyzer

# En next.config.js, agregar:
# const withBundleAnalyzer = require('@next/bundle-analyzer')({
#   enabled: process.env.ANALYZE === 'true',
# })
# module.exports = withBundleAnalyzer(nextConfig)

# Ejecutar
ANALYZE=true npm run build
```

---

## 🔐 Seguridad

### Rotar credenciales de Supabase

1. Ir a Settings > API
2. Generar nueva anon key
3. Actualizar `.env.local`
4. Reiniciar servidor

### Regenerar Access Token de Mercado Pago

1. Ir a Credenciales
2. Renovar credenciales
3. Actualizar `.env.local`
4. Reiniciar servidor

---

## 🗃️ Backup de la Base de Datos

### Exportar datos (Supabase)

1. Ir a Database > Backups
2. Descargar backup
3. O usar SQL:

```sql
-- Exportar productos
SELECT * FROM products;

-- Copiar el resultado y guardarlo
```

### Importar datos

```sql
-- Pegar el INSERT INTO generado del backup
INSERT INTO products (...) VALUES (...);
```

---

## 🚀 Deploy

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy a producción
vercel --prod
```

### Variables de entorno en Vercel

1. Ir a tu proyecto en Vercel
2. Settings > Environment Variables
3. Agregar todas las variables de `.env.local`
4. Redeploy

---

## 📝 Git

```bash
# Inicializar repo
git init

# Agregar todos los archivos
git add .

# Commit inicial
git commit -m "feat: initial commit - hamburgueseria app"

# Conectar con GitHub
git remote add origin https://github.com/tu-usuario/hamburgueseria.git

# Push
git push -u origin main
```

---

## 🎯 Comandos Rápidos

```bash
# Desarrollo completo (desde cero)
npm install && npm run dev

# Verificar que todo compile
npm run build

# Ver dependencias instaladas
npm list --depth=0

# Buscar dependencias desactualizadas
npm outdated

# Limpiar todo y empezar de nuevo
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

---

## 💡 Tips

- **Siempre verifica el .env.local** antes de ejecutar
- **Los cambios en .env.local** requieren reiniciar el servidor
- **El webhook solo funciona en producción** o con ngrok en desarrollo
- **Usa "Credenciales de prueba"** de MP para desarrollo
- **Revisa los logs** cuando algo no funcione
- **Habilita Realtime** en Supabase para que el admin funcione

---

¡Estos comandos te ayudarán a gestionar el proyecto de manera eficiente! 🚀
