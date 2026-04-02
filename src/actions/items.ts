'use server';

import { z } from 'zod';
import { auth } from '@/auth';
import { updateItem as updateItemDb, deleteItem as deleteItemDb, createItem as createItemDb, toggleFavoriteItem as toggleFavoriteItemDb } from '@/lib/db/items';
import type { ItemDetail } from '@/lib/db/items';
import { deleteFromR2 } from '@/lib/r2';

const ITEM_TYPE_VALUES = ['snippet', 'prompt', 'command', 'note', 'link', 'file', 'image'] as const;

const CreateItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().nullable().optional(),
  content: z.string().nullable().optional(),
  url: z
    .string()
    .trim()
    .url('Must be a valid URL')
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  fileUrl: z.string().nullable().optional(),
  fileName: z.string().nullable().optional(),
  fileSize: z.number().nullable().optional(),
  language: z.string().trim().nullable().optional(),
  tags: z.array(z.string().trim().min(1)),
  collectionIds: z.array(z.string().min(1)).optional().default([]),
  itemTypeName: z.enum(ITEM_TYPE_VALUES),
});

export type CreateItemInput = z.infer<typeof CreateItemSchema>;

export async function createItem(
  input: CreateItemInput
): Promise<ActionResult<ItemDetail>> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = CreateItemSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? 'Invalid input' };
  }

  const data = parsed.data;

  if (data.itemTypeName === 'link' && !data.url) {
    return { success: false, error: 'URL is required for link items' };
  }
  if ((data.itemTypeName === 'file' || data.itemTypeName === 'image') && !data.fileUrl) {
    return { success: false, error: 'A file upload is required' };
  }

  const created = await createItemDb(userId, {
    title: data.title,
    description: data.description ?? null,
    content: data.content ?? null,
    url: data.url ?? null,
    fileUrl: data.fileUrl ?? null,
    fileName: data.fileName ?? null,
    fileSize: data.fileSize ?? null,
    language: data.language ?? null,
    tags: data.tags,
    collectionIds: data.collectionIds ?? [],
    itemTypeName: data.itemTypeName,
  });

  if (!created) {
    return { success: false, error: 'Failed to create item' };
  }

  return { success: true, data: created };
}

const UpdateItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().nullable().optional(),
  content: z.string().nullable().optional(),
  url: z
    .string()
    .trim()
    .url('Must be a valid URL')
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  language: z.string().trim().nullable().optional(),
  tags: z.array(z.string().trim().min(1)),
  collectionIds: z.array(z.string().min(1)).optional().default([]),
});

export type UpdateItemInput = z.infer<typeof UpdateItemSchema>;

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function updateItem(
  itemId: string,
  input: UpdateItemInput
): Promise<ActionResult<ItemDetail>> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = UpdateItemSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? 'Invalid input' };
  }

  const data = parsed.data;

  const updated = await updateItemDb(userId, itemId, {
    title: data.title,
    description: data.description ?? null,
    content: data.content ?? null,
    url: data.url ?? null,
    language: data.language ?? null,
    tags: data.tags,
    collectionIds: data.collectionIds ?? [],
  });

  if (!updated) {
    return { success: false, error: 'Item not found' };
  }

  return { success: true, data: updated };
}

export async function toggleFavoriteItem(
  itemId: string
): Promise<{ success: true; isFavorite: boolean } | { success: false; error: string }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  const result = await toggleFavoriteItemDb(userId, itemId);
  if (result === null) {
    return { success: false, error: 'Item not found' };
  }

  return { success: true, isFavorite: result };
}

export async function deleteItem(
  itemId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  const result = await deleteItemDb(userId, itemId);
  if (!result.deleted) {
    return { success: false, error: 'Item not found' };
  }

  if (result.fileUrl) {
    try {
      await deleteFromR2(result.fileUrl);
    } catch {
      // Non-fatal: item is deleted from DB, R2 cleanup failed silently
    }
  }

  return { success: true };
}
