import { getItemsByType, ItemWithMeta } from '@/lib/db/items';
import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { ICON_MAP } from '@/lib/constants/item-types';
import { Star, Pin } from 'lucide-react';

const VALID_TYPES = ['snippet', 'prompt', 'command', 'note', 'file', 'image', 'link'] as const;

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
