'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Pencil, Trash2, Star } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { toggleFavoriteCollection } from '@/actions/collections';
import EditCollectionDialog from './EditCollectionDialog';
import DeleteCollectionDialog from './DeleteCollectionDialog';

type CollectionCardMenuProps = {
  collection: {
    id: string;
    name: string;
    description: string | null;
    isFavorite: boolean;
  };
};

export default function CollectionCardMenu({ collection }: CollectionCardMenuProps) {
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
      <DropdownMenu>
        <DropdownMenuTrigger
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-2 p-0.5 rounded-sm hover:bg-accent"
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleFavorite}>
            <Star
              className="h-4 w-4 mr-2"
              fill={isFavorite ? '#facc15' : 'none'}
              stroke={isFavorite ? '#facc15' : 'currentColor'}
            />
            {isFavorite ? 'Unfavorite' : 'Favorite'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditCollectionDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        collection={collection}
      />
      <DeleteCollectionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        collection={collection}
      />
    </>
  );
}
