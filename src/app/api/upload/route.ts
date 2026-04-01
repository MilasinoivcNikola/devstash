import { PutObjectCommand } from '@aws-sdk/client-s3';
import { auth } from '@/auth';
import { getR2Client, R2_BUCKET } from '@/lib/r2';
import { randomUUID } from 'crypto';

const IMAGE_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

const FILE_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'application/json': 'json',
  'application/x-yaml': 'yaml',
  'text/yaml': 'yaml',
  'application/xml': 'xml',
  'text/xml': 'xml',
  'text/csv': 'csv',
  'application/toml': 'toml',
};

const IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const FILE_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file');
  const itemType = formData.get('itemType') as string | null;

  if (!(file instanceof File)) {
    return Response.json({ error: 'No file provided' }, { status: 400 });
  }
  if (!itemType || (itemType !== 'file' && itemType !== 'image')) {
    return Response.json({ error: 'Invalid item type' }, { status: 400 });
  }

  const mimeType = file.type;
  const isImage = itemType === 'image';
  const allowedTypes = isImage ? IMAGE_TYPES : FILE_TYPES;
  const ext = allowedTypes[mimeType];

  if (!ext) {
    return Response.json({ error: `File type ${mimeType} is not allowed` }, { status: 400 });
  }

  const maxBytes = isImage ? IMAGE_MAX_BYTES : FILE_MAX_BYTES;
  if (file.size > maxBytes) {
    const maxMb = maxBytes / 1024 / 1024;
    return Response.json({ error: `File exceeds ${maxMb} MB limit` }, { status: 400 });
  }

  const key = `uploads/${userId}/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const r2 = getR2Client();
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  return Response.json({
    key,
    fileName: file.name,
    fileSize: file.size,
    contentType: mimeType,
  });
}
