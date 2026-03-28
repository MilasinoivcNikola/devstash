import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

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
  console.log(`\n✓ System item types (${itemTypes.length}/7):`);
  for (const t of itemTypes) {
    console.log(`    ${t.color}  ${t.name} (${t.icon})`);
  }

  // 3. Demo user
  const demoUser = await prisma.user.findUnique({
    where: { email: "demo@devstash.io" },
  });
  if (!demoUser) throw new Error("Demo user not found");
  console.log(`\n✓ Demo user:`);
  console.log(`    email:         ${demoUser.email}`);
  console.log(`    name:          ${demoUser.name}`);
  console.log(`    isPro:         ${demoUser.isPro}`);
  console.log(`    emailVerified: ${demoUser.emailVerified?.toISOString()}`);
  console.log(`    password hash: ${demoUser.password ? "set" : "missing"}`);

  // 4. Collections with item counts
  const collections = await prisma.collection.findMany({
    where: { userId: demoUser.id },
    orderBy: { name: "asc" },
    include: {
      items: {
        include: { item: { include: { itemType: true } } },
      },
    },
  });
  console.log(`\n✓ Collections (${collections.length}):`);
  for (const col of collections) {
    console.log(`    ${col.name} — ${col.items.length} item(s)`);
    for (const ic of col.items) {
      const item = ic.item;
      console.log(`        [${item.itemType.name}] ${item.title}`);
    }
  }

  // 5. Item type breakdown for demo user
  const itemsByType = await prisma.item.groupBy({
    by: ["itemTypeId"],
    where: { userId: demoUser.id },
    _count: { id: true },
  });
  const typeMap = Object.fromEntries(itemTypes.map((t) => [t.id, t.name]));
  console.log(`\n✓ Items by type:`);
  for (const row of itemsByType) {
    console.log(`    ${typeMap[row.itemTypeId] ?? row.itemTypeId}: ${row._count.id}`);
  }

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
