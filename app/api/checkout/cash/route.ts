import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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
  notes?: string;
  delivery_distance?: string;
  delivery_cost?: number;
  items: OrderItem[];
  total_amount: number;
};

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutBody = await request.json();
    const { customer_name, customer_phone, customer_address, notes, delivery_distance, delivery_cost, items, total_amount } = body;

    console.log("Cash checkout request:", { customer_name, customer_phone, items_count: items.length, total_amount, delivery_cost });

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

    // 2. Crear la orden en Supabase con status "pending" (pago en efectivo)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: nextOrderNumber,
        customer_name,
        customer_phone,
        customer_address,
        notes,
        delivery_distance,
        delivery_cost: delivery_cost || 0,
        total_amount,
        status: "pending", // Pendiente hasta que confirmen el pago
        payment_id: `EFECTIVO-${nextOrderNumber}`,
        payment_method: "cash", // Método de pago
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

    console.log("Order items created successfully");

    return NextResponse.json({
      order_id: order.id,
      order_number: order.order_number,
      payment_method: "cash",
      status: "pending",
      message: "Orden creada exitosamente para pago en efectivo/transferencia",
    });
  } catch (error) {
    console.error("Error in cash checkout:", error);
    return NextResponse.json(
      { error: "Error al procesar el pedido", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
