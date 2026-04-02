import { getItemsByType } from '@/lib/db/items';
import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { ItemsGridWrapper } from '@/components/items/ItemsClientWrapper';
import CreateItemDialog from '@/components/items/CreateItemDialog';
import Pagination from '@/components/shared/Pagination';
import { ITEMS_PER_PAGE } from '@/lib/constants/item-types';

const VALID_TYPES = ['snippet', 'prompt', 'command', 'note', 'file', 'image', 'link'] as const;
const CREATABLE_TYPES = new Set(['snippet', 'prompt', 'command', 'note', 'link', 'file', 'image']);

export default async function ItemsTypePage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { type: typeSlug } = await params;
  const { page: pageParam } = await searchParams;

  // Convert plural slug (e.g. "snippets") to singular type name (e.g. "snippet")
  const typeName = typeSlug.endsWith('s') ? typeSlug.slice(0, -1) : typeSlug;

  if (!VALID_TYPES.includes(typeName as (typeof VALID_TYPES)[number])) {
    notFound();
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/sign-in');

  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);
  const { items, total } = await getItemsByType(userId, typeName, currentPage, ITEMS_PER_PAGE);
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground capitalize">{typeSlug}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{total} item{total !== 1 ? 's' : ''}</p>
        </div>
        {CREATABLE_TYPES.has(typeName) && (
          <CreateItemDialog
            defaultType={typeName as 'snippet' | 'prompt' | 'command' | 'note' | 'link' | 'file' | 'image'}
            triggerLabel={`New ${typeName.charAt(0).toUpperCase() + typeName.slice(1)}`}
          />
        )}
      </div>

      {items.length === 0 && currentPage === 1 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground text-sm">No {typeSlug} yet.</p>
        </div>
      ) : (
        <>
          <ItemsGridWrapper
            items={items}
            layout={typeName === 'image' ? 'gallery' : typeName === 'file' ? 'file-list' : 'grid'}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath={`/items/${typeSlug}`}
          />
        </>
      )}
    </div>
  );
}
