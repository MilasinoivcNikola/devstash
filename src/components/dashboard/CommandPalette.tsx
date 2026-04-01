'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { ICON_MAP } from '@/lib/constants/item-types';
import { FolderOpen } from 'lucide-react';
import { fetchSearchData, type SearchData } from '@/actions/search';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemSelect: (itemId: string) => void;
}

export default function CommandPalette({ open, onOpenChange, onItemSelect }: CommandPaletteProps) {
  const router = useRouter();
  const [data, setData] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (data) return;
    setLoading(true);
    const result = await fetchSearchData();
    setData(result);
    setLoading(false);
  }, [data]);

  useEffect(() => {
    if (open) loadData();
  }, [open, loadData]);

  function handleItemSelect(itemId: string) {
    onOpenChange(false);
    onItemSelect(itemId);
  }

  function handleCollectionSelect(collectionId: string) {
    onOpenChange(false);
    router.push(`/collections/${collectionId}`);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Search across items and collections"
    >
      <CommandContent data={data} loading={loading} onItemSelect={handleItemSelect} onCollectionSelect={handleCollectionSelect} />
    </CommandDialog>
  );
}

function CommandContent({
  data,
  loading,
  onItemSelect,
  onCollectionSelect,
}: {
  data: SearchData | null;
  loading: boolean;
  onItemSelect: (id: string) => void;
  onCollectionSelect: (id: string) => void;
}) {
  return (
    <Command className="flex flex-col">
      <CommandInput placeholder="Search items and collections..." />
      <CommandList>
        {loading && (
          <div className="py-6 text-center text-sm text-muted-foreground">Loading...</div>
        )}
        {!loading && <CommandEmpty>No results found.</CommandEmpty>}
        {data && data.items.length > 0 && (
          <CommandGroup heading="Items">
            {data.items.map((item) => {
              const Icon = ICON_MAP[item.typeIcon];
              return (
                <CommandItem
                  key={item.id}
                  value={item.title}
                  onSelect={() => onItemSelect(item.id)}
                >
                  {Icon && (
                    <div
                      className="h-5 w-5 rounded flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${item.typeColor}22` }}
                    >
                      <Icon className="h-3 w-3" style={{ color: item.typeColor }} />
                    </div>
                  )}
                  <span className="truncate">{item.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground capitalize">{item.typeName}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
        {data && data.items.length > 0 && data.collections.length > 0 && (
          <CommandSeparator />
        )}
        {data && data.collections.length > 0 && (
          <CommandGroup heading="Collections">
            {data.collections.map((collection) => (
              <CommandItem
                key={collection.id}
                value={collection.name}
                onSelect={() => onCollectionSelect(collection.id)}
              >
                <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{collection.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {collection.itemCount} {collection.itemCount === 1 ? 'item' : 'items'}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}
