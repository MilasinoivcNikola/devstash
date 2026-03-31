'use client';

import { useState } from 'react';
import ItemDrawer from './ItemDrawer';
import type { ItemWithMeta } from '@/lib/db/items';
import { ICON_MAP } from '@/lib/constants/item-types';
import { Star, Pin } from 'lucide-react';

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ClickableItemCard({
  item,
  onClick,
  showTypeBadge,
}: {
  item: ItemWithMeta;
  onClick: () => void;
  showTypeBadge?: boolean;
}) {
  const Icon = ICON_MAP[item.itemType.icon];

  return (
    <button
      onClick={onClick}
      className="bg-card border border-border rounded-lg px-4 py-3 flex items-start gap-3 border-l-[3px] w-full text-left hover:bg-accent/40 transition-colors cursor-pointer"
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
          {showTypeBadge && (
            <span
              className="text-xs rounded px-1.5 py-0.5 font-medium"
              style={{
                backgroundColor: `${item.itemType.color}22`,
                color: item.itemType.color,
              }}
            >
              {item.itemType.name}
            </span>
          )}
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
    </button>
  );
}

interface ItemsGridWrapperProps {
  items: ItemWithMeta[];
  showTypeBadge?: boolean;
  layout?: 'grid' | 'list';
}

export function ItemsGridWrapper({ items, showTypeBadge, layout = 'grid' }: ItemsGridWrapperProps) {
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  return (
    <>
      <div
        className={
          layout === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3'
            : 'flex flex-col gap-3'
        }
      >
        {items.map((item) => (
          <ClickableItemCard
            key={item.id}
            item={item}
            showTypeBadge={showTypeBadge}
            onClick={() => setActiveItemId(item.id)}
          />
        ))}
      </div>
      <ItemDrawer itemId={activeItemId} onClose={() => setActiveItemId(null)} />
    </>
  );
}
