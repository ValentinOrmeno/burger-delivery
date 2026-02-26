import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    if (!orderId) {
      return NextResponse.json(
        { error: "Falta orderId" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { error: errItems } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", orderId);

    if (errItems) {
      console.error("Error deleting order_items:", errItems);
      return NextResponse.json(
        { error: "Error al eliminar items de la orden" },
        { status: 500 }
      );
    }

    const { error: errOrder } = await supabase
      .from("orders")
      .delete()
      .eq("id", orderId);

    if (errOrder) {
      console.error("Error deleting order:", errOrder);
      return NextResponse.json(
        { error: "Error al eliminar la orden" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return NextResponse.json(
        { error: "Configura SUPABASE_SERVICE_ROLE_KEY en .env.local" },
        { status: 503 }
      );
    }
    console.error("Delete order error:", e);
    return NextResponse.json(
      { error: "Error al eliminar la orden" },
      { status: 500 }
    );
  }
}
