import { auth } from '@/auth';
import { getItemById } from '@/lib/db/items';
import { NextResponse } from 'next/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const item = await getItemById(userId, id);
  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(item);
}
