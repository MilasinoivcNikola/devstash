'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import ItemDrawer from '@/components/items/ItemDrawer';
import type { ItemWithMeta } from '@/lib/db/items';
import type { FavoriteCollection } from '@/lib/db/collections';
import { ICON_MAP } from '@/lib/constants/item-types';
import { FolderOpen, ArrowUpDown } from 'lucide-react';

type SortField = 'name' | 'date' | 'type';
type SortDir = 'asc' | 'desc';

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: 'name', label: 'Name' },
  { field: 'date', label: 'Date' },
  { field: 'type', label: 'Type' },
];

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function sortItems(items: ItemWithMeta[], field: SortField, dir: SortDir): ItemWithMeta[] {
  const sorted = [...items];
  sorted.sort((a, b) => {
    switch (field) {
      case 'name':
        return a.title.localeCompare(b.title);
      case 'date':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'type':
        return a.itemType.name.localeCompare(b.itemType.name) || a.title.localeCompare(b.title);
    }
  });
  return dir === 'desc' ? sorted.reverse() : sorted;
}

function sortCollections(collections: FavoriteCollection[], field: SortField, dir: SortDir): FavoriteCollection[] {
  const sorted = [...collections];
  sorted.sort((a, b) => {
    switch (field) {
      case 'name':
      case 'type':
        return a.name.localeCompare(b.name);
      case 'date':
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }
  });
  return dir === 'desc' ? sorted.reverse() : sorted;
}

export default function FavoritesList({
  items,
  collections,
}: {
  items: ItemWithMeta[];
  collections: FavoriteCollection[];
}) {
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sortedItems = useMemo(() => sortItems(items, sortField, sortDir), [items, sortField, sortDir]);
  const sortedCollections = useMemo(() => sortCollections(collections, sortField, sortDir), [collections, sortField, sortDir]);

  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'name' || field === 'type' ? 'asc' : 'desc');
    }
  }

  return (
    <>
      {/* Sort controls */}
      <div className="flex items-center gap-1.5">
        <ArrowUpDown className="h-3 w-3 text-muted-foreground shrink-0" />
        {SORT_OPTIONS.map(({ field, label }) => (
          <button
            key={field}
            onClick={() => handleSort(field)}
            className={`text-xs font-mono px-2 py-1 rounded transition-colors ${
              sortField === field
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            {label}
            {sortField === field && (
              <span className="ml-1 text-[10px]">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>
            )}
          </button>
        ))}
      </div>

      {sortedItems.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Items
            </h2>
            <span className="text-xs text-muted-foreground">{sortedItems.length}</span>
          </div>
          <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
            {sortedItems.map((item) => {
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

      {sortedCollections.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Collections
            </h2>
            <span className="text-xs text-muted-foreground">{sortedCollections.length}</span>
          </div>
          <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
            {sortedCollections.map((collection) => (
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
