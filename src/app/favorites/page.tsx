import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getFavoriteItems } from '@/lib/db/items';
import { getFavoriteCollections } from '@/lib/db/collections';
import FavoritesList from './FavoritesList';

export default async function FavoritesPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/sign-in');

  const [items, collections] = await Promise.all([
    getFavoriteItems(userId),
    getFavoriteCollections(userId),
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Favorites</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {items.length} item{items.length !== 1 ? 's' : ''} · {collections.length} collection{collections.length !== 1 ? 's' : ''}
        </p>
      </div>

      {items.length === 0 && collections.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground text-sm">No favorites yet. Star items or collections to see them here.</p>
        </div>
      ) : (
        <FavoritesList items={items} collections={collections} />
      )}
    </div>
  );
}
