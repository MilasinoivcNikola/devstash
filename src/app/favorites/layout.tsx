import DashboardShell from '@/components/dashboard/DashboardShell';
import { getSidebarItemTypes } from '@/lib/db/items';
import { getSidebarCollections } from '@/lib/db/collections';
import { getEditorPreferences } from '@/lib/db/editor-preferences';
import { auth } from '@/auth';

export default async function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  const [itemTypes, sidebarCollections, editorPreferences] = await Promise.all([
    getSidebarItemTypes(userId),
    getSidebarCollections(userId),
    getEditorPreferences(userId),
  ]);

  const user = session.user ?? null;

  return (
    <DashboardShell itemTypes={itemTypes} sidebarCollections={sidebarCollections} user={user} editorPreferences={editorPreferences}>
      {children}
    </DashboardShell>
  );
}
