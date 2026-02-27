"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, ArrowLeft, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { WHATSAPP_NUMBER, getDeliveryLabel } from "@/lib/constants";

function buildWhatsAppMessage(orderData: {
  orderNumber?: number;
  customerName: string;
  customerPhone: string;
  address?: string;
  betweenStreets?: string;
  deliveryDistance?: string;
  notes?: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    extras?: Array<{ name: string; quantity: number }>;
  }>;
  subtotal?: number;
  total?: number;
  deliveryCost: number;
  totalWithDelivery: number;
}): string {
  let message = `*NUEVO PEDIDO - MERCADO PAGO (PAGADO)*\n\n`;
  message += `*Pedido #${orderData.orderNumber ?? "?"}*\n\n`;
  message += `*Cliente:* ${orderData.customerName}\n`;
  message += `*Telefono:* ${orderData.customerPhone}\n`;
  if (orderData.address) message += `*Direccion:* ${orderData.address}\n`;
  if (orderData.betweenStreets) message += `*Entre calles:* ${orderData.betweenStreets}\n`;
  if (orderData.deliveryDistance)
    message += `*Distancia:* ${getDeliveryLabel(orderData.deliveryDistance)}\n`;
  message += `\n*DETALLE DEL PEDIDO:*\n\n`;

  orderData.items.forEach((item, idx) => {
    const lineTotal = item.unitPrice * item.quantity;
    message += `${idx + 1}. *${item.name}* x${item.quantity}\n`;
    if (item.extras?.length) {
      message += `   Extras: ${item.extras
        .map((e) => `${e.name}${e.quantity > 1 ? ` x${e.quantity}` : ""}`)
        .join(", ")}\n`;
    }
    message += `   Subtotal: ${formatPrice(lineTotal)}\n\n`;
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
          items: orderData.items.map(
            (item: {
              name: string;
              quantity: number;
              totalPrice: number;
              extras?: Array<{ addon: { name: string }; quantity: number }>;
            }) => ({
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.totalPrice,
              extras:
                item.extras?.map((e) => ({ name: e.addon.name, quantity: e.quantity })) ?? [],
            })
          ),
        });
        redirectToWhatsApp(
          `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
        );
        return;
      } catch (e) {
        console.error("Error al procesar pending_whatsapp_order:", e);
      }
    }

    if (orderId) {
      fetch(`/api/orders/${orderId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.whatsappUrl && !whatsappRedirectDone.current) {
            redirectToWhatsApp(data.whatsappUrl);
          } else if (!whatsappRedirectDone.current) {
            const fallbackMsg = `Hola, acabo de hacer un pedido por Mercado Pago (pago confirmado). Número de orden: ${orderId}. ¿Pueden confirmar?`;
            setWhatsappUrl(
              `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(fallbackMsg)}`
            );
          }
        })
        .catch(() => {
          if (!whatsappRedirectDone.current) {
            const fallbackMsg = `Hola, acabo de hacer un pedido por Mercado Pago (pago confirmado). Número de orden: ${orderId}. ¿Pueden confirmar?`;
            setWhatsappUrl(
              `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(fallbackMsg)}`
            );
          }
        });
    }
  }, [orderId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (countdown === 0) {
      const id = setTimeout(() => router.push("/"), 0);
      return () => clearTimeout(id);
    }
  }, [countdown, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md">
        <Card className="border-zinc-800 bg-zinc-900/50 text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-600/20">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <CardTitle className="text-3xl font-black text-white">
              ¡Pedido confirmado!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-zinc-400">
              Tu pago fue procesado correctamente. Redirigiendo a WhatsApp para notificar al local…
            </p>

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700"
              >
                <MessageCircle className="h-4 w-4" />
                Abrir WhatsApp manualmente
              </a>
            )}

            <p className="text-sm text-zinc-500">
              Volviendo al menú en {countdown} segundo{countdown !== 1 ? "s" : ""}…
            </p>

            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full border-zinc-700 text-zinc-300 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al menú ahora
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
          <p className="text-zinc-400">Cargando…</p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
