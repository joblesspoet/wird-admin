import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

// Public endpoint - no auth required.
// Returns the same JSON structure the mobile app expects:
// { version, categories[], zikrs[] }
export async function GET() {
  try {
    const supabase = await createClient();

    const [versionResult, categoriesResult, zikrsResult] = await Promise.all([
      supabase
        .from("content_versions")
        .select("version")
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("categories")
        .select("id, label_en, label_ar, label_ur")
        .order("sort_order", { ascending: true }),
      supabase
        .from("dhikr")
        .select(
          "id, arabic, transliteration, meaning, recommended_count, category, category_id, reference, description, sort_order"
        )
        .order("sort_order", { ascending: true }),
    ]);

    if (categoriesResult.error) throw categoriesResult.error;
    if (zikrsResult.error) throw zikrsResult.error;

    const categories = (categoriesResult.data ?? []).map((c: any) => ({
      id: c.id,
      label_en: c.label_en,
      label_ar: c.label_ar,
      label_ur: c.label_ur,
    }));

    const zikrs = (zikrsResult.data ?? []).map((z: any) => ({
      id: z.id,
      arabic: z.arabic,
      transliteration: z.transliteration,
      meaning: z.meaning,
      recommended_count: z.recommended_count,
      category: z.category,
      category_id: z.category_id,
      reference: z.reference,
      description: z.description,
      sort_order: z.sort_order,
    }));

    return NextResponse.json(
      {
        version: versionResult.data?.version ?? "1.0.0",
        categories,
        zikrs,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Public data endpoint error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
