'use server';

import { z } from 'zod';
import { auth } from '@/auth';
import {
  createCollection as createCollectionDb,
  updateCollection as updateCollectionDb,
  deleteCollection as deleteCollectionDb,
  getUserCollections as getUserCollectionsDb,
  toggleFavoriteCollection as toggleFavoriteCollectionDb,
} from '@/lib/db/collections';
import type { CollectionOption } from '@/lib/db/collections';

const CreateCollectionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().nullable().optional(),
});

export type CreateCollectionInput = z.infer<typeof CreateCollectionSchema>;

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getUserCollections(): Promise<CollectionOption[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  return getUserCollectionsDb(userId);
}

export async function createCollection(
  input: CreateCollectionInput
): Promise<ActionResult<{ id: string; name: string }>> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = CreateCollectionSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? 'Invalid input' };
  }

  const data = parsed.data;

  const created = await createCollectionDb(userId, {
    name: data.name,
    description: data.description ?? null,
  });

  return { success: true, data: { id: created.id, name: created.name } };
}

const UpdateCollectionSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().nullable().optional(),
});

export type UpdateCollectionInput = z.infer<typeof UpdateCollectionSchema>;

export async function updateCollection(
  input: UpdateCollectionInput
): Promise<ActionResult<{ id: string; name: string }>> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = UpdateCollectionSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? 'Invalid input' };
  }

  const data = parsed.data;

  try {
    const updated = await updateCollectionDb(userId, data.id, {
      name: data.name,
      description: data.description ?? null,
    });
    return { success: true, data: { id: updated.id, name: updated.name } };
  } catch {
    return { success: false, error: 'Collection not found' };
  }
}

export async function toggleFavoriteCollection(
  collectionId: string
): Promise<{ success: true; isFavorite: boolean } | { success: false; error: string }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  const result = await toggleFavoriteCollectionDb(userId, collectionId);
  if (result === null) {
    return { success: false, error: 'Collection not found' };
  }

  return { success: true, isFavorite: result };
}

export async function deleteCollection(
  collectionId: string
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const deleted = await deleteCollectionDb(userId, collectionId);
    return { success: true, data: { id: deleted.id } };
  } catch {
    return { success: false, error: 'Collection not found' };
  }
}
