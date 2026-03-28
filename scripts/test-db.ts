import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Testing database connection...\n");

  // 1. Connection check
  await prisma.$queryRaw`SELECT 1`;
  console.log("✓ Connected to Neon PostgreSQL");

  // 2. System item types
  const itemTypes = await prisma.itemType.findMany({
    where: { isSystem: true },
    orderBy: { name: "asc" },
  });
  console.log(`✓ Found ${itemTypes.length}/7 system item types:`);
  for (const t of itemTypes) {
    console.log(`    ${t.color}  ${t.name} (${t.icon})`);
  }

  // 3. Table counts
  const [users, items, collections, tags] = await Promise.all([
    prisma.user.count(),
    prisma.item.count(),
    prisma.collection.count(),
    prisma.tag.count(),
  ]);
  console.log("\n✓ Table row counts:");
  console.log(`    users:       ${users}`);
  console.log(`    items:       ${items}`);
  console.log(`    collections: ${collections}`);
  console.log(`    tags:        ${tags}`);

  console.log("\nAll checks passed.");
}

main()
  .catch((e) => {
    console.error("Database test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
