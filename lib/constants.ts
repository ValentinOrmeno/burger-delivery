// ─── Única fuente de verdad para el proyecto ───────────────────────────────

export const WHATSAPP_NUMBER = "5491168582586";

export const DELIVERY_RATES = [
  { label: "Hasta 950 m", value: "0-950", cost: 600 },
  { label: "De 1 km a 1,4 km", value: "1000-1400", cost: 1400 },
  { label: "De 1,5 km a 2,4 km", value: "1500-2400", cost: 1700 },
  { label: "De 2,5 km a 3,4 km", value: "2500-3400", cost: 2000 },
  { label: "De 3,5 km a 4 km", value: "3500-4000", cost: 2300 },
] as const;

export type DeliveryRateValue = (typeof DELIVERY_RATES)[number]["value"];

export function getDeliveryCost(value: string): number {
  return DELIVERY_RATES.find((r) => r.value === value)?.cost ?? 0;
}

export function getDeliveryLabel(value: string): string {
  return DELIVERY_RATES.find((r) => r.value === value)?.label ?? value;
}

/** Usado por la API de cálculo de distancia (GPS o dirección). */
export function getDeliveryCostByDistanceKm(distanceKm: number): {
  cost: number;
  range: string;
  outOfRange: boolean;
} {
  if (distanceKm <= 0.95) return { cost: 600, range: "0-950", outOfRange: false };
  if (distanceKm <= 1.4) return { cost: 1400, range: "1000-1400", outOfRange: false };
  if (distanceKm <= 2.4) return { cost: 1700, range: "1500-2400", outOfRange: false };
  if (distanceKm <= 3.4) return { cost: 2000, range: "2500-3400", outOfRange: false };
  if (distanceKm <= 4.0) return { cost: 2300, range: "3500-4000", outOfRange: false };
  return { cost: 0, range: "", outOfRange: true };
}
