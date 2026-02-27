import { NextRequest, NextResponse } from "next/server";
import { getDeliveryCostByDistanceKm } from "@/lib/constants";

// 📍 COORDENADAS DEL LOCAL
// Link de Google Maps: https://maps.app.goo.gl/pdPgTyyquonJBjbz8
// Coordenadas reales configuradas
const STORE_COORDINATES = {
  lat: -34.627961, // Latitud del local
  lng: -58.766381, // Longitud del local
};

// Factor de corrección para alinear distancias de ORS con la realidad de las rutas de Google Maps
const SAFETY_FACTOR = 1.5;
// Factor adicional para línea recta (fallback Haversine) para ser aún más conservadores
const STRAIGHT_LINE_FACTOR = 2.0;

type DistanceResponse = {
  success: boolean;
  distance_km?: number;
  distance_text?: string;
  delivery_cost?: number;
  delivery_range?: string;
  duration_text?: string;
  error?: string;
};

// Función para calcular distancia entre dos coordenadas GPS (Fórmula de Haversine)
function calculateDistanceFromCoordinates(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distancia en km
  
  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export async function POST(request: NextRequest) {
  try {
    const { address, latitude, longitude } = await request.json();

    // Si vienen coordenadas GPS (geolocalización del navegador)
    if (latitude !== undefined && longitude !== undefined) {
      console.log("Calculando distancia con GPS:", { latitude, longitude });

      // 1) Preferir OpenRouteService (distancia en auto) si hay API key
      const orsKey = process.env.OPENROUTESERVICE_API_KEY;
      let distanceKmFromOrs: number | null = null;
      let durationMinutes: number | null = null;

      if (orsKey) {
        try {
          const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${encodeURIComponent(
            orsKey
          )}&start=${STORE_COORDINATES.lng},${STORE_COORDINATES.lat}&end=${longitude},${latitude}`;

          const orsRes = await fetch(url);

          const orsData = await orsRes.json();
          const summary =
            orsData?.features?.[0]?.properties?.summary ??
            orsData?.routes?.[0]?.summary;

          if (orsRes.ok && summary?.distance != null && summary?.duration != null) {
            const distanceMeters = summary.distance as number;
            distanceKmFromOrs = distanceMeters / 1000;
            const durationSeconds = summary.duration as number;
            durationMinutes = Math.round(durationSeconds / 60);
          }
        } catch (e) {
          console.error("Error llamando a OpenRouteService:", e);
        }
      }

      let adjustedDistanceKm: number;
      let durationText: string;
      let distanceText: string;

      if (distanceKmFromOrs != null && durationMinutes != null) {
        // ORS funcionó: aplicar SAFETY_FACTOR y redondear
        const conservativeKm =
          Math.round(distanceKmFromOrs * SAFETY_FACTOR * 10) / 10;
        adjustedDistanceKm = conservativeKm;
        distanceText = `${adjustedDistanceKm.toFixed(1)} km`;
        durationText = `${durationMinutes} min`;
      } else {
        // 2) Fallback: distancia en línea recta (Haversine) con STRAIGHT_LINE_FACTOR
        const straightKm = calculateDistanceFromCoordinates(
          STORE_COORDINATES.lat,
          STORE_COORDINATES.lng,
          latitude,
          longitude
        );
        const conservativeStraightKm =
          Math.round(straightKm * STRAIGHT_LINE_FACTOR * 10) / 10;
        adjustedDistanceKm = conservativeStraightKm;
        distanceText = `${adjustedDistanceKm.toFixed(
          1
        )} km (línea recta aprox.)`;
        durationText = `${Math.ceil(adjustedDistanceKm * 3)} min aprox.`; // Estimación básica
        console.warn(
          "Usando cálculo de línea recta (Haversine) para distancia de delivery"
        );
      }

      const { cost, range, outOfRange } =
        getDeliveryCostByDistanceKm(adjustedDistanceKm);

      if (outOfRange) {
        return NextResponse.json({
          success: false,
          error: `Lo sentimos, estás a ${adjustedDistanceKm.toFixed(
            1
          )} km del local. Solo hacemos delivery hasta 4 km.`,
          distance_km: adjustedDistanceKm,
          distance_text: distanceText,
        });
      }

      return NextResponse.json({
        success: true,
        distance_km: adjustedDistanceKm,
        distance_text: distanceText,
        duration_text: durationText,
        delivery_cost: cost,
        delivery_range: range,
      });
    }

    if (!address) {
      return NextResponse.json(
        { success: false, error: "Falta la dirección" },
        { status: 400 }
      );
    }

    // Sin GPS usamos una simulación simple (no dependemos de Google ni de otros proveedores)
    return simulateDistance(address);
  } catch (error) {
    console.error("Error calculating distance:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Error al calcular la distancia. Intentá de nuevo." 
      },
      { status: 500 }
    );
  }
}

// Simulación para desarrollo (sin API key)
function simulateDistance(address: string): NextResponse<DistanceResponse> {
  // Simular una distancia aleatoria entre 0.5 y 3.5 km
  const distanceKm = 0.5 + Math.random() * 3;
  const { cost, range } = getDeliveryCostByDistanceKm(distanceKm);

  return NextResponse.json({
    success: true,
    distance_km: distanceKm,
    distance_text: `${distanceKm.toFixed(1)} km`,
    duration_text: `${Math.ceil(distanceKm * 3)} min`,
    delivery_cost: cost,
    delivery_range: range,
  });
}
