"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Banknote, MessageCircle, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import { toast } from "sonner";

type PaymentMethod = "cash" | "mercadopago";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mercadopago");
  const [distanceCalculated, setDistanceCalculated] = useState(false);
  const [distanceInfo, setDistanceInfo] = useState<{
    distance_km: number;
    distance_text: string;
    duration_text: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
    delivery_distance: "",
  });

  // Tarifas de delivery según distancia
  const deliveryRates = [
    { label: "Hasta 950 m", value: "0-950", cost: 600 },
    { label: "De 1 km a 1,4 km", value: "1000-1400", cost: 1400 },
    { label: "De 1,5 km a 2,4 km", value: "1500-2400", cost: 1700 },
    { label: "De 2,5 km a 3,4 km", value: "2500-3400", cost: 2000 },
    { label: "De 3,5 km a 4 km", value: "3500-4000", cost: 2300 },
  ];

  const total = getTotal();

  const getDeliveryCost = () => {
    if (!formData.delivery_distance) return 0;
    const rate = deliveryRates.find(r => r.value === formData.delivery_distance);
    return rate ? rate.cost : 0;
  };

  const deliveryCost = getDeliveryCost();
  const totalWithDelivery = total + deliveryCost;

  // Función para usar GPS del navegador
  const useMyLocation = async () => {
    if (!formData.address || formData.address.trim().length < 5) {
      toast.error("Por favor ingresa tu direccion completa antes de usar el GPS");
      return;
    }

    setIsCalculatingDistance(true);
    setDistanceCalculated(false);

    // Verificar si el navegador soporta geolocalización
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización");
      setIsCalculatingDistance(false);
      return;
    }

    // Pedir ubicación al usuario
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        console.log("GPS obtenido:", { latitude, longitude });

        try {
          const response = await fetch("/api/calculate-distance", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              latitude,
              longitude,
            }),
          });

          const data = await response.json();

          if (!data.success) {
            toast.error(data.error || "No se pudo calcular la distancia");
            setDistanceCalculated(false);
            setIsCalculatingDistance(false);
            return;
          }

          // Guardar info de distancia
          setDistanceInfo({
            distance_km: data.distance_km,
            distance_text: data.distance_text,
            duration_text: data.duration_text,
          });

          // Auto-seleccionar el rango de delivery
          setFormData({
            ...formData,
            delivery_distance: data.delivery_range,
          });

          setDistanceCalculated(true);
          setIsCalculatingDistance(false);
          
          toast.success(
            `📍 Ubicación detectada: ${data.distance_text} del local | Delivery: ${formatPrice(data.delivery_cost)}`,
            { duration: 5000 }
          );
        } catch (error) {
          console.error("Error:", error);
          toast.error("Error al calcular la distancia");
          setDistanceCalculated(false);
          setIsCalculatingDistance(false);
        }
      },
      (error) => {
        console.error("Error de geolocalización:", error);
        let errorMessage = "No se pudo obtener tu ubicación";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Debes permitir el acceso a tu ubicación para calcular el delivery";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Tu ubicación no está disponible. Verificá que tengas el GPS activado";
            break;
          case error.TIMEOUT:
            errorMessage = "Se agotó el tiempo esperando tu ubicación. Intentá de nuevo";
            break;
        }
        
        toast.error(errorMessage);
        setDistanceCalculated(false);
        setIsCalculatingDistance(false);
      },
      {
        enableHighAccuracy: true, // Usar GPS de alta precisión
        timeout: 10000, // 10 segundos
        maximumAge: 0, // No usar ubicación en caché
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.address) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    if (!formData.delivery_distance) {
      toast.error("Por favor seleccioná tu distancia aproximada o usá el GPS");
      return;
    }

    if (items.length === 0) {
      toast.error("Tu carrito está vacío");
      return;
    }

    setIsLoading(true);

    try {
      // Si el método de pago es efectivo, manejar vía WhatsApp
      if (paymentMethod === "cash") {
        // Crear orden en Supabase (sin MP)
        const response = await fetch("/api/checkout/cash", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer_name: formData.name,
            customer_phone: formData.phone,
            customer_address: formData.address,
            notes: formData.notes,
            delivery_distance: formData.delivery_distance,
            delivery_cost: deliveryCost,
            items: items.map((item) => ({
              product_id: item.product.id,
              quantity: item.quantity,
              unit_price: item.totalPrice,
              extras: item.extras.map((extra) => ({
                addon_id: extra.addon.id,
                name: extra.addon.name,
                price: extra.addon.price,
                quantity: extra.quantity,
              })),
            })),
            total_amount: totalWithDelivery,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al crear el pedido");
        }

        // Formatear mensaje para WhatsApp
        const selectedRate = deliveryRates.find(r => r.value === formData.delivery_distance);
        
        let message = `🍔 *NUEVO PEDIDO - EFECTIVO/TRANSFERENCIA*\n\n`;
        message += `📋 *Pedido #${data.order_number}*\n\n`;
        message += `👤 *Cliente:* ${formData.name}\n`;
        message += `📞 *Teléfono:* ${formData.phone}\n`;
        if (formData.address) {
          message += `📍 *Dirección:* ${formData.address}\n`;
        }
        message += `🚚 *Distancia:* ${selectedRate?.label}\n`;
        message += `\n*DETALLE DEL PEDIDO:*\n\n`;

        items.forEach((item, idx) => {
          message += `${idx + 1}. *${item.product.name}* x${item.quantity}\n`;
          if (item.extras && item.extras.length > 0) {
            message += `   Extras: ${item.extras.map(e => `${e.addon.name}${e.quantity > 1 ? ` x${e.quantity}` : ''}`).join(', ')}\n`;
          }
          message += `   Subtotal: ${formatPrice(item.totalPrice * item.quantity)}\n\n`;
        });

        if (formData.notes) {
          message += `📝 *Notas:* ${formData.notes}\n\n`;
        }

        message += `💵 Subtotal productos: ${formatPrice(total)}\n`;
        message += `🚚 Costo delivery: ${formatPrice(deliveryCost)}\n`;
        message += `━━━━━━━━━━━━━━━━━━\n`;
        message += `💰 *TOTAL A PAGAR: ${formatPrice(totalWithDelivery)}*\n`;
        message += `💳 *Método: Efectivo o Transferencia*\n\n`;
        message += `✅ Pedido confirmado. Te contactaremos pronto!`;

        // Número de WhatsApp del negocio (CAMBIAR POR EL TUYO)
        const whatsappNumber = "5491112345678"; // TODO: Reemplazar con tu número
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

        // Limpiar carrito y redirigir a WhatsApp
        clearCart();
        toast.success("¡Pedido creado! Redirigiendo a WhatsApp...");
        
        // Pequeño delay para que se vea el toast
        setTimeout(() => {
          window.location.href = whatsappUrl;
        }, 1500);
        
        return;
      }

      // Método Mercado Pago (flujo original)
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: formData.name,
          customer_phone: formData.phone,
          customer_address: formData.address,
          notes: formData.notes,
          delivery_distance: formData.delivery_distance,
          delivery_cost: deliveryCost,
          items: items.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            unit_price: item.totalPrice,
            extras: item.extras.map((extra) => ({
              addon_id: extra.addon.id,
              name: extra.addon.name,
              price: extra.addon.price,
              quantity: extra.quantity,
            })),
          })),
          total_amount: totalWithDelivery,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Checkout error:", data);
        throw new Error(data.error || "Error al procesar el pedido");
      }

      // Modo DEMO (sin Mercado Pago configurado)
      if (data.demo_mode) {
        clearCart();
        toast.success("¡Pedido creado en modo DEMO! (pago automático)");
        router.push(`/success?order_id=${data.order_id}`);
        return;
      }

      // Redirigir a Mercado Pago
      if (data.init_point) {
        clearCart();
        window.location.href = data.init_point;
      } else {
        throw new Error("No se recibió el link de pago");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Error al procesar el pedido");
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6">
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-bold text-white">
            Tu carrito está vacío
          </h1>
          <p className="mb-8 text-zinc-400">
            Agrega productos al carrito para continuar
          </p>
          <Button
            onClick={() => router.push("/")}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al menú
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-12">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-4 text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al menú
          </Button>
          <h1 className="text-4xl font-black text-white">Finalizar Pedido</h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Formulario */}
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-2xl text-white">
                Información de entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Juan Pérez"
                    required
                    className="border-zinc-700 bg-zinc-800 text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+54 9 11 1234-5678"
                    required
                    className="border-zinc-700 bg-zinc-800 text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    Dirección de entrega <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.address}
                    onChange={(e) => {
                      setFormData({ ...formData, address: e.target.value });
                      // Resetear cálculo si cambia la dirección
                      if (distanceCalculated) {
                        setDistanceCalculated(false);
                        setDistanceInfo(null);
                        setFormData({ ...formData, address: e.target.value, delivery_distance: "" });
                      }
                    }}
                    placeholder="Ej: Av. Corrientes 1234, Buenos Aires"
                    required
                    className="border-zinc-700 bg-zinc-800 text-white"
                  />
                  
                  {/* Botón para calcular con GPS */}
                  <Button
                    type="button"
                    onClick={useMyLocation}
                    disabled={isCalculatingDistance || !formData.address || formData.address.trim().length < 5}
                    className="mt-3 w-full bg-blue-600 font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCalculatingDistance ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Calculando distancia...
                      </>
                    ) : (
                      <>
                        <MapPin className="mr-2 h-4 w-4" />
                        📍 Calcular con mi ubicacion GPS
                      </>
                    )}
                  </Button>
                  
                  {/* Info de distancia calculada */}
                  {distanceCalculated && distanceInfo && (
                    <div className="mt-3 rounded-lg border border-green-600 bg-green-600/10 p-4 text-sm">
                      <div className="flex items-center gap-2 text-green-400">
                        <MapPin className="h-5 w-5" />
                        <p className="font-bold text-base">
                          ✓ Distancia: {distanceInfo.distance_text} del local
                        </p>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-green-300">
                        <p>⏱️ Tiempo estimado: {distanceInfo.duration_text}</p>
                        <p className="font-bold">🚚 Delivery: {formatPrice(deliveryCost)}</p>
                      </div>
                    </div>
                  )}
                  
                  <p className="mt-2 text-xs text-zinc-500">
                    💡 Completa tu direccion primero, luego usa el GPS para calcular automaticamente (bloquea la seleccion manual)
                  </p>
                </div>

                {/* Selector MANUAL de distancia (alternativa al GPS) */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    Distancia aproximada <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.delivery_distance}
                    onChange={(e) => {
                      setFormData({ ...formData, delivery_distance: e.target.value });
                      if (e.target.value) {
                        setDistanceCalculated(true);
                        const rate = deliveryRates.find(r => r.value === e.target.value);
                        if (rate) {
                          setDistanceInfo({
                            distance_km: 0,
                            distance_text: rate.label,
                            duration_text: "Estimado",
                          });
                        }
                      }
                    }}
                    required
                    disabled={isCalculatingDistance || (distanceCalculated && !!distanceInfo?.distance_km && distanceInfo.distance_km > 0)}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-600"
                  >
                    <option value="">Selecciona tu distancia aproximada</option>
                    {deliveryRates.map((rate) => (
                      <option key={rate.value} value={rate.value}>
                        {rate.label} - {formatPrice(rate.cost)}
                      </option>
                    ))}
                  </select>
                  {/* Mostrar aviso cuando GPS bloqueó el campo manual */}
                  {distanceCalculated && distanceInfo?.distance_km && distanceInfo.distance_km > 0 && (
                    <p className="mt-2 text-xs text-green-500">
                      🔒 Distancia calculada con GPS. No se puede modificar manualmente.
                    </p>
                  )}
                  {deliveryCost > 0 && !distanceInfo?.distance_km && (
                    <p className="mt-2 text-sm text-orange-500">
                      🚚 Costo de delivery: {formatPrice(deliveryCost)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    Notas adicionales
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Sin cebolla, extra salsa, etc."
                    rows={3}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-600"
                  />
                </div>

                {/* Selector de método de pago */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-zinc-300">
                    Método de pago <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Opción Mercado Pago */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("mercadopago")}
                      className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-all ${
                        paymentMethod === "mercadopago"
                          ? "border-orange-600 bg-orange-600/10"
                          : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                      }`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        paymentMethod === "mercadopago" ? "bg-orange-600" : "bg-zinc-700"
                      }`}>
                        <CreditCard className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-white">Mercado Pago</p>
                        <p className="text-xs text-zinc-400">Tarjeta o débito</p>
                      </div>
                    </button>

                    {/* Opción Efectivo/Transferencia */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cash")}
                      className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-all ${
                        paymentMethod === "cash"
                          ? "border-green-600 bg-green-600/10"
                          : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                      }`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        paymentMethod === "cash" ? "bg-green-600" : "bg-zinc-700"
                      }`}>
                        <Banknote className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-white">Efectivo/Transferencia</p>
                        <p className="text-xs text-zinc-400">Pago en entrega o transferencia</p>
                      </div>
                    </button>
                  </div>

                  {/* Info adicional según método */}
                  {paymentMethod === "cash" && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-green-600/10 p-3 text-sm text-green-400">
                      <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>
                        Tu pedido se enviará vía WhatsApp para coordinar el pago en efectivo o transferencia
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-6 text-lg font-bold ${
                    paymentMethod === "cash"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-orange-600 hover:bg-orange-700"
                  }`}
                >
                  {isLoading ? (
                    "Procesando..."
                  ) : paymentMethod === "cash" ? (
                    <>
                      <MessageCircle className="mr-2 h-5 w-5" />
                      Enviar pedido por WhatsApp
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      Pagar {formatPrice(totalWithDelivery)} con Mercado Pago
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Resumen del pedido */}
          <div className="space-y-6">
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-2xl text-white">
                  Resumen del pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 rounded-lg border border-zinc-800 bg-zinc-800/50 p-4"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md">
                      <Image
                        src={item.product.image_url}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">
                        {item.product.name}
                      </h4>
                      {/* Mostrar extras */}
                      {item.extras && item.extras.length > 0 && (
                        <p className="text-xs text-zinc-400">
                          {item.extras.map((extra, idx) => (
                            <span key={idx}>
                              {extra.addon.name}
                              {extra.quantity > 1 && ` x${extra.quantity}`}
                              {idx < item.extras.length - 1 && ', '}
                            </span>
                          ))}
                        </p>
                      )}
                      <p className="text-sm text-zinc-400">
                        {item.quantity} x {formatPrice(item.totalPrice)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-500">
                        {formatPrice(item.totalPrice * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="space-y-2 border-t border-zinc-700 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Subtotal productos:</span>
                    <span className="text-zinc-300">{formatPrice(total)}</span>
                  </div>
                  {deliveryCost > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Delivery:</span>
                      <span className="text-zinc-300">{formatPrice(deliveryCost)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-zinc-700 pt-2 text-2xl font-bold">
                    <span className="text-zinc-300">Total:</span>
                    <span className="text-orange-500">{formatPrice(totalWithDelivery)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
              <h3 className="mb-4 font-semibold text-white">
                💳 Métodos de pago disponibles
              </h3>
              
              {/* Mercado Pago */}
              <div className="mb-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-orange-500">
                  <CreditCard className="h-4 w-4" />
                  Mercado Pago
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Visa", "Mastercard", "American Express", "Débito", "Crédito"].map(
                    (method) => (
                      <div
                        key={method}
                        className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300"
                      >
                        {method}
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Efectivo/Transferencia */}
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-500">
                  <Banknote className="h-4 w-4" />
                  Efectivo/Transferencia
                </p>
                <p className="text-xs text-zinc-400">
                  Pago en efectivo al recibir o transferencia bancaria. Coordinación vía WhatsApp.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
