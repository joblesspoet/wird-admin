/**
 * Wird Admin Seeder
 * ------------------
 * Laravel-style seeder. Idempotent: safe to run multiple times.
 *
 * Runs:
 *  1. Creates default admin user in Supabase Auth (if not exists)
 *  2. Inserts admin_profiles row with role 'admin'
 *  3. Loads categories + dhikr from wird_library_v1.json (if empty)
 *  4. Creates initial content_version
 *
 * Usage:
 *  npm run db:seed
 *  (uses SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL from .env)
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@wird.app";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@123";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "❌ Missing env vars. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("🌱 Wird Admin Seeder\n");

  // ── 1. Create default admin user (Supabase Auth) ─────────────────────────
  console.log("👤 Ensuring default admin user...");
  const { data: existingUsers, error: listError } =
    await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("❌ Failed to list users:", listError.message);
    process.exit(1);
  }

  const adminUser = existingUsers.users.find((u) => u.email === ADMIN_EMAIL);

  let adminId: string | null = null;
  if (adminUser) {
    console.log(`✅ Admin already exists: ${ADMIN_EMAIL}`);
    adminId = adminUser.id;
  } else {
    const { data: createdUser, error: createError } =
      await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: "Default Admin", role: "admin" },
      });
    if (createError) {
      console.error("❌ Failed to create admin user:", createError.message);
      process.exit(1);
    }
    console.log(`✅ Admin created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    adminId = createdUser!.user!.id;
  }

  // ── 2. Ensure admin profile row ──────────────────────────────────────────
  console.log("\n📋 Ensuring admin profile...");
  const { error: upsertProfileError } = await supabase
    .from("admin_profiles")
    .upsert(
      {
        id: adminId,
        email: ADMIN_EMAIL,
        full_name: "Default Admin",
        role: "admin",
        is_active: true,
      },
      { onConflict: "email" }
    );
  if (upsertProfileError) {
    console.error("❌ Failed to upsert admin profile:", upsertProfileError.message);
    process.exit(1);
  }
  console.log("✅ Admin profile upserted.");

  // ── 3. Load JSON data ────────────────────────────────────────────────────
  console.log("\n📚 Loading wird_library_v1.json...");
  const jsonPath = path.join(__dirname, "..", "prisma", "data", "wird_library_v1.json");
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ JSON file not found: ${jsonPath}`);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  // ── 4. Seed categories (only if empty) ───────────────────────────────────
  const { count: catCount, error: catCountError } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true });
  if (catCountError) {
    console.error("❌ Failed to count categories:", catCountError.message);
    process.exit(1);
  }

  if ((catCount ?? 0) > 0) {
    console.log(`⏭️  Categories already seeded (${catCount}). Skipping.`);
  } else {
    console.log(`📂 Seeding ${(data.categories || []).length} categories...`);
    const catRows = (data.categories || []).map((cat: any, i: number) => ({
      id: cat.id,
      label_en: cat.label_en || "",
      label_ar: cat.label_ar || null,
      label_ur: cat.label_ur || null,
      sort_order: i,
    }));
    const { error: catError } = await supabase.from("categories").insert(catRows);
    if (catError) {
      console.error("❌ Failed to seed categories:", catError.message);
      process.exit(1);
    }
    console.log(`✅ Inserted ${catRows.length} categories.`);
  }

  // ── 5. Seed dhikr (only if empty) ────────────────────────────────────────
  const { count: dhikrCount, error: dhikrCountError } = await supabase
    .from("dhikr")
    .select("id", { count: "exact", head: true });
  if (dhikrCountError) {
    console.error("❌ Failed to count dhikr:", dhikrCountError.message);
    process.exit(1);
  }

  if ((dhikrCount ?? 0) > 0) {
    console.log(`⏭️  Dhikr already seeded (${dhikrCount}). Skipping.`);
  } else {
    console.log(`🤲 Seeding ${(data.zikrs || []).length} dhikr...`);
    const dhikrRows = (data.zikrs || []).map((z: any, i: number) => ({
      id: z.id,
      arabic: z.arabic,
      transliteration: z.transliteration,
      meaning: z.meaning,
      recommended_count: z.recommended_count || 33,
      category: z.category,
      category_id: z.category_id || null,
      reference: z.reference || null,
      description: z.description || null,
      sort_order: i,
    }));
    // Insert in batches of 100 to avoid payload limits
    for (let i = 0; i < dhikrRows.length; i += 100) {
      const batch = dhikrRows.slice(i, i + 100);
      const { error: dhikrError } = await supabase.from("dhikr").insert(batch);
      if (dhikrError) {
        console.error(`❌ Failed to seed dhikr batch ${i}:`, dhikrError.message);
        process.exit(1);
      }
    }
    console.log(`✅ Inserted ${dhikrRows.length} dhikr.`);
  }

  // ── 6. Create initial content version (if none exists) ───────────────────
  console.log("\n📦 Ensuring initial content version...");
  const { count: versionCount, error: versionCountError } = await supabase
    .from("content_versions")
    .select("id", { count: "exact", head: true });
  if (versionCountError) {
    console.error("❌ Failed to count versions:", versionCountError.message);
    process.exit(1);
  }

  if ((versionCount ?? 0) > 0) {
    console.log("⏭️  Content version already exists. Skipping.");
  } else {
    const finalCatCount =
      catCount ?? (data.categories || []).length;
    const finalDhikrCount =
      dhikrCount ?? (data.zikrs || []).length;
    const { error: versionError } = await supabase
      .from("content_versions")
      .insert({
        version: data.version || "1.0.0",
        dhikr_count: finalDhikrCount,
        category_count: finalCatCount,
        changelog: "Initial data import from wird_library_v1.json",
        published_by: adminId,
      });
    if (versionError) {
      console.error("❌ Failed to create version:", versionError.message);
      process.exit(1);
    }
    console.log(`✅ Version ${data.version || "1.0.0"} created.`);
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✨ Seeding completed successfully!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔐 Admin Login Credentials:");
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
