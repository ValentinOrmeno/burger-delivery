# ✅ CHECKLIST DE CONFIGURACIÓN

## 📋 Progreso Actual

```
┌─────────────────────────────────────────────────────┐
│  ESTADO DE LA CONFIGURACIÓN                         │
├─────────────────────────────────────────────────────┤
│  ✅ Proyecto creado                                 │
│  ✅ Dependencias instaladas (417 paquetes)          │
│  ✅ Build exitoso                                   │
│  ✅ Cuenta de Supabase creada                       │
│  ✅ Script SQL ejecutado en Supabase                │
│  ✅ Credenciales de Supabase configuradas           │
│  ⏳ Realtime habilitado en Supabase (EN PROCESO)    │
│  ⏳ Mercado Pago configurado (PENDIENTE)            │
│  ⏳ Primera ejecución (PENDIENTE)                   │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 PASO ACTUAL: HABILITAR REALTIME

### 📖 Lee y sigue:
**Archivo**: `HABILITAR-REALTIME.md`

### 🔍 Resumen rápido:
1. Ir a Supabase
2. Database → Replication
3. Activar el switch de la tabla "orders"
4. ✅ Listo

### ⚙️ Si no encuentras "Replication":

Ejecuta este SQL en **SQL Editor** de Supabase:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
```

---

## 🚀 PRÓXIMOS PASOS

Una vez que habilites Realtime:

### 1️⃣ Probar la aplicación (SIN Mercado Pago)
```bash
npm run dev
```

Abre: http://localhost:3000

**Podrás ver**:
- ✅ Catálogo de productos
- ✅ Agregar al carrito
- ✅ Ver el carrito flotante
- ❌ NO podrás pagar (necesitas MP)

### 2️⃣ Configurar Mercado Pago (10 min)

Te ayudaré paso a paso cuando termines con Realtime.

**Necesitarás**:
- Cuenta en mercadopago.com/developers
- Crear una aplicación
- Obtener credenciales de PRUEBA

### 3️⃣ Probar el flujo completo

Con MP configurado podrás:
- ✅ Hacer un pedido completo
- ✅ Pagar con tarjeta de prueba
- ✅ Ver la orden en el dashboard admin
- ✅ Cambiar estados en tiempo real

---

## 📊 Credenciales Actuales

### ✅ Supabase (CONFIGURADO)
```
URL: https://wjnnkolvmxjnelrxctmn.supabase.co
Key: sb_publishable_Nyi933YjxIH2bQosXYG0vA_8CPK9qIy
```

### ⏳ Mercado Pago (PENDIENTE)
```
Public Key: (por configurar)
Access Token: (por configurar)
```

---

## 🎓 Documentación Útil

Según tu progreso, lee estos archivos:

| Archivo | Cuándo leerlo |
|---------|---------------|
| `HABILITAR-REALTIME.md` | **AHORA** - Habilitar Realtime |
| `INICIO-RAPIDO.md` | Después - Primera ejecución |
| `SETUP.md` | Si tienes dudas - Guía completa |
| `COMANDOS.md` | Cuando ejecutes - Troubleshooting |

---

## 💡 Tips

- ✅ **Ya ejecutaste el SQL** en Supabase (tienes productos)
- ✅ **Las credenciales están configuradas** en `.env.local`
- 🔄 **Solo falta habilitar Realtime** (2 minutos)
- 🎯 **Luego configuras Mercado Pago** (opcional para empezar)

---

## 🆘 Si Tienes Problemas

### Realtime no se habilita
→ Usa la Opción C en `HABILITAR-REALTIME.md` (SQL manual)

### Error al ejecutar npm run dev
→ Verifica que el `.env.local` tenga las credenciales correctas

### Los productos no se ven
→ El script SQL ya lo ejecutaste, debería funcionar

---

## ✨ Siguiente Mensaje

Cuando hayas habilitado Realtime, avísame con:

```
"Ya habilité Realtime en Supabase"
```

Y te ayudo con:
1. Probar la aplicación
2. Configurar Mercado Pago paso a paso

---

**¡Vas muy bien! Solo falta un paso para ver la app funcionando. 🚀**
