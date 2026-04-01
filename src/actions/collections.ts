'use server';

import { z } from 'zod';
import { auth } from '@/auth';
import { createCollection as createCollectionDb, getUserCollections as getUserCollectionsDb } from '@/lib/db/collections';
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
