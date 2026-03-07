import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/proxy/fetch-file?url=<base64url>&name=<filename>
 *
 * Server-side proxy that fetches a remote file (e.g. S3 direct URL) and
 * returns it with a Content-Disposition: attachment header so browsers
 * trigger a download regardless of cross-origin restrictions.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const encodedUrl = searchParams.get('url');
  const name = searchParams.get('name') || 'archivo';
  const inline = searchParams.has('inline');

  if (!encodedUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  let targetUrl: string;
  try {
    targetUrl = Buffer.from(encodedUrl, 'base64').toString('utf-8');
    // Basic validation: must be an absolute http(s) URL
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Invalid protocol');
    }
  } catch {
    return NextResponse.json({ error: 'Invalid url parameter' }, { status: 400 });
  }

  try {
    const upstream = await fetch(targetUrl, { cache: 'no-store' });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream responded with ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const contentType =
      upstream.headers.get('Content-Type') || 'application/octet-stream';
    const body = await upstream.arrayBuffer();

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': inline ? 'private, max-age=300' : 'private, no-store',
    };
    if (!inline) {
      headers['Content-Disposition'] = `attachment; filename*=UTF-8''${encodeURIComponent(name)}`;
    }

    return new NextResponse(body, { status: 200, headers });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch file from upstream' },
      { status: 502 }
    );
  }
}
