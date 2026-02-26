"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, ArrowLeft, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

const WHATSAPP_NUMBER = "5491168582586";

const deliveryRates = [
  { label: "Hasta 950 m", value: "0-950" },
  { label: "De 1 km a 1,4 km", value: "1000-1400" },
  { label: "De 1,5 km a 2,4 km", value: "1500-2400" },
  { label: "De 2,5 km a 3,4 km", value: "2500-3400" },
  { label: "De 3,5 km a 4 km", value: "3500-4000" },
];

function buildWhatsAppMessage(orderData: {
  orderNumber?: number;
  customerName: string;
  customerPhone: string;
  address?: string;
  betweenStreets?: string;
  deliveryDistance?: string;
  notes?: string;
  items: Array<{ name: string; quantity: number; totalPrice?: number; unitPrice: number; extras?: Array<{ name: string; quantity: number }> }>;
  total?: number;
  subtotal?: number;
  deliveryCost: number;
  totalWithDelivery: number;
}): string {
  let message = `*NUEVO PEDIDO - MERCADO PAGO (PAGADO)*\n\n`;
  message += `*Pedido #${orderData.orderNumber ?? "?"}*\n\n`;
  message += `*Cliente:* ${orderData.customerName}\n`;
  message += `*Telefono:* ${orderData.customerPhone}\n`;
  if (orderData.address) message += `*Direccion:* ${orderData.address}\n`;
  if (orderData.betweenStreets) message += `*Entre calles:* ${orderData.betweenStreets}\n`;
  const rate = deliveryRates.find((r) => r.value === orderData.deliveryDistance);
  if (rate) message += `*Distancia:* ${rate.label}\n`;
  message += `\n*DETALLE DEL PEDIDO:*\n\n`;
  orderData.items.forEach((item, idx) => {
    const total = (item.unitPrice ?? item.totalPrice ?? 0) * item.quantity;
    message += `${idx + 1}. *${item.name}* x${item.quantity}\n`;
    if (item.extras?.length) {
      message += `   Extras: ${item.extras.map((e) => `${e.name}${e.quantity > 1 ? ` x${e.quantity}` : ""}`).join(", ")}\n`;
    }
    message += `   Subtotal: ${formatPrice(total)}\n\n`;
  });
  if (orderData.notes) message += `*Notas:* ${orderData.notes}\n\n`;
  message += `Subtotal productos: ${formatPrice(orderData.subtotal ?? orderData.total ?? 0)}\n`;
  message += `Costo delivery: ${formatPrice(orderData.deliveryCost)}\n`;
  message += `---------------------------\n`;
  message += `*TOTAL: ${formatPrice(orderData.totalWithDelivery)}*\n`;
  message += `*Metodo: MERCADO PAGO (PAGADO)*\n\n`;
  message += `PAGO YA REALIZADO - Pedido confirmado y pagado con Mercado Pago`;
  return message;
}

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [countdown, setCountdown] = useState(5);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const whatsappRedirectDone = useRef(false);

  useEffect(() => {
    if (whatsappRedirectDone.current) return;

    const redirectToWhatsApp = (url: string) => {
      whatsappRedirectDone.current = true;
      setWhatsappUrl(url);
      setTimeout(() => {
        window.location.href = url;
      }, 1000);
    };

    const pendingOrderData = localStorage.getItem("pending_whatsapp_order");
    if (pendingOrderData) {
      try {
        const orderData = JSON.parse(pendingOrderData);
        localStorage.removeItem("pending_whatsapp_order");
        const message = buildWhatsAppMessage({
          ...orderData,
          deliveryCost: orderData.deliveryCost ?? 0,
          totalWithDelivery: orderData.totalWithDelivery,
          items: orderData.items.map((item: { name: string; quantity: number; totalPrice: number; extras?: Array<{ addon: { name: string }; quantity: number }> }) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.totalPrice,
            extras: item.extras?.map((e: { addon: { name: string }; quantity: number }) => ({ name: e.addon.name, quantity: e.quantity })) ?? [],
          })),
        });
        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        redirectToWhatsApp(url);
        return;
      } catch (e) {
        console.error("Error al procesar pending_whatsapp_order:", e);
      }
    }

    if (orderId) {
      fetch(`/api/orders/${orderId}`)
        .then((res) => {
          if (!res.ok) return null;
          return res.json();
        })
        .then((data) => {
          if (data?.whatsappUrl && !whatsappRedirectDone.current) {
            redirectToWhatsApp(data.whatsappUrl);
          } else if (!whatsappRedirectDone.current) {
            // Fallback: si la API falla (ej. falta SUPABASE_SERVICE_ROLE_KEY), mostrar botón con mensaje genérico
            const fallbackMsg = `Hola, acabo de hacer un pedido por Mercado Pago (pago confirmado). Número de orden: ${orderId}. ¿Pueden confirmar?`;
            setWhatsappUrl(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(fallbackMsg)}`);
          }
        })
        .catch((e) => {
          console.error("Error al cargar orden para WhatsApp:", e);
          if (!whatsappRedirectDone.current) {
            const fallbackMsg = `Hola, acabo de hacer un pedido por Mercado Pago (pago confirmado). Número de orden: ${orderId}. ¿Pueden confirmar?`;
            setWhatsappUrl(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(fallbackMsg)}`);
          }
        });
    }

    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [orderId]);

  // Redirigir cuando el countdown llega a 0 (diferido para no actualizar Router durante render)
  useEffect(() => {
    if (countdown === 0) {
      const id = setTimeout(() => router.push("/"), 0);
      return () => clearTimeout(id);
    }
  }, [countdown, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/50 text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-600/20">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-3xl text-white">
            ¡Pago Exitoso!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-zinc-300">
              Tu pedido ha sido confirmado y está siendo preparado.
            </p>
            {orderId && (
              <p className="text-sm text-zinc-500">
                Número de orden: <span className="font-mono text-orange-500">{orderId}</span>
              </p>
            )}
          </div>

          <div className="rounded-lg border border-green-600/50 bg-green-600/10 p-4">
            <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
              <MessageCircle className="h-5 w-5" />
              <p className="font-semibold">
                {whatsappUrl ? "Abrí WhatsApp para enviar tu pedido" : "Preparando enlace a WhatsApp..."}
              </p>
            </div>
            <p className="text-sm text-green-300">
              Tu pedido se envia por WhatsApp para coordinar la entrega.
            </p>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-4 font-bold text-white transition-colors hover:bg-green-500"
              >
                <MessageCircle className="h-5 w-5" />
                Abrir WhatsApp ahora
              </a>
            )}
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full border-zinc-600"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio
            </Button>
            <p className="text-sm text-zinc-500">
              Volves al inicio en {countdown} segundos...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-zinc-400">Cargando...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
