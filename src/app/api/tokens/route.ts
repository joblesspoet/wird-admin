import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

// Public endpoint - no auth required.
// Mobile app registers its Expo push token here.
// POST /api/tokens { token, platform, app_version }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = String(body?.token || "").trim();
    const platform = String(body?.platform || "").trim();
    const appVersion = String(body?.app_version || "").trim() || null;

    if (!token) {
      return NextResponse.json(
        { error: "token is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("push_tokens")
      .upsert(
        {
          token,
          platform: platform || null,
          app_version: appVersion,
          last_active: new Date().toISOString(),
        },
        { onConflict: "token" }
      )
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error) {
    console.error("Token registration error:", error);
    return NextResponse.json(
      { error: "Failed to register token" },
      { status: 500 }
    );
  }
}
