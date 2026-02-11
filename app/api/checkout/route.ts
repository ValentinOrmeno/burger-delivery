import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { MercadoPagoConfig, Preference } from "mercadopago";

// Configurar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

type Extra = {
  addon_id: string;
  name: string;
  price: number;
  quantity: number;
};

type OrderItem = {
  product_id: string;
  quantity: number;
  unit_price: number;
  extras?: Extra[];
};

type CheckoutBody = {
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  between_streets?: string;
  notes?: string;
  delivery_distance?: string;
  delivery_cost?: number;
  items: OrderItem[];
  total_amount: number;
};

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutBody = await request.json();
    const { customer_name, customer_phone, customer_address, between_streets, notes, delivery_distance, delivery_cost, items, total_amount } = body;

    console.log("Checkout request:", { customer_name, customer_phone, items_count: items.length, total_amount, delivery_cost });

    // Validaciones
    if (!customer_name || !customer_phone || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    // 1. Obtener el último número de orden para generar uno secuencial
    const { data: lastOrder } = await supabase
      .from("orders")
      .select("order_number")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const nextOrderNumber = lastOrder?.order_number ? lastOrder.order_number + 1 : 1;

    // 2. Crear la orden en Supabase
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: nextOrderNumber,
        customer_name,
        customer_phone,
        customer_address,
        between_streets,
        notes,
        delivery_distance,
        delivery_cost: delivery_cost || 0,
        total_amount,
        status: "pending",
        payment_method: "mercadopago",
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Error creating order:", orderError);
      return NextResponse.json(
        { error: "Error al crear la orden", details: orderError },
        { status: 500 }
      );
    }

    console.log("Order created:", order.id);

    // 2. Crear los items de la orden (incluyendo extras)
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      extras: item.extras || [],
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      // Eliminar la orden si falla la creación de items
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "Error al crear los items de la orden", details: itemsError },
        { status: 500 }
      );
    }

    console.log("Order items created");

    // 3. Verificar si Mercado Pago está configurado
    const isMPConfigured = process.env.MP_ACCESS_TOKEN && 
                           !process.env.MP_ACCESS_TOKEN.includes("tu-access-token");

    if (!isMPConfigured) {
      // Modo DEMO: Simular pago aprobado automáticamente
      console.log("Mercado Pago no configurado - Modo DEMO activado");
      
      await supabase
        .from("orders")
        .update({ 
          status: "paid",
          payment_id: `MP-DEMO-${order.order_number}`
        })
        .eq("id", order.id);

      return NextResponse.json({
        order_id: order.id,
        order_number: order.order_number,
        demo_mode: true,
        message: "Orden creada en modo DEMO (pago automático)",
      });
    }

    // 3. Crear preferencia de Mercado Pago (solo si está configurado)
    const preference = new Preference(client);
    
    const response = await preference.create({
      body: {
        items: items.map((item) => ({
          id: item.product_id,
          title: `Producto ID: ${item.product_id}`,
          unit_price: Number(item.unit_price),
          quantity: Number(item.quantity),
        })),
        payer: {
          name: customer_name,
          phone: {
            number: customer_phone,
          },
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/success?order_id=${order.id}`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/failure`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/pending`,
        },
        auto_return: "approved" as const,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
        external_reference: order.id,
        statement_descriptor: "BURGER PREMIUM",
      },
    });

    // 4. Actualizar la orden con el ID de Mercado Pago
    await supabase
      .from("orders")
      .update({ payment_id: response.id })
      .eq("id", order.id);

    return NextResponse.json({
      order_id: order.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
    });
  } catch (error) {
    console.error("Error in checkout:", error);
    return NextResponse.json(
      { error: "Error al procesar el pedido", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
