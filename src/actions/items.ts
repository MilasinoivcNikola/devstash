'use server';

import { z } from 'zod';
import { auth } from '@/auth';
import { updateItem as updateItemDb } from '@/lib/db/items';
import type { ItemDetail } from '@/lib/db/items';

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
  });

  if (!updated) {
    return { success: false, error: 'Item not found' };
  }

  return { success: true, data: updated };
}
