"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getAdminProfile } from "@/utils/admin";

function getCategoryId(categoryText: string): string {
  return categoryText
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function generateZikrId(transliteration: string): string {
  const base = transliteration
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = Date.now().toString(36);
  return `${base || "zikr"}-${suffix}`;
}

export async function createZikr(formData: FormData) {
  const profile = await getAdminProfile();
  if (!profile || profile.role !== "admin") {
    return { error: "Not authorized." };
  }

  const supabase = await createClient();

  const arabic = String(formData.get("arabic") || "").trim();
  const transliteration = String(formData.get("transliteration") || "").trim();
  const meaning = String(formData.get("meaning") || "").trim();
  const categoryId = String(formData.get("category_id") || "").trim();
  const recommendedCount = parseInt(
    String(formData.get("recommended_count") || "33"),
    10
  );
  const reference = String(formData.get("reference") || "").trim() || null;
  const description = String(formData.get("description") || "").trim() || null;

  if (!arabic || !transliteration || !meaning) {
    return { error: "Arabic, transliteration, and meaning are required." };
  }

  // Get category label for the denormalized `category` column
  let categoryLabel = "General";
  if (categoryId) {
    const { data: cat } = await supabase
      .from("categories")
      .select("label_en")
      .eq("id", categoryId)
      .single();
    if (cat) categoryLabel = cat.label_en;
  }

  // Max sort order so new items appear last
  const { data: maxResult } = await supabase
    .from("dhikr")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();
  const sortOrder = (maxResult?.sort_order ?? -1) + 1;

  const id = generateZikrId(transliteration);

  const { error } = await supabase.from("dhikr").insert({
    id,
    arabic,
    transliteration,
    meaning,
    recommended_count: recommendedCount || 33,
    category: categoryLabel,
    category_id: categoryId || null,
    reference,
    description,
    sort_order: sortOrder,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/zikr");
  redirect("/zikr");
}

export async function updateZikr(id: string, formData: FormData) {
  const profile = await getAdminProfile();
  if (!profile || profile.role !== "admin") {
    return { error: "Not authorized." };
  }

  const supabase = await createClient();

  const arabic = String(formData.get("arabic") || "").trim();
  const transliteration = String(formData.get("transliteration") || "").trim();
  const meaning = String(formData.get("meaning") || "").trim();
  const categoryId = String(formData.get("category_id") || "").trim();
  const recommendedCount = parseInt(
    String(formData.get("recommended_count") || "33"),
    10
  );
  const reference = String(formData.get("reference") || "").trim() || null;
  const description = String(formData.get("description") || "").trim() || null;

  if (!arabic || !transliteration || !meaning) {
    return { error: "Arabic, transliteration, and meaning are required." };
  }

  let categoryLabel = "General";
  if (categoryId) {
    const { data: cat } = await supabase
      .from("categories")
      .select("label_en")
      .eq("id", categoryId)
      .single();
    if (cat) categoryLabel = cat.label_en;
  }

  const { error } = await supabase
    .from("dhikr")
    .update({
      arabic,
      transliteration,
      meaning,
      recommended_count: recommendedCount || 33,
      category: categoryLabel,
      category_id: categoryId || null,
      reference,
      description,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/zikr");
  revalidatePath(`/zikr/${id}`);
  redirect("/zikr");
}

export async function deleteZikr(id: string) {
  const profile = await getAdminProfile();
  if (!profile || profile.role !== "admin") {
    return { error: "Not authorized." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("dhikr").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/zikr");
  return {};
}
