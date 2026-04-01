import { getCollectionById } from '@/lib/db/collections';
import { getItemsByCollection } from '@/lib/db/items';
import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { ItemsGridWrapper } from '@/components/items/ItemsClientWrapper';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/sign-in');

  const collection = await getCollectionById(userId, id);
  if (!collection) notFound();

  const items = await getItemsByCollection(userId, id);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <Link
          href="/collections"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Collections
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{collection.name}</h1>
        {collection.description && (
          <p className="text-sm text-muted-foreground mt-0.5">{collection.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-0.5">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground text-sm">No items in this collection yet.</p>
        </div>
      ) : (
        <ItemsGridWrapper items={items} showTypeBadge layout="grid" />
      )}
    </div>
  );
}
