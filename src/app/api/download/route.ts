import { GetObjectCommand } from '@aws-sdk/client-s3';
import { auth } from '@/auth';
import { getR2Client, R2_BUCKET } from '@/lib/r2';

export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  if (!key) {
    return new Response('Missing key', { status: 400 });
  }

  // Key format: uploads/{userId}/{uuid}.{ext}
  // Validate the key belongs to the requesting user
  if (!key.startsWith(`uploads/${userId}/`)) {
    return new Response('Forbidden', { status: 403 });
  }

  const r2 = getR2Client();
  let obj;
  try {
    obj = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  } catch {
    return new Response('Not found', { status: 404 });
  }

  if (!obj.Body) {
    return new Response('Not found', { status: 404 });
  }

  const contentType = obj.ContentType ?? 'application/octet-stream';
  const rawName = searchParams.get('name');
  const safeName = rawName ? rawName.replace(/[^\w\-. ]/g, '_') : key.split('/').pop() ?? 'download';
  const isInline = contentType.startsWith('image/');
  const disposition = isInline ? 'inline' : `attachment; filename="${safeName}"`;

  const stream = obj.Body.transformToWebStream();
  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Content-Disposition': disposition,
  };
  if (obj.ContentLength) {
    headers['Content-Length'] = String(obj.ContentLength);
  }

  return new Response(stream, { headers });
}
