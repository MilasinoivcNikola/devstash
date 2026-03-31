'use client';

import { Menu, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import CreateItemDialog from "@/components/items/CreateItemDialog";

interface TopBarProps {
  onSidebarOpen?: () => void;
  logoHref?: string;
}

export default function TopBar({ onSidebarOpen, logoHref = '/' }: TopBarProps) {
  return (
    <header className="flex items-center h-14 px-4 border-b border-border bg-background shrink-0 gap-4">
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onSidebarOpen}
          aria-label="Open sidebar"
          className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href={logoHref} className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
            S
          </div>
          <span className="font-semibold text-foreground tracking-tight">DevStash</span>
        </Link>
      </div>

      {/* Search — centered */}
      <div className="flex flex-1 justify-center">
        <div className="flex items-center gap-2 w-full max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              className="pl-9 bg-muted border-0 focus-visible:ring-1"
            />
          </div>
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Actions */}
      <div className="hidden md:flex items-center gap-2 justify-end shrink-0">
        <Button variant="outline" size="sm">
          New Collection
        </Button>
        <CreateItemDialog />
      </div>
    </header>
  );
}
