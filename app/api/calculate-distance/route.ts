import { NextRequest, NextResponse } from "next/server";
import { getDeliveryCostByDistanceKm } from "@/lib/constants";

// 📍 COORDENADAS DEL LOCAL
// Link de Google Maps: https://maps.app.goo.gl/pdPgTyyquonJBjbz8
// Coordenadas reales configuradas
const STORE_COORDINATES = {
  lat: -34.627961, // Latitud del local
  lng: -58.766381, // Longitud del local
};

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

      // Ideal: distancia en auto (Google Distance Matrix) si hay API key.
      // Fallback: línea recta (Haversine) si no hay key.
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (apiKey) {
        const origin = `${STORE_COORDINATES.lat},${STORE_COORDINATES.lng}`;
        const destination = `${latitude},${longitude}`;
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${apiKey}&language=es&mode=driving&units=metric`;

        const response = await fetch(url);
        const data = await response.json();
        const element = data.rows?.[0]?.elements?.[0];

        if (data.status === "OK" && element?.status === "OK") {
          const distanceMeters = element.distance.value as number;
          const distanceKm = distanceMeters / 1000;
          const distanceText = element.distance.text as string;
          const durationText = element.duration.text as string;

          const { cost, range, outOfRange } =
            getDeliveryCostByDistanceKm(distanceKm);

          if (outOfRange) {
            return NextResponse.json({
              success: false,
              error: `Lo sentimos, estás a ${distanceKm.toFixed(
                1
              )} km del local. Solo hacemos delivery hasta 4 km.`,
              distance_km: distanceKm,
              distance_text: distanceText,
              duration_text: durationText,
            });
          }

          return NextResponse.json({
            success: true,
            distance_km: distanceKm,
            distance_text: distanceText,
            duration_text: durationText,
            delivery_cost: cost,
            delivery_range: range,
          });
        }
      }

      // Fallback: distancia en línea recta (puede diferir de la distancia en auto)
      const distanceKm = calculateDistanceFromCoordinates(
        STORE_COORDINATES.lat,
        STORE_COORDINATES.lng,
        latitude,
        longitude
      );

      const distanceText = `${distanceKm.toFixed(1)} km (línea recta)`;
      const durationText = `${Math.ceil(distanceKm * 3)} min aprox.`; // Estimación

      const { cost, range, outOfRange } = getDeliveryCostByDistanceKm(distanceKm);

      if (outOfRange) {
        return NextResponse.json({
          success: false,
          error: `Lo sentimos, estás a ${distanceKm.toFixed(1)} km del local. Solo hacemos delivery hasta 4 km.`,
          distance_km: distanceKm,
          distance_text: distanceText,
        });
      }

      return NextResponse.json({
        success: true,
        distance_km: distanceKm,
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

    // Verificar que Google Maps API esté configurada
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn("Google Maps API Key no configurada, usando simulación");
      return simulateDistance(address);
    }

    // Usar Distance Matrix API de Google Maps
    const origin = `${STORE_COORDINATES.lat},${STORE_COORDINATES.lng}`;
    const destination = encodeURIComponent(address);
    
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${apiKey}&language=es&mode=driving&units=metric`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      return NextResponse.json({
        success: false,
        error: "No se pudo calcular la distancia. Verificá la dirección ingresada.",
      });
    }

    const element = data.rows[0]?.elements[0];
    
    if (!element || element.status !== "OK") {
      return NextResponse.json({
        success: false,
        error: "Dirección no encontrada. Por favor, ingresá una dirección válida.",
      });
    }

    // Distancia en kilómetros
    const distanceMeters = element.distance.value;
    const distanceKm = distanceMeters / 1000;
    const distanceText = element.distance.text;
    const durationText = element.duration.text;

    const { cost, range, outOfRange } = getDeliveryCostByDistanceKm(distanceKm);

    if (outOfRange) {
      return NextResponse.json({
        success: false,
        error: `Lo sentimos, tu dirección está a ${distanceKm.toFixed(1)} km. Solo hacemos delivery hasta 4 km del local.`,
        distance_km: distanceKm,
        distance_text: distanceText,
      });
    }

    return NextResponse.json({
      success: true,
      distance_km: distanceKm,
      distance_text: distanceText,
      duration_text: durationText,
      delivery_cost: cost,
      delivery_range: range,
    });
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
