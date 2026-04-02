'use client';

import { useState, useEffect, useCallback } from 'react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import CommandPalette from './CommandPalette';
import ItemDrawer from '@/components/items/ItemDrawer';
import { SidebarItemType } from '@/lib/db/items';
import { SidebarCollection } from '@/lib/db/collections';
import { EditorPreferencesProvider } from '@/contexts/EditorPreferencesContext';
import type { EditorPreferences } from '@/lib/db/editor-preferences';

interface SessionUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface DashboardShellProps {
  children: React.ReactNode;
  itemTypes: SidebarItemType[];
  sidebarCollections: { favorites: SidebarCollection[]; recent: SidebarCollection[] };
  user: SessionUser | null;
  editorPreferences: EditorPreferences;
}

export default function DashboardShell({ children, itemTypes, sidebarCollections, user, editorPreferences }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [commandOpen, setCommandOpen] = useState(false);
  const [drawerItemId, setDrawerItemId] = useState<string | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setCommandOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <EditorPreferencesProvider initialPreferences={editorPreferences}>
      <div className="flex flex-col h-screen w-screen overflow-x-hidden bg-background text-foreground">
        <TopBar
          onSidebarOpen={() => setSidebarOpen(true)}
          logoHref={user ? '/dashboard' : '/'}
          onSearchClick={() => setCommandOpen(true)}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen((o) => !o)}
            onClose={() => setSidebarOpen(false)}
            itemTypes={itemTypes}
            sidebarCollections={sidebarCollections}
            user={user}
          />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
        <CommandPalette
          open={commandOpen}
          onOpenChange={setCommandOpen}
          onItemSelect={setDrawerItemId}
        />
        <ItemDrawer itemId={drawerItemId} onClose={() => setDrawerItemId(null)} />
      </div>
    </EditorPreferencesProvider>
  );
}
