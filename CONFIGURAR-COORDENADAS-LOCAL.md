# 📍 Configurar Coordenadas del Local (1 minuto)

## 🎯 ¿Para qué?

El sistema necesita saber dónde está tu local para calcular la distancia con el GPS del cliente.

---

## 📋 Paso a Paso (MUY SIMPLE)

### **1. Abrí tu ubicación en Google Maps:**

Tu link: https://maps.app.goo.gl/pdPgTyyquonJBjbz8

### **2. Obtener las coordenadas:**

**Opción A (Más fácil):**
1. En Google Maps, hacé clic derecho en el marcador de tu local
2. Seleccioná **"¿Qué hay aquí?"**
3. Abajo aparecerán las coordenadas (ej: `-34.6037, -58.3816`)
4. Hacé clic en las coordenadas para copiarlas

**Opción B:**
1. Abrí el link en el celular
2. Tocá en el marcador
3. Deslizá hacia arriba la info
4. Verás las coordenadas

### **3. Pegar en el código:**

Abrí el archivo:
```
app/api/calculate-distance/route.ts
```

Buscá las líneas 5-8 (al principio del archivo):
```typescript
const STORE_COORDINATES = {
  lat: -34.6037, // ← REEMPLAZAR con tu latitud
  lng: -58.3816, // ← REEMPLAZAR con tu longitud
};
```

### **4. Ejemplo:**

Si tus coordenadas son: `-34.6037, -58.3816`

```typescript
const STORE_COORDINATES = {
  lat: -34.6037,  // Primer número (latitud)
  lng: -58.3816,  // Segundo número (longitud)
};
```

⚠️ **IMPORTANTE:** En Argentina, ambos números son NEGATIVOS (llevan el signo `-`)

### **5. Guardar y reiniciar:**

```bash
npm run dev
```

---

## ✅ ¡Listo!

Ya funciona el cálculo automático de distancia con GPS.

---

## 🧪 Cómo Probar

1. Abrí el checkout en tu celular: `http://localhost:3000/checkout`
2. Agregá productos al carrito
3. Ingresá una dirección (ej: "Av. Corrientes 1234")
4. Hacé clic en **"📍 Usar mi ubicación GPS"**
5. Tu celular pedirá permiso para usar la ubicación
6. Aceptá el permiso
7. ✅ Verás: "Distancia: 2.3 km | Delivery: $1.700"

---

## 🔒 Privacidad

- El GPS se usa SOLO cuando el cliente hace clic en el botón
- El navegador SIEMPRE pide permiso antes
- Las coordenadas NO se guardan en ningún lado
- Solo se usa para calcular la distancia en ese momento

---

## ❓ Preguntas Frecuentes

### **¿Funciona en computadora?**
Sí, pero es menos preciso. Usa la IP o WiFi para estimar ubicación.
**Recomendado:** Usar desde el celular con GPS.

### **¿Qué pasa si el cliente no acepta el permiso?**
Aparece un mensaje: "Debes permitir el acceso a tu ubicación para calcular el delivery"

### **¿Es gratis?**
100% gratis. No usa ninguna API externa, todo se calcula en el navegador.

### **¿Es preciso?**
Muy preciso. Usa el GPS del celular (±10 metros de error).

### **¿Funciona offline?**
No, necesita internet para enviar las coordenadas al servidor.

---

## 🆘 Si no funciona

1. Verificá que las coordenadas estén correctas
2. Verificá que tengan el signo `-` (negativo)
3. Verificá que el GPS del celular esté activado
4. Probá desde el celular, no desde la compu
5. Verificá que el navegador tenga permisos de ubicación

---

## 📊 Cómo se Calcula

El sistema usa la **Fórmula de Haversine** para calcular la distancia en línea recta entre dos puntos GPS.

**Ejemplo:**
- Local: `-34.6037, -58.3816`
- Cliente: `-34.6100, -58.3900`
- Distancia: `~1.2 km`

Luego asigna la tarifa según tu tabla:
- 0-950m: $600
- 1-1.4km: $1.400
- 1.5-2.4km: $1.700
- etc.

---

## ✅ Ventajas vs Google Maps API

| Feature | GPS del Navegador | Google Maps API |
|---------|-------------------|-----------------|
| Costo | 🆓 Gratis | 💰 Paga después de 40k |
| Configuración | ✅ 1 minuto | ⚙️ 15 minutos |
| Precisión | 📍 ±10m | 📍 ±10m |
| Requiere permiso | ✅ Sí | ❌ No |
| Funciona siempre | ⚠️ Solo si acepta | ✅ Siempre |

**Conclusión:** GPS del navegador es perfecto para tu caso.

---

¡Eso es todo! Solo necesitás pegar las coordenadas de tu local y ya funciona.
