"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, ArrowLeft, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Intentar obtener datos del pedido para WhatsApp
    const pendingOrderData = localStorage.getItem('pending_whatsapp_order');
    
    if (pendingOrderData) {
      try {
        const orderData = JSON.parse(pendingOrderData);
        
        // Generar mensaje de WhatsApp
        let message = `*NUEVO PEDIDO - MERCADO PAGO (PAGADO)*\n\n`;
        message += `*Pedido #${orderData.orderNumber}*\n\n`;
        message += `*Cliente:* ${orderData.customerName}\n`;
        message += `*Telefono:* ${orderData.customerPhone}\n`;
        
        if (orderData.address) {
          message += `*Direccion:* ${orderData.address}\n`;
        }
        if (orderData.betweenStreets) {
          message += `*Entre calles:* ${orderData.betweenStreets}\n`;
        }
        
        // Agregar distancia (necesitamos buscar el label)
        const deliveryRates = [
          { label: "Hasta 950 m", value: "0-950", cost: 600 },
          { label: "De 1 km a 1,4 km", value: "1000-1400", cost: 1400 },
          { label: "De 1,5 km a 2,4 km", value: "1500-2400", cost: 1700 },
          { label: "De 2,5 km a 3,4 km", value: "2500-3400", cost: 2000 },
          { label: "De 3,5 km a 4 km", value: "3500-4000", cost: 2300 },
        ];
        const selectedRate = deliveryRates.find(r => r.value === orderData.deliveryDistance);
        if (selectedRate) {
          message += `*Distancia:* ${selectedRate.label}\n`;
        }
        
        message += `\n*DETALLE DEL PEDIDO:*\n\n`;

        orderData.items.forEach((item: {name: string; quantity: number; totalPrice: number; extras: {addon: {name: string}; quantity: number}[]}, idx: number) => {
          message += `${idx + 1}. *${item.name}* x${item.quantity}\n`;
          if (item.extras && item.extras.length > 0) {
            message += `   Extras: ${item.extras.map(e => `${e.addon.name}${e.quantity > 1 ? ` x${e.quantity}` : ''}`).join(', ')}\n`;
          }
          message += `   Subtotal: ${formatPrice(item.totalPrice * item.quantity)}\n\n`;
        });

        if (orderData.notes) {
          message += `*Notas:* ${orderData.notes}\n\n`;
        }

        message += `Subtotal productos: ${formatPrice(orderData.total)}\n`;
        message += `Costo delivery: ${formatPrice(orderData.deliveryCost)}\n`;
        message += `---------------------------\n`;
        message += `*TOTAL: ${formatPrice(orderData.totalWithDelivery)}*\n`;
        message += `*Metodo: MERCADO PAGO (PAGADO)*\n\n`;
        message += `PAGO YA REALIZADO - Pedido confirmado y pagado con Mercado Pago`;

        // Limpiar localStorage
        localStorage.removeItem('pending_whatsapp_order');

        // Redirigir a WhatsApp despues de 2 segundos
        setTimeout(() => {
          const whatsappNumber = "5491168582586"; // Numero de WhatsApp configurado
          const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
          window.location.href = whatsappUrl;
        }, 2000);
      } catch (error) {
        console.error('Error al procesar datos de WhatsApp:', error);
      }
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

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
              <p className="font-semibold">Redirigiendo a WhatsApp...</p>
            </div>
            <p className="text-sm text-green-300">
              Tu pedido se enviara automaticamente por WhatsApp para coordinar la entrega.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push("/")}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio
            </Button>
            <p className="text-sm text-zinc-500">
              Si no se abre WhatsApp automaticamente, volve al inicio en {countdown} segundos...
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
