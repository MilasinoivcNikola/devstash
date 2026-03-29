'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  Star,
  ChevronDown,
  PanelLeft,
  LogOut,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarItemType } from '@/lib/db/items';
import { SidebarCollection } from '@/lib/db/collections';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ICON_MAP } from '@/lib/constants/item-types';
import { UserAvatar } from '@/components/shared/UserAvatar';

const PRO_TYPES = new Set(['file', 'image']);

interface SessionUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  itemTypes: SidebarItemType[];
  sidebarCollections: { favorites: SidebarCollection[]; recent: SidebarCollection[] };
  user: SessionUser | null;
}

function SidebarContent({
  expanded,
  onToggle,
  itemTypes,
  sidebarCollections,
  user,
}: {
  expanded: boolean;
  onToggle: () => void;
  itemTypes: SidebarItemType[];
  sidebarCollections: { favorites: SidebarCollection[]; recent: SidebarCollection[] };
  user: SessionUser | null;
}) {
  const [collectionsOpen, setCollectionsOpen] = useState(true);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header: Navigation label + toggle */}
      <div
        className={cn(
          'flex items-center border-b border-border shrink-0 h-14',
          expanded ? 'px-4 justify-between' : 'justify-center'
        )}
      >
        {expanded && (
          <span className="text-sm font-semibold text-foreground">Navigation</span>
        )}
        <button
          onClick={onToggle}
          aria-label="Toggle sidebar"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <PanelLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Types */}
      <div className="p-3">
        {expanded && (
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1">
            Types
          </p>
        )}
        {itemTypes.map((type) => {
          const Icon = ICON_MAP[type.icon];
          return (
            <Link
              key={type.id}
              href={`/items/${type.name}s`}
              title={expanded ? undefined : `${type.name}s`}
              className={cn(
                'flex items-center rounded-md text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors',
                expanded
                  ? 'justify-between px-2 py-1.5'
                  : 'justify-center p-2'
              )}
            >
              {expanded ? (
                <>
                  <span className="flex items-center gap-2">
                    {Icon && (
                      <Icon className="h-4 w-4 shrink-0" style={{ color: type.color }} />
                    )}
                    <span className="capitalize">{type.name}s</span>
                    {PRO_TYPES.has(type.name) && (
                      <Badge variant="outline" className="h-4 px-1 text-[10px] font-semibold text-muted-foreground border-muted-foreground/40 leading-none">
                        PRO
                      </Badge>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">{type.count}</span>
                </>
              ) : (
                Icon && <Icon className="h-4 w-4" style={{ color: type.color }} />
              )}
            </Link>
          );
        })}
      </div>

      {/* Collections — only shown when expanded */}
      {expanded && (
        <div className="p-3 border-t border-border">
          <button
            onClick={() => setCollectionsOpen((o) => !o)}
            className="flex items-center justify-between w-full px-2 mb-1 group"
          >
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Collections
            </span>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
                collectionsOpen ? 'rotate-0' : '-rotate-90'
              )}
            />
          </button>

          {collectionsOpen && (
            <>
              {/* Favorites */}
              {sidebarCollections.favorites.length > 0 && (
                <>
                  <p className="text-xs text-muted-foreground px-2 mt-2 mb-1">Favorites</p>
                  {sidebarCollections.favorites.map((c) => (
                    <Link
                      key={c.id}
                      href={`/collections/${c.id}`}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Star className="h-3.5 w-3.5 shrink-0 text-yellow-400 fill-yellow-400" />
                      <span className="truncate">{c.name}</span>
                    </Link>
                  ))}
                </>
              )}

              {/* Recent */}
              {sidebarCollections.recent.length > 0 && (
                <>
                  <p className="text-xs text-muted-foreground px-2 mt-3 mb-1">Recent</p>
                  {sidebarCollections.recent.map((c) => (
                    <Link
                      key={c.id}
                      href={`/collections/${c.id}`}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: c.dominantColor }}
                      />
                      <span className="truncate">{c.name}</span>
                    </Link>
                  ))}
                </>
              )}

              {/* View all */}
              <Link
                href="/collections"
                className="block px-2 py-1.5 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                View all collections
              </Link>
            </>
          )}
        </div>
      )}

      {/* User area */}
      <div className="mt-auto p-3 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              'flex items-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors w-full bg-transparent border-0',
              expanded ? 'gap-2 px-2 py-1.5' : 'justify-center p-2'
            )}
            aria-label="User menu"
          >
            <UserAvatar name={user?.name} image={user?.image} size={28} />
            {expanded && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate">{user?.name ?? 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email ?? ''}</p>
              </div>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-48">
            <DropdownMenuItem>
              <Link href="/profile" className="flex items-center gap-2 w-full">
                <User className="h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => signOut({ callbackUrl: '/sign-in' })}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function Sidebar({ isOpen, onToggle, onClose, itemTypes, sidebarCollections, user }: SidebarProps) {
  return (
    <>
      {/* Desktop: inline collapsible sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-border bg-sidebar shrink-0 overflow-hidden transition-all duration-200',
          isOpen ? 'w-60' : 'w-14'
        )}
      >
        <SidebarContent
          expanded={isOpen}
          onToggle={onToggle}
          itemTypes={itemTypes}
          sidebarCollections={sidebarCollections}
          user={user}
        />
      </aside>

      {/* Mobile: always a drawer overlay */}
      <div
        className={cn(
          'md:hidden fixed inset-0 z-20 bg-black/50 transition-opacity duration-200',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          'md:hidden fixed inset-y-0 left-0 z-30 w-60 flex flex-col bg-sidebar border-r border-border transition-transform duration-200',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent
          expanded={true}
          onToggle={onClose}
          itemTypes={itemTypes}
          sidebarCollections={sidebarCollections}
          user={user}
        />
      </aside>
    </>
  );
}
