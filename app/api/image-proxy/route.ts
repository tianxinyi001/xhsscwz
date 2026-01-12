import { NextRequest, NextResponse } from 'next/server';

function buildCandidateUrls(url: string): string[] {
  const candidates = [url];

  if (url.includes('!')) {
    const baseUrl = url.split('!')[0];
    if (baseUrl && baseUrl !== url) {
      candidates.push(baseUrl);
    }

    const relaxedUrl = url.replace('!nd_prv', '!nd_dft');
    if (relaxedUrl !== url) {
      candidates.push(relaxedUrl);
    }
  }

  return Array.from(new Set(candidates));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ error: 'missing image url' }, { status: 400 });
    }

    if (!imageUrl.includes('xhscdn.com')) {
      return NextResponse.json({ error: 'invalid image url' }, { status: 400 });
    }

    const httpsUrl = imageUrl.startsWith('http://')
      ? imageUrl.replace('http://', 'https://')
      : imageUrl;

    const candidateUrls = buildCandidateUrls(httpsUrl);

    let lastError: string | undefined;
    const maxRetries = Math.max(3, candidateUrls.length);

    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      try {
        const urlIndex = Math.min(attempt - 1, candidateUrls.length - 1);
        const targetUrl = candidateUrls[urlIndex];

        const response = await fetch(targetUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.xiaohongshu.com/',
            'Origin': 'https://www.xiaohongshu.com',
            'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          lastError = `HTTP ${response.status}: ${response.statusText}`;

          if (response.status >= 400 && response.status < 500 && attempt < candidateUrls.length) {
            continue;
          }

          if (response.status >= 400 && response.status < 500) {
            break;
          }

          continue;
        }

        const imageBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        return new NextResponse(imageBuffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
            'X-Image-Proxy': 'success',
            'X-Retry-Count': attempt.toString(),
          },
        });
      } catch (fetchError) {
        lastError = fetchError instanceof Error ? fetchError.message : 'fetch failed';
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    return NextResponse.json(
      {
        error: 'image proxy failed',
        details: lastError,
        url: httpsUrl,
      },
      { status: 502 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'image proxy failed',
        details: error instanceof Error ? error.message : 'unknown error',
      },
      { status: 500 }
    );
  }
}
