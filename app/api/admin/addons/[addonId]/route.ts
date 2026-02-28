import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// PATCH /api/admin/addons/[addonId] — toggle is_available
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ addonId: string }> }
) {
  try {
    const { addonId } = await params;
    const body = await request.json();

    if (typeof body.is_available !== "boolean") {
      return NextResponse.json(
        { error: "is_available debe ser boolean" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("addons")
      .update({ is_available: body.is_available })
      .eq("id", addonId)
      .select("id, name, is_available")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
