import "server-only";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export function s3Configured(): boolean {
  return Boolean(process.env.AWS_S3_BUCKET && process.env.AWS_REGION);
}

export function publicObjectUrl(key: string): string {
  const normalizedKey = key.replace(/^\/+/, "");
  const base = process.env.AWS_S3_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (base) return `${base}/${normalizedKey}`;
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  if (!bucket || !region) throw new Error("Image storage is not configured.");
  return `https://${bucket}.s3.${region}.amazonaws.com/${normalizedKey}`;
}

function client(): S3Client {
  const region = process.env.AWS_REGION;
  if (!region) throw new Error("Image storage is not configured.");
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (accessKeyId && secretAccessKey) return new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
  return new S3Client({ region });
}

export async function uploadPublicObject(
  key: string,
  body: Buffer,
  contentType: string,
  cacheControl = "public, max-age=31536000",
): Promise<string> {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket || !process.env.AWS_REGION) throw new Error("Image storage is not configured.");
  await client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key.replace(/^\/+/, ""),
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
    }),
  );
  return publicObjectUrl(key);
}
