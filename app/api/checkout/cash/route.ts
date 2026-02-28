import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getDeliveryCost } from "@/lib/constants";

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
  order_type?: "delivery" | "pickup";
};

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutBody = await request.json();
    const {
      customer_name,
      customer_phone,
      customer_address,
      between_streets,
      notes,
      delivery_distance,
      items,
      total_amount,
      order_type = "delivery",
    } = body;

    // Validaciones básicas
    if (!customer_name || !customer_phone || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // ── Validar precios en el servidor ──────────────────────────────────────
    // Consultamos los productos reales desde la DB para evitar manipulación de precios
    const productIds = [...new Set(items.map((i) => i.product_id))];
    const { data: dbProducts, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, price, promo_active, promo_price, promo_only_cash, promo_only_pickup, is_available")
      .in("id", productIds);

    if (productsError || !dbProducts) {
      return NextResponse.json(
        { error: "Error al verificar los productos" },
        { status: 500 }
      );
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // Verificar disponibilidad y recalcular precios
    // Para efectivo + delivery: promo aplica si no es promo_only_pickup
    // Para efectivo + pickup: promo aplica si no es promo_only_cash... pero cash sí aplica
    let serverTotal = 0;
    const validatedItems: OrderItem[] = [];

    for (const item of items) {
      const dbProduct = productMap.get(item.product_id);
      if (!dbProduct) {
        return NextResponse.json(
          { error: `Producto no encontrado: ${item.product_id}` },
          { status: 400 }
        );
      }
      if (!dbProduct.is_available) {
        return NextResponse.json(
          { error: `El producto ya no está disponible` },
          { status: 400 }
        );
      }

      // Precio base con contexto: cash + order_type
      const promoApplies =
        dbProduct.promo_active &&
        dbProduct.promo_price != null &&
        (!dbProduct.promo_only_cash || true) && // cash siempre cumple promo_only_cash
        (!dbProduct.promo_only_pickup || order_type === "pickup");

      const serverBasePrice = promoApplies ? (dbProduct.promo_price as number) : dbProduct.price;

      const extrasTotal = (item.extras ?? []).reduce(
        (sum, e) => sum + e.price * e.quantity,
        0
      );
      const serverUnitPrice = serverBasePrice + extrasTotal;

      serverTotal += serverUnitPrice * item.quantity;
      validatedItems.push({ ...item, unit_price: serverUnitPrice });
    }

    // Costo de delivery validado en servidor (0 si es pickup)
    const serverDeliveryCost =
      order_type === "delivery" && delivery_distance
        ? getDeliveryCost(delivery_distance)
        : 0;
    const serverTotalWithDelivery = serverTotal + serverDeliveryCost;

    // Tolerancia del 1% para diferencias de redondeo entre cliente y servidor
    const tolerance = Math.max(1, total_amount * 0.01);
    if (Math.abs(total_amount - serverTotalWithDelivery) > tolerance) {
      return NextResponse.json(
        {
          error: "El total del pedido no coincide. Por favor, recargá la página e intentá de nuevo.",
          server_total: serverTotalWithDelivery,
          client_total: total_amount,
        },
        { status: 400 }
      );
    }

    // ── Crear la orden en Supabase ──────────────────────────────────────────
    // order_number se genera automáticamente por la secuencia de PostgreSQL
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name,
        customer_phone,
        customer_address,
        between_streets,
        notes,
        delivery_distance: order_type === "delivery" ? delivery_distance : null,
        delivery_cost: serverDeliveryCost,
        total_amount: serverTotalWithDelivery,
        status: "pending",
        payment_id: null, // se asigna después con el número de orden
        payment_method: "cash",
        order_type,
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

    // Asignar payment_id con el número de orden ya generado
    await supabaseAdmin
      .from("orders")
      .update({ payment_id: `EFECTIVO-${order.order_number}` })
      .eq("id", order.id);

    // Crear los items de la orden (con precios validados en servidor)
    const orderItems = validatedItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      extras: item.extras || [],
    }));

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      // Eliminar la orden si falla la creación de items
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "Error al crear los items de la orden", details: itemsError },
        { status: 500 }
      );
    }

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
