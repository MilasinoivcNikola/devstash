import { getRecentCollections, getCollectionStats, CollectionWithMeta } from '@/lib/db/collections';
import { getPinnedItems, getRecentItems, getItemStats, ItemWithMeta } from '@/lib/db/items';
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

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

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

function ItemCard({ item }: { item: ItemWithMeta }) {
  const Icon = ICON_MAP[item.itemType.icon];

  return (
    <div
      className="bg-card border border-border rounded-lg px-4 py-3 flex items-start gap-3 border-l-[3px]"
      style={{ borderLeftColor: item.itemType.color }}
    >
      <div
        className="h-8 w-8 rounded-md flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: `${item.itemType.color}22` }}
      >
        {Icon && <Icon className="h-4 w-4" style={{ color: item.itemType.color }} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground truncate">{item.title}</span>
          {item.isFavorite && (
            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 shrink-0" />
          )}
          {item.isPinned && (
            <Pin className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>
        )}
        <div className="flex flex-wrap gap-1 mt-1.5">
          <span
            className="text-xs rounded px-1.5 py-0.5 font-medium"
            style={{
              backgroundColor: `${item.itemType.color}22`,
              color: item.itemType.color,
            }}
          >
            {item.itemType.name}
          </span>
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-accent text-accent-foreground rounded px-1.5 py-0.5"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
        {formatDate(item.createdAt)}
      </span>
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
          <div className="flex flex-col gap-3">
            {pinnedItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Items */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-4">Recent Items</h2>
        <div className="flex flex-col gap-3">
          {recentItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
