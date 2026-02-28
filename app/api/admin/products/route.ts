import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("products")
      .select("id, name, category, price, is_available, is_featured, promo_active, promo_price, promo_only_pickup, promo_only_cash")
      .order("category")
      .order("name");

    if (error) {
      console.error("Error fetching products:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
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
