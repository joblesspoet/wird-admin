"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getAdminProfile } from "@/utils/admin";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function createCategory(formData: FormData) {
  const profile = await getAdminProfile();
  if (!profile || profile.role !== "admin") {
    return { error: "Not authorized." };
  }

  const supabase = await createClient();

  const labelEn = String(formData.get("label_en") || "").trim();
  const labelAr = String(formData.get("label_ar") || "").trim() || null;
  const labelUr = String(formData.get("label_ur") || "").trim() || null;

  if (!labelEn) {
    return { error: "English label is required." };
  }

  const { data: maxResult } = await supabase
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();
  const sortOrder = (maxResult?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("categories").insert({
    id: slugify(labelEn),
    label_en: labelEn,
    label_ar: labelAr,
    label_ur: labelUr,
    sort_order: sortOrder,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/categories");
  redirect("/categories");
}

export async function updateCategory(id: string, formData: FormData) {
  const profile = await getAdminProfile();
  if (!profile || profile.role !== "admin") {
    return { error: "Not authorized." };
  }

  const supabase = await createClient();

  const labelEn = String(formData.get("label_en") || "").trim();
  const labelAr = String(formData.get("label_ar") || "").trim() || null;
  const labelUr = String(formData.get("label_ur") || "").trim() || null;

  if (!labelEn) {
    return { error: "English label is required." };
  }

  const { error } = await supabase
    .from("categories")
    .update({
      label_en: labelEn,
      label_ar: labelAr,
      label_ur: labelUr,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/categories");
  revalidatePath(`/categories/${id}`);
  redirect("/categories");
}

export async function deleteCategory(id: string) {
  const profile = await getAdminProfile();
  if (!profile || profile.role !== "admin") {
    return { error: "Not authorized." };
  }

  const supabase = await createClient();

  // Set category_id to null on dhikr before deleting
  await supabase
    .from("dhikr")
    .update({ category_id: null })
    .eq("category_id", id);

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/categories");
  revalidatePath("/zikr");
  return {};
}
