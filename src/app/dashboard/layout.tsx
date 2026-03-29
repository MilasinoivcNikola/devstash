import DashboardShell from "@/components/dashboard/DashboardShell";
import { getSidebarItemTypes } from "@/lib/db/items";
import { getSidebarCollections } from "@/lib/db/collections";
import { auth } from "@/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [itemTypes, sidebarCollections, session] = await Promise.all([
    getSidebarItemTypes(),
    getSidebarCollections(),
    auth(),
  ]);

  const user = session?.user ?? null;

  return (
    <DashboardShell itemTypes={itemTypes} sidebarCollections={sidebarCollections} user={user}>
      {children}
    </DashboardShell>
  );
}
