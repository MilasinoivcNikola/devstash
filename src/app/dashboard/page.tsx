import { getRecentCollections, getCollectionStats, CollectionWithMeta } from '@/lib/db/collections';
import { getPinnedItems, getRecentItems, getItemStats } from '@/lib/db/items';
import {
  Star,
  Pin,
  Package,
  FolderOpen,
  MoreHorizontal,
  LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { ICON_MAP } from '@/lib/constants/item-types';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ItemsGridWrapper } from '@/components/items/ItemsClientWrapper';


function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
      <div className="h-10 w-10 rounded-md bg-accent flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function CollectionCard({ collection }: { collection: CollectionWithMeta }) {
  return (
    <div
      className="bg-card border border-border rounded-lg p-4 flex flex-col gap-2 border-l-[3px]"
      style={{ borderLeftColor: collection.dominantColor }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-medium text-sm text-foreground truncate">
            {collection.name}
          </span>
          {collection.isFavorite && (
            <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
          )}
        </div>
        <button className="text-muted-foreground hover:text-foreground shrink-0 ml-2">
          <MoreHorizontal className="h-4 w-4" />
        </button>
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

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) redirect('/sign-in');

  const [collections, collectionStats, itemStats, pinnedItems, recentItems] = await Promise.all([
    getRecentCollections(userId),
    getCollectionStats(userId),
    getItemStats(userId),
    getPinnedItems(userId),
    getRecentItems(userId),
  ]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your developer knowledge hub</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Items" value={itemStats.total} icon={Package} />
        <StatCard label="Collections" value={collectionStats.total} icon={FolderOpen} />
        <StatCard label="Favorite Items" value={itemStats.favorites} icon={Star} />
        <StatCard label="Favorite Collections" value={collectionStats.favorites} icon={Star} />
      </div>

      {/* Collections */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Collections</h2>
          <Link
            href="/collections"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((c) => (
            <CollectionCard key={c.id} collection={c} />
          ))}
        </div>
      </section>

      {/* Pinned */}
      {pinnedItems.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Pin className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">Pinned</h2>
          </div>
          <ItemsGridWrapper items={pinnedItems} showTypeBadge layout="list" />
        </section>
      )}

      {/* Recent Items */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-4">Recent Items</h2>
        <ItemsGridWrapper items={recentItems} showTypeBadge layout="list" />
      </section>
    </div>
  );
}
