'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, FolderOpen } from 'lucide-react';

export type CollectionOption = {
  id: string;
  name: string;
};

interface CollectionPickerProps {
  collections: CollectionOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

export default function CollectionPicker({ collections, selected, onChange }: CollectionPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const filtered = search
    ? collections.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : collections;

  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id]
    );
  }

  const selectedNames = collections
    .filter((c) => selected.includes(c.id))
    .map((c) => c.name);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent/50 transition-colors"
      >
        <span className="flex items-center gap-2 truncate text-left">
          <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {selectedNames.length === 0 ? (
            <span className="text-muted-foreground">Select collections...</span>
          ) : (
            <span className="truncate">{selectedNames.join(', ')}</span>
          )}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
          <div className="p-2">
            <input
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Search collections..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto px-1 pb-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">No collections found</p>
            ) : (
              filtered.map((collection) => {
                const isSelected = selected.includes(collection.id);
                return (
                  <button
                    key={collection.id}
                    type="button"
                    onClick={() => toggle(collection.id)}
                    className="w-full flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    <div
                      className={`flex items-center justify-center h-4 w-4 rounded border shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-primary border-primary'
                          : 'border-border'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span className="truncate">{collection.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {selectedNames.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {collections
            .filter((c) => selected.includes(c.id))
            .map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 text-xs bg-accent text-accent-foreground rounded px-2 py-0.5"
              >
                <FolderOpen className="h-3 w-3" />
                {c.name}
                <button
                  type="button"
                  onClick={() => toggle(c.id)}
                  className="ml-0.5 hover:text-destructive transition-colors"
                  aria-label={`Remove ${c.name}`}
                >
                  &times;
                </button>
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
