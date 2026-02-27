import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import { WHATSAPP_NUMBER, getDeliveryLabel } from "@/lib/constants";

/**
 * GET /api/orders/[orderId]
 * Devuelve solo la URL de WhatsApp para redirigir al cliente post-pago MP.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    if (!orderId) {
      return NextResponse.json({ error: "Falta orderId" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: order, error } = await supabase
      .from("orders")
      .select(`
        order_number,
        customer_name,
        customer_phone,
        customer_address,
        between_streets,
        delivery_distance,
        delivery_cost,
        total_amount,
        notes,
        order_items (
          quantity,
          unit_price,
          products ( name ),
          extras
        )
      `)
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    const items =
      ((order.order_items ?? []) as unknown as Array<{
        quantity: number;
        unit_price: number;
        products: { name: string } | null;
        extras?: Array<{ name: string; quantity: number }>;
      }>) ?? [];

    const deliveryCost = order.delivery_cost ?? 0;
    const subtotal = order.total_amount - deliveryCost;
    const distanceLabel = getDeliveryLabel(order.delivery_distance ?? "");

    let message = `*NUEVO PEDIDO - MERCADO PAGO (PAGADO)*\n\n`;
    message += `*Pedido #${order.order_number ?? "?"}*\n\n`;
    message += `*Cliente:* ${order.customer_name}\n`;
    message += `*Telefono:* ${order.customer_phone}\n`;
    if (order.customer_address) message += `*Direccion:* ${order.customer_address}\n`;
    if (order.between_streets) message += `*Entre calles:* ${order.between_streets}\n`;
    if (distanceLabel) message += `*Distancia:* ${distanceLabel}\n`;
    message += `\n*DETALLE DEL PEDIDO:*\n\n`;

    items.forEach((item, idx) => {
      const lineTotal = item.unit_price * item.quantity;
      message += `${idx + 1}. *${item.products?.name ?? "Producto"}* x${item.quantity}\n`;
      if (item.extras?.length) {
        message += `   Extras: ${item.extras
          .map((e) => `${e.name}${e.quantity > 1 ? ` x${e.quantity}` : ""}`)
          .join(", ")}\n`;
      }
      message += `   Subtotal: ${formatPrice(lineTotal)}\n\n`;
    });

    if (order.notes) message += `*Notas:* ${order.notes}\n\n`;
    message += `Subtotal productos: ${formatPrice(subtotal)}\n`;
    message += `Costo delivery: ${formatPrice(deliveryCost)}\n`;
    message += `---------------------------\n`;
    message += `*TOTAL: ${formatPrice(order.total_amount)}*\n`;
    message += `*Metodo: MERCADO PAGO (PAGADO)*\n\n`;
    message += `PAGO YA REALIZADO - Pedido confirmado y pagado con Mercado Pago`;

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    return NextResponse.json({ whatsappUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return NextResponse.json(
        { error: "Configura SUPABASE_SERVICE_ROLE_KEY" },
        { status: 503 }
      );
    }
    console.error("Error fetching order:", e);
    return NextResponse.json(
      { error: "Error al obtener la orden" },
      { status: 500 }
    );
  }
}
