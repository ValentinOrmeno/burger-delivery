/**
 * Configuracion del negocio. Editar aqui para cambiar numero de WhatsApp,
 * direccion, horarios, etc. en toda la app.
 */
export const STORE = {
  whatsapp: "5491168582586",
  address: "Tu direccion del local",
  hours: "Lun a Dom 12:00 - 00:00",
  deliveryZone: "Moreno y alrededores (hasta 4 km)",
  paymentMethods: "Efectivo, Transferencia, Mercado Pago",
} as const;

export const whatsappUrl = (text?: string) => {
  const base = `https://wa.me/${STORE.whatsapp}`;
  if (text) return `${base}?text=${encodeURIComponent(text)}`;
  return base;
};
