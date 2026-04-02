'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { toggleFavoriteCollection } from '@/actions/collections';
import EditCollectionDialog from './EditCollectionDialog';
import DeleteCollectionDialog from './DeleteCollectionDialog';

type CollectionDetailActionsProps = {
  collection: {
    id: string;
    name: string;
    description: string | null;
    isFavorite: boolean;
  };
};

export default function CollectionDetailActions({ collection }: CollectionDetailActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(collection.isFavorite);

  async function handleToggleFavorite() {
    const prev = isFavorite;
    setIsFavorite(!prev);
    const result = await toggleFavoriteCollection(collection.id);
    if (!result.success) {
      setIsFavorite(prev);
      toast.error(result.error);
      return;
    }
    toast.success(result.isFavorite ? 'Added to favorites' : 'Removed from favorites');
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="h-3.5 w-3.5 mr-1.5" />
          Edit
        </Button>
        <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Delete
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleToggleFavorite}>
          <Star
            className="h-3.5 w-3.5"
            fill={isFavorite ? '#facc15' : 'none'}
            stroke={isFavorite ? '#facc15' : 'currentColor'}
          />
        </Button>
      </div>

      <EditCollectionDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        collection={collection}
      />
      <DeleteCollectionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        collection={collection}
        redirectTo="/collections"
      />
    </>
  );
}
