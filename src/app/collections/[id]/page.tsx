import { getCollectionById } from '@/lib/db/collections';
import { getItemsByCollection } from '@/lib/db/items';
import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { ItemsGridWrapper } from '@/components/items/ItemsClientWrapper';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import CollectionDetailActions from '@/components/collections/CollectionDetailActions';
import Pagination from '@/components/shared/Pagination';
import { COLLECTIONS_PER_PAGE } from '@/lib/constants/item-types';

export default async function CollectionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/sign-in');

  const collection = await getCollectionById(userId, id);
  if (!collection) notFound();

  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);
  const { items, total } = await getItemsByCollection(userId, id, currentPage, COLLECTIONS_PER_PAGE);
  const totalPages = Math.ceil(total / COLLECTIONS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <Link
          href="/collections"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Collections
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{collection.name}</h1>
            {collection.description && (
              <p className="text-sm text-muted-foreground mt-0.5">{collection.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-0.5">
              {total} item{total !== 1 ? 's' : ''}
            </p>
          </div>
          <CollectionDetailActions collection={collection} />
        </div>
      </div>

      {items.length === 0 && currentPage === 1 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground text-sm">No items in this collection yet.</p>
        </div>
      ) : (
        <>
          <ItemsGridWrapper items={items} layout="grouped" />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath={`/collections/${id}`}
          />
        </>
      )}
    </div>
  );
}
