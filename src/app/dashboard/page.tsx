import {
  mockCollections,
  mockItems,
  mockItemTypes,
  mockItemTypeCounts,
} from '@/lib/mock-data';
import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image,
  Link as LinkIcon,
  Star,
  Pin,
  Package,
  FolderOpen,
  MoreHorizontal,
  LucideIcon,
} from 'lucide-react';
import Link from 'next/link';

const ICON_MAP: Record<string, LucideIcon> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image,
  Link: LinkIcon,
};

const totalItems = Object.values(mockItemTypeCounts).reduce((a, b) => a + b, 0);
const totalCollections = mockCollections.length;
const favoriteItems = mockItems.filter((i) => i.isFavorite).length;
const favoriteCollections = mockCollections.filter((c) => c.isFavorite).length;

const pinnedItems = mockItems.filter((i) => i.isPinned);
const recentItems = [...mockItems]
  .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  .slice(0, 10);

const TYPE_MAP = Object.fromEntries(mockItemTypes.map((t) => [t.id, t]));

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

type Collection = (typeof mockCollections)[0];
type Item = (typeof mockItems)[0];

function CollectionCard({
  collection,
  index,
}: {
  collection: Collection;
  index: number;
}) {
  const previewTypes = mockItemTypes.slice(index % 3, (index % 3) + 4);
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-2">
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
      <p className="text-xs text-muted-foreground line-clamp-2">{collection.description}</p>
      <div className="flex items-center gap-1.5 mt-1">
        {previewTypes.map((t) => {
          const Icon = ICON_MAP[t.icon];
          return Icon ? (
            <Icon key={t.id} className="h-3.5 w-3.5" style={{ color: t.color }} />
          ) : null;
        })}
      </div>
    </div>
  );
}

function ItemRow({ item }: { item: Item }) {
  const type = TYPE_MAP[item.itemTypeId];
  const Icon = type ? ICON_MAP[type.icon] : null;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div
        className="h-8 w-8 rounded-md flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: type?.color ? `${type.color}22` : undefined }}
      >
        {Icon && <Icon className="h-4 w-4" style={{ color: type?.color }} />}
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
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-accent text-accent-foreground rounded px-1.5 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
        {formatDate(item.createdAt)}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your developer knowledge hub</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Items" value={totalItems} icon={Package} />
        <StatCard label="Collections" value={totalCollections} icon={FolderOpen} />
        <StatCard label="Favorite Items" value={favoriteItems} icon={Star} />
        <StatCard label="Favorite Collections" value={favoriteCollections} icon={Star} />
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
          {mockCollections.map((c, i) => (
            <CollectionCard key={c.id} collection={c} index={i} />
          ))}
        </div>
      </section>

      {/* Pinned */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Pin className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">Pinned</h2>
        </div>
        <div className="bg-card border border-border rounded-lg px-4">
          {pinnedItems.length > 0 ? (
            pinnedItems.map((item) => <ItemRow key={item.id} item={item} />)
          ) : (
            <p className="text-sm text-muted-foreground py-4">No pinned items.</p>
          )}
        </div>
      </section>

      {/* Recent Items */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-4">Recent Items</h2>
        <div className="bg-card border border-border rounded-lg px-4">
          {recentItems.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
