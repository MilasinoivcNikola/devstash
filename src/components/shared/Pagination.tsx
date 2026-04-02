'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  basePath: string;
};

function pageUrl(basePath: string, page: number) {
  return page === 1 ? basePath : `${basePath}?page=${page}`;
}

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | 'ellipsis')[] = [1];

  if (current > 3) pages.push('ellipsis');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('ellipsis');

  pages.push(total);
  return pages;
}

export default function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <nav className="flex items-center justify-center gap-1 mt-8" aria-label="Pagination">
      {currentPage === 1 ? (
        <span className="inline-flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground/40 cursor-not-allowed">
          <ChevronLeft className="h-4 w-4" />
        </span>
      ) : (
        <Link
          href={pageUrl(basePath, currentPage - 1)}
          className="inline-flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}

      {pages.map((page, i) =>
        page === 'ellipsis' ? (
          <span key={`e-${i}`} className="inline-flex items-center justify-center h-9 w-9 text-muted-foreground text-sm">
            ...
          </span>
        ) : page === currentPage ? (
          <span
            key={page}
            className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-primary text-primary-foreground text-sm font-medium"
          >
            {page}
          </span>
        ) : (
          <Link
            key={page}
            href={pageUrl(basePath, page)}
            className="inline-flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors text-sm"
          >
            {page}
          </Link>
        )
      )}

      {currentPage === totalPages ? (
        <span className="inline-flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground/40 cursor-not-allowed">
          <ChevronRight className="h-4 w-4" />
        </span>
      ) : (
        <Link
          href={pageUrl(basePath, currentPage + 1)}
          className="inline-flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}
