'use client';

import { useState } from 'react';
import Link from 'next/link';
import ItemDrawer from '@/components/items/ItemDrawer';
import type { ItemWithMeta } from '@/lib/db/items';
import type { FavoriteCollection } from '@/lib/db/collections';
import { ICON_MAP } from '@/lib/constants/item-types';
import { FolderOpen } from 'lucide-react';

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function FavoritesList({
  items,
  collections,
}: {
  items: ItemWithMeta[];
  collections: FavoriteCollection[];
}) {
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  return (
    <>
      {items.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Items
            </h2>
            <span className="text-xs text-muted-foreground">{items.length}</span>
          </div>
          <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
            {items.map((item) => {
              const Icon = ICON_MAP[item.itemType.icon];
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveItemId(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent/40 transition-colors cursor-pointer"
                >
                  <div
                    className="h-5 w-5 rounded flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${item.itemType.color}22` }}
                  >
                    {Icon && <Icon className="h-3 w-3" style={{ color: item.itemType.color }} />}
                  </div>
                  <span className="text-sm text-foreground truncate flex-1 font-mono">
                    {item.title}
                  </span>
                  <span
                    className="text-[10px] rounded px-1.5 py-0.5 font-medium shrink-0 font-mono"
                    style={{
                      backgroundColor: `${item.itemType.color}22`,
                      color: item.itemType.color,
                    }}
                  >
                    {item.itemType.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground shrink-0 w-16 text-right font-mono">
                    {formatDate(item.createdAt)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {collections.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Collections
            </h2>
            <span className="text-xs text-muted-foreground">{collections.length}</span>
          </div>
          <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.id}`}
                className="flex items-center gap-3 px-3 py-2 hover:bg-accent/40 transition-colors"
              >
                <div className="h-5 w-5 rounded flex items-center justify-center shrink-0 bg-muted">
                  <FolderOpen className="h-3 w-3 text-muted-foreground" />
                </div>
                <span className="text-sm text-foreground truncate flex-1 font-mono">
                  {collection.name}
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                  {collection.itemCount} item{collection.itemCount !== 1 ? 's' : ''}
                </span>
                <span className="text-[11px] text-muted-foreground shrink-0 w-16 text-right font-mono">
                  {formatDate(collection.updatedAt)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <ItemDrawer itemId={activeItemId} onClose={() => setActiveItemId(null)} />
    </>
  );
}
