# ⚡ Quick Start - 5 Minutos

## 🎯 Objetivo
Tener la app funcionando en 5 minutos (sin Mercado Pago, solo vista previa)

## 📝 Pasos Rápidos

### 1. Configurar Supabase (2 minutos)

```bash
# 1. Ir a https://supabase.com y crear proyecto
# 2. En SQL Editor, ejecutar todo el contenido de: supabase-schema.sql
# 3. Copiar las credenciales de Settings > API
```

### 2. Configurar Variables de Entorno (1 minuto)

Edita `.env.local`:

```env
# Supabase (REQUERIDO)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key

# Mercado Pago (OPCIONAL para empezar)
NEXT_PUBLIC_MP_PUBLIC_KEY=TEST-xxxxxxx
MP_ACCESS_TOKEN=TEST-xxxxxxx

# URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Ejecutar (1 minuto)

```bash
npm run dev
```

### 4. Probar (1 minuto)

1. **Frontend**: [http://localhost:3000](http://localhost:3000)
   - Verás el catálogo de hamburguesas
   - Agrega productos al carrito
   - Ve hasta checkout (no podrás pagar sin MP)

2. **Admin**: [http://localhost:3000/admin](http://localhost:3000/admin)
   - Dashboard de cocina vacío

---

## 🔥 Modo Demo Completo

Para probar el flujo completo con pagos:

1. **Configura Mercado Pago** (10 min extra):
   - Ve a [mercadopago.com/developers](https://www.mercadopago.com.ar/developers)
   - Crea una aplicación
   - Obtén las credenciales de prueba
   - Agrégalas a `.env.local`
   - Reinicia el servidor

2. **Prueba el flujo completo**:
   - Haz un pedido
   - Paga con tarjeta de prueba: `4509 9535 6623 3704`
   - Ve al admin y verás la orden aparecer en tiempo real

---

## 📚 Siguiente Paso

Lee el archivo [SETUP.md](./SETUP.md) para la guía completa con screenshots y troubleshooting.

---

## 🆘 Problema Común

**Error: "Missing Supabase environment variables"**
- Solución: Verifica `.env.local` y reinicia el servidor con `Ctrl+C` y `npm run dev`

**No se ven los productos**
- Solución: Verifica que ejecutaste el script SQL completo en Supabase

**El carrito no persiste**
- Solución: Normal, Zustand guarda en localStorage del navegador

---

¡Disfruta construyendo! 🍔🚀
