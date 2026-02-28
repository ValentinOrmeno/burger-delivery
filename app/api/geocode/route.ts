import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy a Google Places Autocomplete API para autocompletado de direcciones.
 * Restringido a Argentina, con sesgo hacia Moreno, Buenos Aires.
 *
 * Requiere: GOOGLE_MAPS_API_KEY en .env.local
 * APIs necesarias en Google Cloud Console:
 *   - Places API (New) o Places API
 *   - Geocoding API (para obtener coordenadas de la dirección seleccionada)
 */

// Coordenadas del local (para sesgar resultados hacia Moreno)
const STORE_LAT = -34.627961;
const STORE_LNG = -58.766381;

// Radio de sesgo en metros (partido de Moreno ~15km de radio)
const LOCATION_BIAS_RADIUS = 15000;

type GooglePrediction = {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
    main_text_matched_substrings?: Array<{ offset: number; length: number }>;
  };
  types: string[];
};

type GoogleAutocompleteResponse = {
  predictions: GooglePrediction[];
  status: string;
  error_message?: string;
};

type GoogleGeocodeResult = {
  geometry: {
    location: { lat: number; lng: number };
  };
  formatted_address: string;
};

type GoogleGeocodeResponse = {
  results: GoogleGeocodeResult[];
  status: string;
};

export async function GET(request: NextRequest) {
  const token = process.env.GOOGLE_MAPS_API_KEY;
  if (!token) {
    // Fallback: si no hay key de Google, intentar con Mapbox
    return fallbackToMapbox(request);
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    // Google Places Autocomplete API
    const params = new URLSearchParams({
      input: q,
      key: token,
      language: "es",
      components: "country:ar",
      // Sesgo hacia Moreno (circle:radio|lat,lng)
      location: `${STORE_LAT},${STORE_LNG}`,
      radius: String(LOCATION_BIAS_RADIUS),
      // Tipos: direcciones y establecimientos
      types: "address",
    });

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    const data = (await res.json()) as GoogleAutocompleteResponse;

    if (!res.ok || data.status === "REQUEST_DENIED") {
      console.error("Google Places error:", data.status, data.error_message);
      return fallbackToMapbox(request);
    }

    if (data.status === "ZERO_RESULTS" || !data.predictions?.length) {
      return NextResponse.json({ suggestions: [] });
    }

    // Mapear predicciones al formato interno
    // Para obtener coordenadas necesitamos hacer un geocode por place_id
    // Hacemos las requests en paralelo (máx 5 para no exceder cuota)
    const top5 = data.predictions.slice(0, 5);

    const withCoords = await Promise.all(
      top5.map(async (pred) => {
        const sf = pred.structured_formatting;
        const address = sf.main_text;
        const context = sf.secondary_text;

        // Obtener coordenadas via Geocoding API (place_id)
        let latitude = 0;
        let longitude = 0;
        try {
          const geoParams = new URLSearchParams({
            place_id: pred.place_id,
            key: token,
            language: "es",
          });
          const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?${geoParams.toString()}`;
          const geoRes = await fetch(geoUrl, { next: { revalidate: 3600 } });
          const geoData = (await geoRes.json()) as GoogleGeocodeResponse;
          if (geoData.results?.[0]?.geometry?.location) {
            latitude = geoData.results[0].geometry.location.lat;
            longitude = geoData.results[0].geometry.location.lng;
          }
        } catch {
          // Si falla el geocode, devolvemos sin coords (el usuario puede usar GPS)
        }

        return {
          address,
          context,
          full_address: pred.description,
          latitude,
          longitude,
        };
      })
    );

    return NextResponse.json({ suggestions: withCoords });
  } catch (e) {
    console.error("Google Places error:", e);
    return fallbackToMapbox(request);
  }
}

/**
 * Fallback a Mapbox si Google no está configurado o falla.
 * Mantiene compatibilidad con la configuración anterior.
 */
async function fallbackToMapbox(request: NextRequest) {
  const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
  if (!mapboxToken) {
    return NextResponse.json({ suggestions: [] });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const MORENO_BBOX = "-58.98,-34.74,-58.72,-34.50";
  const STORE_PROXIMITY = `${STORE_LNG},${STORE_LAT}`;

  try {
    const params = new URLSearchParams({
      access_token: mapboxToken,
      q,
      autocomplete: "true",
      limit: "5",
      country: "AR",
      language: "es",
      types: "address,street,place,locality,neighborhood",
      bbox: MORENO_BBOX,
      proximity: STORE_PROXIMITY,
    });
    const url = `https://api.mapbox.com/search/geocode/v6/forward?${params.toString()}`;
    const res = await fetch(url);
    const data = (await res.json()) as {
      features?: Array<{
        geometry?: { coordinates: [number, number] };
        properties?: {
          name?: string;
          full_address?: string;
          place_formatted?: string;
          feature_type?: string;
          context?: {
            address?: { address_number?: string; street_name?: string; name?: string };
            neighborhood?: { name?: string };
            locality?: { name?: string };
            place?: { name?: string };
          };
        };
      }>;
    };

    if (!res.ok || !Array.isArray(data?.features)) {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions = data.features.map((f) => {
      const props = f.properties ?? {};
      const [lng, lat] = f.geometry?.coordinates ?? [0, 0];
      const ctx = props.context;
      const addrCtx = ctx?.address;
      const addressDisplay =
        (addrCtx?.name ?? [addrCtx?.street_name, addrCtx?.address_number].filter(Boolean).join(" ")) ||
        (props.name ?? "");
      const neighborhood = ctx?.neighborhood?.name;
      const locality = ctx?.locality?.name;
      const place = ctx?.place?.name;
      const parts: string[] = [];
      if (neighborhood) parts.push(neighborhood);
      if (locality && locality !== place) parts.push(locality);
      if (place) parts.push(place);
      const contextLine = parts.join(", ") || props.place_formatted || "";

      return {
        address: addressDisplay.trim() || props.name || "",
        context: contextLine || undefined,
        full_address: props.full_address || addressDisplay,
        latitude: lat,
        longitude: lng,
      };
    });

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
