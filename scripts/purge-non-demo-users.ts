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

const DEMO_EMAIL = "demo@devstash.io";

async function main() {
  const demoUser = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (!demoUser) throw new Error(`Demo user (${DEMO_EMAIL}) not found — aborting.`);

  const targets = await prisma.user.findMany({
    where: { id: { not: demoUser.id } },
    select: { id: true, email: true },
  });

  if (targets.length === 0) {
    console.log("No non-demo users found. Nothing to delete.");
    return;
  }

  console.log(`Found ${targets.length} user(s) to delete:`);
  for (const u of targets) {
    console.log(`  - ${u.email ?? "(no email)"} (${u.id})`);
  }

  const ids = targets.map((u) => u.id);

  // Cascade-delete everything owned by these users.
  // Child rows with onDelete: Cascade are handled by the DB, but
  // verification tokens are keyed by email, not userId, so delete those explicitly.
  const emails = targets.map((u) => u.email).filter(Boolean) as string[];
  if (emails.length > 0) {
    const { count: tokenCount } = await prisma.verificationToken.deleteMany({
      where: { identifier: { in: emails } },
    });
    console.log(`\nDeleted ${tokenCount} verification token(s).`);
  }

  const { count: userCount } = await prisma.user.deleteMany({
    where: { id: { in: ids } },
  });

  console.log(`Deleted ${userCount} user(s) and their associated data.`);
  console.log(`\nDemo user (${DEMO_EMAIL}) preserved.`);
}

main()
  .catch((e) => {
    console.error("Purge failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
