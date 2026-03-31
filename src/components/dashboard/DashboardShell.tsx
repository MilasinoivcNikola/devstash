'use client';

import { useState } from 'react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import { SidebarItemType } from '@/lib/db/items';
import { SidebarCollection } from '@/lib/db/collections';

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
}

export default function DashboardShell({ children, itemTypes, sidebarCollections, user }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col h-screen w-screen overflow-x-hidden bg-background text-foreground">
      <TopBar onSidebarOpen={() => setSidebarOpen(true)} logoHref={user ? '/dashboard' : '/'} />
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
    </div>
  );
}
