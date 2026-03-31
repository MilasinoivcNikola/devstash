import DashboardShell from '@/components/dashboard/DashboardShell';
import { getSidebarItemTypes } from '@/lib/db/items';
import { getSidebarCollections } from '@/lib/db/collections';
import { auth } from '@/auth';

export default async function ItemsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  const [itemTypes, sidebarCollections] = await Promise.all([
    getSidebarItemTypes(userId),
    getSidebarCollections(userId),
  ]);

  const user = session.user ?? null;

  return (
    <DashboardShell itemTypes={itemTypes} sidebarCollections={sidebarCollections} user={user}>
      {children}
    </DashboardShell>
  );
}
