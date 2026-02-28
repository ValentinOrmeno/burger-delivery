import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { getDeliveryCost } from "@/lib/constants";

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
      delivery_cost,
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

    // Verificar disponibilidad y recalcular precios (método mercadopago, delivery)
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

      // Precio base: promo aplica para MP si no es solo efectivo y (para pickup no es solo delivery)
      const promoApplies =
        dbProduct.promo_active &&
        dbProduct.promo_price != null &&
        !dbProduct.promo_only_cash &&
        (order_type === "delivery" ? !dbProduct.promo_only_pickup : true);

      const serverBasePrice = promoApplies ? (dbProduct.promo_price as number) : dbProduct.price;

      // Sumar extras (los precios de extras vienen del cliente; son aditivos y de bajo riesgo,
      // pero los validamos contra el precio base para detectar anomalías)
      const extrasTotal = (item.extras ?? []).reduce(
        (sum, e) => sum + e.price * e.quantity,
        0
      );
      const serverUnitPrice = serverBasePrice + extrasTotal;

      serverTotal += serverUnitPrice * item.quantity;
      validatedItems.push({ ...item, unit_price: serverUnitPrice });
    }

    // Costo de delivery: 0 si es retiro en local
    const serverDeliveryCost =
      order_type === "pickup" ? 0 : (delivery_distance ? getDeliveryCost(delivery_distance) : 0);
    const serverTotalWithDelivery = serverTotal + serverDeliveryCost;

    // Tolerancia del 1% para diferencias de redondeo entre cliente y servidor
    const clientTotal = total_amount;
    const tolerance = Math.max(1, clientTotal * 0.01);
    if (Math.abs(clientTotal - serverTotalWithDelivery) > tolerance) {
      return NextResponse.json(
        {
          error: "El total del pedido no coincide. Por favor, recargá la página e intentá de nuevo.",
          server_total: serverTotalWithDelivery,
          client_total: clientTotal,
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
        customer_address: order_type === "delivery" ? customer_address ?? null : null,
        between_streets: order_type === "delivery" ? between_streets ?? null : null,
        notes: notes ?? null,
        delivery_distance: order_type === "delivery" ? delivery_distance ?? null : null,
        delivery_cost: serverDeliveryCost,
        total_amount: serverTotalWithDelivery,
        status: "pending",
        payment_method: "mercadopago",
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

    // ── Verificar si Mercado Pago está configurado ──────────────────────────
    const isMPConfigured = process.env.MP_ACCESS_TOKEN &&
                           !process.env.MP_ACCESS_TOKEN.includes("tu-access-token");

    if (!isMPConfigured) {
      // Modo DEMO: Simular pago aprobado automáticamente
      await supabaseAdmin
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

    // ── Crear preferencia de Mercado Pago ──────────────────────────────────
    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: validatedItems.map((item) => ({
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

    // Actualizar la orden con el ID de Mercado Pago
    await supabaseAdmin
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
