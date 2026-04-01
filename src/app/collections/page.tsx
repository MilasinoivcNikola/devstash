import { getAllCollections, CollectionWithMeta } from '@/lib/db/collections';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { ICON_MAP } from '@/lib/constants/item-types';
import CreateCollectionDialog from '@/components/collections/CreateCollectionDialog';
import CollectionCardMenu from '@/components/collections/CollectionCardMenu';

function CollectionCard({ collection }: { collection: CollectionWithMeta }) {
  return (
    <div
      className="relative bg-card border border-border rounded-lg p-4 flex flex-col gap-2 border-l-[3px] hover:bg-accent/50 transition-colors"
      style={{ borderLeftColor: collection.dominantColor }}
    >
      <Link href={`/collections/${collection.id}`} className="absolute inset-0 rounded-lg" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-medium text-sm text-foreground truncate">
            {collection.name}
          </span>
          {collection.isFavorite && (
            <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
          )}
        </div>
        <div className="relative z-10">
          <CollectionCardMenu collection={collection} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{collection.itemCount} items</p>
      {collection.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{collection.description}</p>
      )}
      {collection.types.length > 0 && (
        <div className="flex items-center gap-1.5 mt-1">
          {collection.types.map((t) => {
            const Icon = ICON_MAP[t.icon];
            return Icon ? (
              <Icon key={t.id} className="h-3.5 w-3.5" style={{ color: t.color }} />
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}

export default async function CollectionsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) redirect('/sign-in');

  const collections = await getAllCollections(userId);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Collections</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {collections.length} collection{collections.length !== 1 ? 's' : ''}
          </p>
        </div>
        <CreateCollectionDialog />
      </div>

      {collections.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground text-sm">No collections yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {collections.map((c) => (
            <CollectionCard key={c.id} collection={c} />
          ))}
        </div>
      )}
    </div>
  );
}
