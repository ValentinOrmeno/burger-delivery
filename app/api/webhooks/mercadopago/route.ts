import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { MercadoPagoConfig, Payment } from "mercadopago";

// Configurar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Webhook received:", body);

    // Mercado Pago envía diferentes tipos de notificaciones
    if (body.type === "payment") {
      const paymentId = body.data.id;

      // Obtener información del pago
      const paymentClient = new Payment(client);
      const paymentData = await paymentClient.get({ id: paymentId });

      console.log("Payment data:", paymentData);

      // Obtener el ID de la orden desde external_reference
      const orderId = paymentData.external_reference;

      if (!orderId) {
        console.error("No order ID found in payment");
        return NextResponse.json({ error: "No order ID" }, { status: 400 });
      }

      // Actualizar el estado de la orden según el estado del pago
      let orderStatus: string;
      switch (paymentData.status) {
        case "approved":
          orderStatus = "paid";
          break;
        case "rejected":
        case "cancelled":
          orderStatus = "cancelled";
          break;
        case "pending":
        case "in_process":
          orderStatus = "pending";
          break;
        default:
          orderStatus = "pending";
      }

      // Actualizar la orden en Supabase
      const { error } = await supabase
        .from("orders")
        .update({
          status: orderStatus,
          payment_status: paymentData.status,
          payment_id: paymentData.id?.toString() || "",
        })
        .eq("id", orderId);

      if (error) {
        console.error("Error updating order:", error);
        return NextResponse.json(
          { error: "Error updating order" },
          { status: 500 }
        );
      }

      console.log(`Order ${orderId} updated to status: ${orderStatus}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Error processing webhook" },
      { status: 500 }
    );
  }
}
