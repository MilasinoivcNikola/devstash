'use client';

import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Star, Pin, Copy, Pencil, Trash2, FolderOpen, Calendar } from 'lucide-react';
import { ICON_MAP } from '@/lib/constants/item-types';
import type { ItemDetail } from '@/lib/db/items';

interface ItemDrawerProps {
  itemId: string | null;
  onClose: () => void;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-accent ${className ?? ''}`} />;
}

function DrawerSkeleton() {
  return (
    <div className="flex flex-col gap-5 p-1">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

function ActionButton({
  onClick,
  active,
  activeColor,
  children,
  label,
  variant,
}: {
  onClick?: () => void;
  active?: boolean;
  activeColor?: string;
  children: React.ReactNode;
  label: string;
  variant?: 'default' | 'danger';
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors
        ${variant === 'danger'
          ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
          : active
            ? ''
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
        }`}
      style={active && activeColor ? { color: activeColor } : undefined}
    >
      {children}
    </button>
  );
}

export default function ItemDrawer({ itemId, onClose }: ItemDrawerProps) {
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!itemId) {
      setItem(null);
      return;
    }
    setLoading(true);
    setItem(null);
    fetch(`/api/items/${itemId}`)
      .then((r) => r.json())
      .then((data) => setItem(data))
      .finally(() => setLoading(false));
  }, [itemId]);

  const Icon = item ? ICON_MAP[item.itemType.icon] : null;

  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <Sheet open={!!itemId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto flex flex-col gap-0 p-0">
        {loading || (!item && !!itemId) ? (
          <div className="p-6">
            <DrawerSkeleton />
          </div>
        ) : item ? (
          <>
            {/* Header */}
            <SheetHeader className="px-6 pt-6 pb-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${item.itemType.color}22`,
                    color: item.itemType.color,
                  }}
                >
                  {item.itemType.name}
                </span>
                {item.language && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                    {item.language}
                  </span>
                )}
              </div>
              <SheetTitle className="text-base font-semibold leading-snug text-left">
                {item.title}
              </SheetTitle>
            </SheetHeader>

            {/* Action bar */}
            <div className="flex items-center gap-1 px-4 py-3 border-b border-border mt-3">
              <ActionButton label="Favorite" active={item.isFavorite} activeColor="#facc15">
                <Star
                  className="h-3.5 w-3.5"
                  fill={item.isFavorite ? '#facc15' : 'none'}
                  stroke={item.isFavorite ? '#facc15' : 'currentColor'}
                />
                Favorite
              </ActionButton>
              <ActionButton label="Pin" active={item.isPinned} activeColor="hsl(var(--foreground))">
                <Pin className="h-3.5 w-3.5" />
                Pin
              </ActionButton>
              <ActionButton label="Copy content">
                <Copy className="h-3.5 w-3.5" />
                Copy
              </ActionButton>
              <div className="ml-auto flex items-center gap-1">
                <ActionButton label="Edit">
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </ActionButton>
                <ActionButton label="Delete" variant="danger">
                  <Trash2 className="h-3.5 w-3.5" />
                </ActionButton>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 px-6 py-5 space-y-6">
              {/* Description */}
              {item.description && (
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Description
                  </h3>
                  <p className="text-sm text-foreground leading-relaxed">{item.description}</p>
                </section>
              )}

              {/* Content preview */}
              {item.content && (
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Content
                  </h3>
                  <div className="rounded-md overflow-hidden border border-border max-h-96 overflow-y-auto">
                    <div className="flex min-w-0">
                      {/* Line numbers */}
                      <div
                        className="select-none text-right pr-3 pl-3 py-4 text-xs font-mono leading-5 shrink-0"
                        style={{ color: 'hsl(var(--muted-foreground) / 0.4)', backgroundColor: 'hsl(var(--muted) / 0.6)' }}
                        aria-hidden
                      >
                        {item.content.split('\n').map((_, i) => (
                          <div key={i}>{i + 1}</div>
                        ))}
                      </div>
                      {/* Code */}
                      <pre
                        className="flex-1 py-4 pr-4 pl-3 text-xs font-mono leading-5 text-foreground overflow-x-auto whitespace-pre"
                        style={{ backgroundColor: 'hsl(var(--muted) / 0.35)' }}
                      >
                        {item.content}
                      </pre>
                    </div>
                  </div>
                </section>
              )}

              {/* URL */}
              {item.url && (
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    URL
                  </h3>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:underline break-all"
                  >
                    {item.url}
                  </a>
                </section>
              )}

              {/* Tags */}
              {item.tags.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-accent text-accent-foreground rounded px-2 py-0.5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Collections */}
              {item.collections.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Collections
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {item.collections.map((col) => (
                      <span
                        key={col.id}
                        className="inline-flex items-center gap-1 text-xs bg-accent text-accent-foreground rounded px-2 py-0.5"
                      >
                        <FolderOpen className="h-3 w-3" />
                        {col.name}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Details */}
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Details
                </h3>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-foreground/60">Created</span>
                    <span className="ml-auto text-foreground">{formatDate(item.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-foreground/60">Updated</span>
                    <span className="ml-auto text-foreground">{formatDate(item.updatedAt)}</span>
                  </div>
                </div>
              </section>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
