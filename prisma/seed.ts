import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // Check if database is already seeded
  const existingDhikrCount = await prisma.dhikr.count();
  if (existingDhikrCount > 0) {
    console.log('✅ Database already seeded. Skipping...');
    console.log(`   Found ${existingDhikrCount} dhikr records.\n`);
    return;
  }

  // ============================================================================
  // 1. Create Default Admin User
  // ============================================================================
  console.log('👤 Creating default admin user...');
  const passwordHash = await bcrypt.hash('Admin@123', 10);
  
  const admin = await prisma.adminUser.create({
    data: {
      email: 'admin@wird.app',
      passwordHash,
      fullName: 'Default Admin',
      role: 'admin',
      isActive: true,
    },
  });
  console.log('✅ Admin user created: admin@wird.app / Admin@123\n');

  // ============================================================================
  // 2. Load Zikr Data from JSON
  // ============================================================================
  console.log('📚 Loading zikr data from JSON...');
  const jsonPath = path.join(__dirname, 'data', 'wird_library_v1.json');
  
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`JSON file not found at: ${jsonPath}`);
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`   Found ${data.categories?.length || 0} categories`);
  console.log(`   Found ${data.zikrs?.length || 0} zikrs\n`);

  // ============================================================================
  // 3. Insert Categories
  // ============================================================================
  console.log('📂 Inserting categories...');
  const categories = data.categories || [];
  
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    await prisma.category.create({
      data: {
        id: cat.id,
        labelEn: cat.label_en,
        labelAr: cat.label_ar || null,
        labelUr: cat.label_ur || null,
        sortOrder: i,
      },
    });
  }
  console.log(`✅ Inserted ${categories.length} categories\n`);

  // ============================================================================
  // 4. Insert Dhikr/Zikr
  // ============================================================================
  console.log('🤲 Inserting zikr...');
  const zikrs = data.zikrs || [];
  
  for (let i = 0; i < zikrs.length; i++) {
    const z = zikrs[i];
    await prisma.dhikr.create({
      data: {
        id: z.id,
        arabic: z.arabic,
        transliteration: z.transliteration,
        meaning: z.meaning,
        recommendedCount: z.recommended_count || 33,
        category: z.category,
        categoryId: z.category_id || null,
        reference: z.reference || null,
        description: z.description || null,
        sortOrder: i,
      },
    });
  }
  console.log(`✅ Inserted ${zikrs.length} zikr\n`);

  // ============================================================================
  // 5. Create Initial Version
  // ============================================================================
  console.log('📦 Creating initial content version...');
  await prisma.contentVersion.create({
    data: {
      version: data.version || '1.0.0',
      dhikrCount: zikrs.length,
      categoryCount: categories.length,
      changelog: 'Initial data import from wird_library_v1.json',
      publishedBy: admin.id,
    },
  });
  console.log(`✅ Version ${data.version || '1.0.0'} created\n`);

  // ============================================================================
  // Summary
  // ============================================================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ Database seeding completed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 Summary:`);
  console.log(`   • Admin Users: 1`);
  console.log(`   • Categories:  ${categories.length}`);
  console.log(`   • Zikr:        ${zikrs.length}`);
  console.log(`   • Version:     ${data.version || '1.0.0'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🔐 Admin Login Credentials:');
  console.log('   Email:    admin@wird.app');
  console.log('   Password: Admin@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
