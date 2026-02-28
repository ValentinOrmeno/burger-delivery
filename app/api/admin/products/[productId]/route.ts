import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

type PromoBody = {
  promo_active?: boolean;
  promo_price?: number | null;
  promo_only_pickup?: boolean;
  promo_only_cash?: boolean;
  is_featured?: boolean;
  is_available?: boolean;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    if (!productId) {
      return NextResponse.json(
        { error: "Falta productId" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as PromoBody;
    const updates: Record<string, unknown> = {};
    if (typeof body.promo_active === "boolean") updates.promo_active = body.promo_active;
    if (body.promo_price !== undefined) updates.promo_price = body.promo_price;
    if (typeof body.promo_only_pickup === "boolean") updates.promo_only_pickup = body.promo_only_pickup;
    if (typeof body.promo_only_cash === "boolean") updates.promo_only_cash = body.promo_only_cash;
    if (typeof body.is_featured === "boolean") updates.is_featured = body.is_featured;
    if (typeof body.is_available === "boolean") updates.is_available = body.is_available;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No hay campos para actualizar" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("products")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", productId)
      .select()
      .single();

    if (error) {
      console.error("Error updating product:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return NextResponse.json(
        { error: "Configura SUPABASE_SERVICE_ROLE_KEY en .env.local" },
        { status: 503 }
      );
    }
    throw e;
  }
}
