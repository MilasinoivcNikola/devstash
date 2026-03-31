import { getItemsByType } from '@/lib/db/items';
import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { ItemsGridWrapper } from '@/components/items/ItemsClientWrapper';

const VALID_TYPES = ['snippet', 'prompt', 'command', 'note', 'file', 'image', 'link'] as const;

export default async function ItemsTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type: typeSlug } = await params;

  // Convert plural slug (e.g. "snippets") to singular type name (e.g. "snippet")
  const typeName = typeSlug.endsWith('s') ? typeSlug.slice(0, -1) : typeSlug;

  if (!VALID_TYPES.includes(typeName as (typeof VALID_TYPES)[number])) {
    notFound();
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/sign-in');

  const items = await getItemsByType(userId, typeName);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground capitalize">{typeSlug}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{items.length} item{items.length !== 1 ? 's' : ''}</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground text-sm">No {typeSlug} yet.</p>
        </div>
      ) : (
        <ItemsGridWrapper items={items} layout="grid" />
      )}
    </div>
  );
}
