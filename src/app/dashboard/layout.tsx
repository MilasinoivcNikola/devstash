import DashboardShell from "@/components/dashboard/DashboardShell";
import { getSidebarItemTypes } from "@/lib/db/items";
import { getSidebarCollections } from "@/lib/db/collections";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [itemTypes, sidebarCollections] = await Promise.all([
    getSidebarItemTypes(),
    getSidebarCollections(),
  ]);

  return (
    <DashboardShell itemTypes={itemTypes} sidebarCollections={sidebarCollections}>
      {children}
    </DashboardShell>
  );
}
