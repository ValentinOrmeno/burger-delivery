"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Banknote, MapPin, Loader2, Lock, Unlock, Store, Truck, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";
import { DELIVERY_RATES, WHATSAPP_NUMBER, getDeliveryCost, getDeliveryLabel } from "@/lib/constants";
import Image from "next/image";
import { toast } from "sonner";

type PaymentMethod = "cash" | "mercadopago";
type OrderType = "delivery" | "pickup";

type AddressSuggestion = {
  address: string;
  context?: string;
  full_address: string;
  latitude: number;
  longitude: number;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, getEffectiveUnitPrice, clearCart } = useCartStore();
  const addressInputWrapperRef = useRef<HTMLDivElement>(null);
  const geocodeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextGeocodeRef = useRef(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mercadopago");
  const [orderType, setOrderType] = useState<OrderType>("delivery");
  const [gpsLocked, setGpsLocked] = useState(false);
  const [distanceInfo, setDistanceInfo] = useState<{
    distance_km: number;
    distance_text: string;
    duration_text: string;
  } | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [addressSuggestionsLoading, setAddressSuggestionsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    floor: "",
    betweenStreets: "",
    notes: "",
    delivery_distance: "",
  });

  const promoContext = { paymentMethod, orderType };
  const total = getTotal(promoContext);
  const deliveryCost = orderType === "delivery" ? getDeliveryCost(formData.delivery_distance) : 0;
  const totalWithDelivery = total + deliveryCost;
  const fullAddress =
    formData.address.trim() + (formData.floor.trim() ? `, ${formData.floor.trim()}` : "");

  // Al cambiar a pickup, limpiar datos de delivery
  useEffect(() => {
    if (orderType === "pickup") {
      setGpsLocked(false);
      setDistanceInfo(null);
      setFormData((prev) => ({ ...prev, delivery_distance: "" }));
    }
  }, [orderType]);

  const handleAddressChange = useCallback(
    (newAddress: string) => {
      setFormData((prev) => ({
        ...prev,
        address: newAddress,
        ...(gpsLocked ? { delivery_distance: "" } : {}),
      }));
      if (gpsLocked) {
        setGpsLocked(false);
        setDistanceInfo(null);
      }
    },
    [gpsLocked]
  );

  // Autocompletado: buscar sugerencias al escribir (debounce 350 ms)
  useEffect(() => {
    if (skipNextGeocodeRef.current) {
      skipNextGeocodeRef.current = false;
      return;
    }
    const q = formData.address.trim();
    if (q.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    if (geocodeDebounceRef.current) clearTimeout(geocodeDebounceRef.current);
    geocodeDebounceRef.current = setTimeout(async () => {
      setAddressSuggestionsLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setAddressSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      } catch {
        setAddressSuggestions([]);
      } finally {
        setAddressSuggestionsLoading(false);
      }
    }, 350);
    return () => {
      if (geocodeDebounceRef.current) {
        clearTimeout(geocodeDebounceRef.current);
        geocodeDebounceRef.current = null;
      }
    };
  }, [formData.address]);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        addressSuggestions.length > 0 &&
        addressInputWrapperRef.current &&
        !addressInputWrapperRef.current.contains(e.target as Node)
      ) {
        setAddressSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [addressSuggestions.length]);

  const selectAddressSuggestion = useCallback(
    async (s: AddressSuggestion) => {
      skipNextGeocodeRef.current = true;
      handleAddressChange(s.address);
      setAddressSuggestions([]);
      if (s.latitude && s.longitude && orderType === "delivery") {
        setIsCalculatingDistance(true);
        try {
          const res = await fetch("/api/calculate-distance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude: s.latitude, longitude: s.longitude }),
          });
          const data = await res.json();
          if (data.success) {
            setDistanceInfo({
              distance_km: data.distance_km,
              distance_text: data.distance_text,
              duration_text: data.duration_text,
            });
            setFormData((prev) => ({ ...prev, delivery_distance: data.delivery_range }));
            toast.success(
              `📍 ${data.distance_text} — Delivery: ${formatPrice(data.delivery_cost)}`,
              { duration: 4000 }
            );
          }
        } catch {
          // silenciar; el usuario puede elegir manualmente o usar GPS
        } finally {
          setIsCalculatingDistance(false);
        }
      }
    },
    [handleAddressChange, orderType]
  );

  const useMyLocation = useCallback(async () => {
    if (formData.address.trim().length < 5) {
      toast.error("Ingresá tu dirección antes de usar el GPS");
      return;
    }
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización. Elegí la distancia manualmente.");
      return;
    }
    setIsCalculatingDistance(true);
    toast.info("Esperando permiso de ubicación…", { duration: 3000 });

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res = await fetch("/api/calculate-distance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude, longitude }),
          });
          const data = await res.json();
          if (!data.success) {
            toast.error(data.error ?? "No se pudo calcular la distancia. Elegí manualmente.");
            return;
          }
          setDistanceInfo({
            distance_km: data.distance_km,
            distance_text: data.distance_text,
            duration_text: data.duration_text,
          });
          setFormData((prev) => ({ ...prev, delivery_distance: data.delivery_range }));
          setGpsLocked(true);
          toast.success(
            `📍 ${data.distance_text} del local — Delivery: ${formatPrice(data.delivery_cost)}`,
            { duration: 5000 }
          );
        } catch {
          toast.error("Error al calcular. Elegí la distancia manualmente.");
        } finally {
          setIsCalculatingDistance(false);
        }
      },
      (err: { code: number }) => {
        const msgs: Record<number, string> = {
          1: "Rechazaste el permiso. Elegí la distancia manualmente.",
          2: "Ubicación no disponible. Verificá que tengas el GPS activado.",
          3: "El GPS tardó demasiado. Intentá de nuevo o elegí manualmente.",
        };
        toast.error(msgs[err.code] ?? "No se pudo obtener tu ubicación.", { duration: 6000 });
        setIsCalculatingDistance(false);
      },
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 0 }
    );
  }, [formData.address]);

  const unlockManual = () => {
    setGpsLocked(false);
    setDistanceInfo(null);
    setFormData((prev) => ({ ...prev, delivery_distance: "" }));
    toast.info("Podés elegir la distancia manualmente.");
  };

  const buildWhatsAppMessage = useCallback(
    (orderNumber: number, pm: PaymentMethod, ot: OrderType, subtotal: number, totalConDelivery: number) => {
      const pmText = pm === "cash" ? "EFECTIVO/TRANSFERENCIA" : "MERCADO PAGO (PAGADO)";
      const otText = ot === "pickup" ? "RETIRO EN LOCAL" : "DELIVERY";
      const ctx = { paymentMethod: pm, orderType: ot };
      let msg = `*NUEVO PEDIDO - ${pmText} - ${otText}*\n\n*Pedido #${orderNumber}*\n\n`;
      msg += `*Cliente:* ${formData.name}\n*Telefono:* ${formData.phone}\n`;
      if (ot === "delivery") {
        if (fullAddress) msg += `*Direccion:* ${fullAddress}\n`;
        if (formData.betweenStreets) msg += `*Entre calles:* ${formData.betweenStreets}\n`;
        msg += `*Distancia:* ${getDeliveryLabel(formData.delivery_distance)}\n`;
      } else {
        msg += `*Tipo:* Retiro en el local\n`;
      }
      msg += `\n*DETALLE DEL PEDIDO:*\n\n`;
      items.forEach((item, idx) => {
        const unitPrice = getEffectiveUnitPrice(item.product, item.extras, ctx);
        msg += `${idx + 1}. *${item.product.name}* x${item.quantity}\n`;
        if (item.extras?.length)
          msg += `   Extras: ${item.extras.map((e) => `${e.addon.name}${e.quantity > 1 ? ` x${e.quantity}` : ""}`).join(", ")}\n`;
        msg += `   Subtotal: ${formatPrice(unitPrice * item.quantity)}\n\n`;
      });
      if (formData.notes) msg += `*Notas:* ${formData.notes}\n\n`;
      msg += `Subtotal productos: ${formatPrice(subtotal)}\n`;
      if (ot === "delivery") msg += `Costo delivery: ${formatPrice(deliveryCost)}\n`;
      msg += `---------------------------\n`;
      msg += `*TOTAL: ${formatPrice(totalConDelivery)}*\n*Metodo: ${pmText}*\n\n`;
      msg += pm === "cash" ? "Pedido confirmado. Te contactaremos pronto!" : "PAGO YA REALIZADO - Confirmado con Mercado Pago";
      return msg;
    },
    [formData, fullAddress, items, deliveryCost, getEffectiveUnitPrice]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error("Completá todos los campos obligatorios");
      return;
    }
    if (orderType === "delivery") {
      if (!formData.address) {
        toast.error("Ingresá tu dirección");
        return;
      }
      if (!formData.delivery_distance) {
        toast.error("Usá el GPS o elegí tu distancia manualmente");
        return;
      }
      if (!formData.betweenStreets.trim() && !formData.notes.trim()) {
        toast.error("Completá 'Entre calles' o 'Notas' para que el repartidor te encuentre");
        return;
      }
    }
    if (items.length === 0) {
      toast.error("Tu carrito está vacío");
      return;
    }

    setIsLoading(true);

    const makeItems = (pm: PaymentMethod) =>
      items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: getEffectiveUnitPrice(item.product, item.extras, {
          paymentMethod: pm,
          orderType,
        }),
        extras: item.extras.map((e) => ({
          addon_id: e.addon.id,
          name: e.addon.name,
          price: e.addon.price,
          quantity: e.quantity,
        })),
      }));

    const baseBody = {
      customer_name: formData.name,
      customer_phone: formData.phone,
      customer_address: orderType === "delivery" ? fullAddress : undefined,
      between_streets: orderType === "delivery" ? formData.betweenStreets : undefined,
      notes: formData.notes,
      delivery_distance: orderType === "delivery" ? formData.delivery_distance : undefined,
      delivery_cost: orderType === "delivery" ? deliveryCost : 0,
      total_amount: totalWithDelivery,
      order_type: orderType,
    };

    try {
      if (paymentMethod === "cash") {
        const res = await fetch("/api/checkout/cash", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...baseBody, items: makeItems("cash") }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Error al crear el pedido");
        const message = buildWhatsAppMessage(data.order_number, "cash", orderType, total, totalWithDelivery);
        clearCart();
        toast.success("Pedido creado. Redirigiendo a WhatsApp…");
        setTimeout(() => {
          window.location.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        }, 1500);
        return;
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...baseBody, items: makeItems("mercadopago") }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al procesar el pedido");

      if (data.demo_mode) {
        clearCart();
        toast.success("¡Pedido creado en modo DEMO!");
        router.push(`/success?order_id=${data.order_id}`);
        return;
      }

      localStorage.setItem(
        "pending_whatsapp_order",
        JSON.stringify({
          orderNumber: data.order_number,
          customerName: formData.name,
          customerPhone: formData.phone,
          address: orderType === "delivery" ? fullAddress : undefined,
          betweenStreets: orderType === "delivery" ? formData.betweenStreets : undefined,
          deliveryDistance: orderType === "delivery" ? formData.delivery_distance : undefined,
          notes: formData.notes,
          orderType,
          items: items.map((item) => ({
            name: item.product.name,
            quantity: item.quantity,
            totalPrice: getEffectiveUnitPrice(item.product, item.extras, {
              paymentMethod: "mercadopago",
              orderType,
            }),
            extras: item.extras,
          })),
          total,
          deliveryCost: orderType === "delivery" ? deliveryCost : 0,
          totalWithDelivery,
        })
      );

      if (data.init_point) {
        clearCart();
        window.location.href = data.init_point;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
        <div className="w-full max-w-sm text-center">
          {/* Ícono animado */}
          <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-zinc-900 ring-2 ring-zinc-800">
            <ShoppingCart className="h-14 w-14 text-zinc-600" />
          </div>
          <h2 className="mb-2 text-2xl font-black text-white">Tu carrito está vacío</h2>
          <p className="mb-8 text-zinc-500">
            Todavía no agregaste nada. Volvé al menú y elegí tus burgers favoritas.
          </p>
          <Button
            onClick={() => router.push("/")}
            className="w-full bg-orange-600 py-6 text-lg font-bold hover:bg-orange-700"
          >
            🍔 Ver el menú
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al menú
          </Button>
          <h1 className="text-4xl font-black text-white">Finalizar Pedido</h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Información de entrega</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* ── Tipo de pedido: Delivery / Retiro ── */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-zinc-300">
                    Tipo de pedido <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        {
                          key: "delivery" as OrderType,
                          icon: <Truck className="h-5 w-5 text-white" />,
                          label: "Delivery",
                          sub: "Te lo llevamos",
                        },
                        {
                          key: "pickup" as OrderType,
                          icon: <Store className="h-5 w-5 text-white" />,
                          label: "Retiro en local",
                          sub: "Sin costo de envío",
                        },
                      ] as const
                    ).map(({ key, icon, label, sub }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setOrderType(key)}
                        className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-all ${
                          orderType === key
                            ? "border-orange-600 bg-orange-600/10"
                            : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                            orderType === key ? "bg-orange-600" : "bg-zinc-700"
                          }`}
                        >
                          {icon}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-white">{label}</p>
                          <p className="text-xs text-zinc-400">{sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  {orderType === "pickup" && (
                    <p className="mt-2 rounded-lg border border-orange-600/30 bg-orange-600/10 px-3 py-2 text-xs text-orange-300">
                      📍 Retirás en el local. Te avisamos por WhatsApp cuando esté listo.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="checkout-name" className="mb-2 block text-sm font-medium text-zinc-300">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="checkout-name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Juan Pérez"
                    required
                    className="border-zinc-700 bg-zinc-800 text-white"
                  />
                </div>

                <div>
                  <label htmlFor="checkout-phone" className="mb-2 block text-sm font-medium text-zinc-300">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="checkout-phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+54 9 11 1234-5678"
                    required
                    className="border-zinc-700 bg-zinc-800 text-white"
                  />
                </div>

                {/* ── Campos solo para delivery ── */}
                {orderType === "delivery" && (
                  <>
                    <div ref={addressInputWrapperRef} className="relative">
                      <label htmlFor="checkout-address" className="mb-2 block text-sm font-medium text-zinc-300">
                        Calle y número <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                        <Input
                          id="checkout-address"
                          name="address"
                          value={formData.address}
                          onChange={(e) => handleAddressChange(e.target.value)}
                          placeholder="Ej: Cura Brochero 6649"
                          required
                          autoComplete="off"
                          className="border-zinc-700 bg-zinc-800 pl-9 text-white placeholder:text-zinc-500"
                        />
                        {addressSuggestionsLoading && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        )}
                      </div>
                      {addressSuggestions.length > 0 && (
                        <ul
                          className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-zinc-200/10 bg-white shadow-2xl shadow-black/40"
                          role="listbox"
                        >
                          {addressSuggestions.map((s, i) => (
                            <li
                              key={`${s.address}-${i}`}
                              className={i < addressSuggestions.length - 1 ? "border-b border-zinc-100" : ""}
                            >
                              <button
                                type="button"
                                role="option"
                                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 focus:bg-zinc-50 focus:outline-none"
                                onClick={() => selectAddressSuggestion(s)}
                              >
                                {/* Ícono pin */}
                                <MapPin className="h-4 w-4 shrink-0 text-zinc-400" />
                                <div className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-semibold text-zinc-800">
                                    {s.address}
                                  </span>
                                  {s.context && (
                                    <span className="block truncate text-xs text-zinc-400">
                                      {s.context}
                                    </span>
                                  )}
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <label htmlFor="checkout-floor" className="mb-2 block text-sm font-medium text-zinc-300">
                        Piso / Depto / Unidad
                      </label>
                      <Input
                        id="checkout-floor"
                        name="floor"
                        value={formData.floor}
                        onChange={(e) => setFormData((p) => ({ ...p, floor: e.target.value }))}
                        placeholder="Opcional. Ej: 5to A"
                        className="border-zinc-700 bg-zinc-800 text-white"
                      />
                    </div>

                    <div>
                      <label htmlFor="checkout-between-streets" className="mb-2 block text-sm font-medium text-zinc-300">
                        Entre calles / referencia <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="checkout-between-streets"
                        name="betweenStreets"
                        value={formData.betweenStreets}
                        onChange={(e) => setFormData((p) => ({ ...p, betweenStreets: e.target.value }))}
                        placeholder="Ej: Paraná y Uruguay"
                        className="border-zinc-700 bg-zinc-800 text-white"
                      />
                      <p className="mt-1 text-xs text-zinc-500">
                        Obligatorio: completá este campo o las notas.
                      </p>
                    </div>

                    <div className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
                      <label htmlFor="checkout-delivery-distance" className="block text-sm font-medium text-zinc-300">
                        Distancia de delivery <span className="text-red-500">*</span>
                      </label>

                      {gpsLocked && distanceInfo ? (
                        <div className="rounded-lg border border-green-600 bg-green-600/10 p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-bold text-green-400">
                              <Lock className="h-4 w-4" />
                              {distanceInfo.distance_text} del local
                            </div>
                            <button
                              type="button"
                              onClick={unlockManual}
                              className="flex items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-white"
                            >
                              <Unlock className="h-3 w-3" />
                              Cambiar
                            </button>
                          </div>
                          <div className="mt-1 flex justify-between text-xs text-green-300">
                            <span>⏱ {distanceInfo.duration_text}</span>
                            <span className="font-bold">Delivery: {formatPrice(deliveryCost)}</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Button
                            type="button"
                            onClick={useMyLocation}
                            disabled={
                              isCalculatingDistance || formData.address.trim().length < 5
                            }
                            variant="outline"
                            className="w-full border-blue-600 bg-blue-600/10 text-blue-300 hover:bg-blue-600/20 disabled:opacity-50"
                          >
                            {isCalculatingDistance ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Calculando…
                              </>
                            ) : (
                              <>
                                <MapPin className="mr-2 h-4 w-4" />
                                Calcular automáticamente con GPS
                              </>
                            )}
                          </Button>
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <span className="flex-1 border-t border-zinc-700" />
                            <span>o elegí manualmente</span>
                            <span className="flex-1 border-t border-zinc-700" />
                          </div>
                          <select
                            id="checkout-delivery-distance"
                            name="delivery_distance"
                            value={formData.delivery_distance}
                            onChange={(e) =>
                              setFormData((p) => ({ ...p, delivery_distance: e.target.value }))
                            }
                            disabled={isCalculatingDistance}
                            className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-600 disabled:opacity-50"
                          >
                            <option value="">Seleccioná tu distancia aproximada</option>
                            {DELIVERY_RATES.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label} — {formatPrice(r.cost)}
                              </option>
                            ))}
                          </select>
                          {deliveryCost > 0 && (
                            <p className="text-sm text-orange-400">
                              Costo de delivery: {formatPrice(deliveryCost)}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="checkout-notes" className="mb-2 block text-sm font-medium text-zinc-300">
                    Notas{orderType === "delivery" ? " / info al repartidor" : ""}{" "}
                    {orderType === "delivery" && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    id="checkout-notes"
                    name="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                    placeholder={
                      orderType === "delivery"
                        ? "Ej: edificio blanco, timbre Martínez, sin cebolla…"
                        : "Ej: sin cebolla, extra salsa…"
                    }
                    rows={3}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-600"
                  />
                  {orderType === "delivery" && (
                    <p className="mt-1 text-xs text-zinc-500">
                      Obligatorio: completá este campo o entre calles.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-zinc-300">
                    Método de pago <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        {
                          key: "mercadopago" as PaymentMethod,
                          icon: <CreditCard className="h-5 w-5 text-white" />,
                          label: "Mercado Pago",
                          sub: "Tarjeta o débito",
                        },
                        {
                          key: "cash" as PaymentMethod,
                          icon: <Banknote className="h-5 w-5 text-white" />,
                          label: "Efectivo / Transf.",
                          sub: "Pago al recibir",
                        },
                      ] as const
                    ).map(({ key, icon, label, sub }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPaymentMethod(key)}
                        className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-all ${
                          paymentMethod === key
                            ? "border-orange-600 bg-orange-600/10"
                            : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                            paymentMethod === key ? "bg-orange-600" : "bg-zinc-700"
                          }`}
                        >
                          {icon}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-white">{label}</p>
                          <p className="text-xs text-zinc-400">{sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || (orderType === "delivery" && !formData.delivery_distance)}
                  className="w-full bg-orange-600 py-6 text-lg font-bold hover:bg-orange-700 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Procesando…
                    </>
                  ) : paymentMethod === "cash" ? (
                    "Enviar pedido por WhatsApp 📲"
                  ) : (
                    "Pagar con Mercado Pago 💳"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div>
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-xl text-white">Resumen del pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => {
                  const unitPrice = getEffectiveUnitPrice(
                    item.product,
                    item.extras,
                    promoContext
                  );
                  return (
                    <div key={item.id} className="flex gap-3">
                      {item.product.image_url && (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                          <Image
                            src={item.product.image_url}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-white">
                          {item.product.name}
                        </p>
                        {item.extras?.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.extras.map((e) => (
                              <span
                                key={e.addon.id}
                                className="inline-flex items-center rounded-full bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300"
                              >
                                {e.addon.name}
                                {e.quantity > 1 && (
                                  <span className="ml-1 font-bold text-orange-400">
                                    x{e.quantity}
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="mt-1 text-sm text-zinc-400">
                          {item.quantity} × {formatPrice(unitPrice)}
                        </p>
                      </div>
                      <p className="shrink-0 font-bold text-white">
                        {formatPrice(unitPrice * item.quantity)}
                      </p>
                    </div>
                  );
                })}
                <div className="space-y-2 border-t border-zinc-700 pt-4 text-sm">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Delivery</span>
                    <span>
                      {orderType === "pickup"
                        ? <span className="text-green-400 font-semibold">Gratis (retiro)</span>
                        : deliveryCost > 0
                          ? formatPrice(deliveryCost)
                          : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-700 pt-2 text-xl font-black text-white">
                    <span>Total</span>
                    <span className="text-orange-500">{formatPrice(totalWithDelivery)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
