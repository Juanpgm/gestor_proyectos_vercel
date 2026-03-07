import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * GET /api/proxy/s3-file?key=<s3_key>&bucket=<bucket>&inline=1
 *
 * Generates a SigV4 presigned URL for an S3 object and redirects to it,
 * or streams the content if `inline=1` is set.
 *
 * Requires env vars:
 *   AWS_S3_ACCESS_KEY_ID      - IAM access key with s3:GetObject on the bucket
 *   AWS_S3_SECRET_ACCESS_KEY  - Corresponding secret key
 *   AWS_S3_REGION             - e.g. us-east-2
 *   AWS_S3_BUCKET             - Default bucket name (overridden by `bucket` param)
 */

const DEFAULT_BUCKET = process.env.AWS_S3_BUCKET || 'unidades-proyecto-documents';
// Live backend URLs indicate the bucket is in us-east-2.
const REGION = process.env.AWS_S3_REGION || 'us-east-2';

function getS3Client() {
  const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    region: REGION,
    credentials: { accessKeyId, secretAccessKey },
    // Force path-style to match the existing bucket URL pattern
    forcePathStyle: true,
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const s3Key = searchParams.get('key');
  const bucket = searchParams.get('bucket') || DEFAULT_BUCKET;
  const inline = searchParams.has('inline');
  const download = searchParams.get('name'); // optional filename for download

  if (!s3Key) {
    return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
  }

  const client = getS3Client();
  if (!client) {
    return NextResponse.json(
      { error: 'S3 credentials not configured. Set AWS_S3_ACCESS_KEY_ID and AWS_S3_SECRET_ACCESS_KEY.' },
      { status: 503 }
    );
  }

  try {
    const command = new GetObjectCommand({ Bucket: bucket, Key: s3Key });
    // Generate SigV4 presigned URL valid for 15 minutes
    const presignedUrl = await getSignedUrl(client, command, { expiresIn: 900 });

    if (inline) {
      // For images: redirect to the SigV4 presigned URL directly
      return NextResponse.redirect(presignedUrl, { status: 302 });
    }

    // For downloads: fetch content and return with proper headers
    const upstream = await fetch(presignedUrl, { cache: 'no-store' });
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `S3 returned ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const contentType = upstream.headers.get('Content-Type') || 'application/octet-stream';
    const body = await upstream.arrayBuffer();
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=600',
    };
    if (download) {
      headers['Content-Disposition'] = `attachment; filename*=UTF-8''${encodeURIComponent(download)}`;
    }

    return new NextResponse(body, { status: 200, headers });
  } catch (err) {
    console.error('[s3-file proxy] Error:', err);
    return NextResponse.json({ error: 'Failed to generate or fetch S3 object' }, { status: 502 });
  }
}
