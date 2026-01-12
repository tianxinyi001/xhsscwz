import { NextRequest, NextResponse } from 'next/server';
import { extractXhsFromHtml, normalizeImageUrl } from '@/lib/xhs-image-extractor';

const DEFAULT_HEADERS = {
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8'
};

export async function POST(request: NextRequest) {
  try {
    const { url, quickPreview } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'Missing XHS url', success: false }, { status: 400 });
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: DEFAULT_HEADERS,
      cache: 'no-store'
    });

    if (!response.ok) {
      const message = `Failed to fetch page: ${response.status} ${response.statusText}`;
      return NextResponse.json({ error: message, success: false }, { status: response.status });
    }

    const html = await response.text();
    const parsed = extractXhsFromHtml(html, url);

    const cover = parsed.cover ? normalizeImageUrl(parsed.cover) : '';
    const images = parsed.images.map((item) => normalizeImageUrl(item)).filter(Boolean);

    if (quickPreview) {
      return NextResponse.json({
        success: true,
        data: {
          title: cleanText(parsed.title || 'Untitled'),
          cover,
          noteId: parsed.noteId,
          url
        },
        raw: null
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        title: cleanText(parsed.title || 'Untitled'),
        author: '',
        content: '',
        cover,
        images,
        tags: [],
        noteId: parsed.noteId,
        stats: {
          likes: 0,
          comments: 0,
          shares: 0
        },
        publishTime: null,
        url
      },
      raw: null
    });
  } catch (error) {
    console.error('Extract API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Extract failed',
        success: false
      },
      { status: 500 }
    );
  }
}

function cleanText(text: any): string {
  if (!text) return '';
  return String(text)
    .replace(/^[\u200B-\u200D\uFEFF]+|[\u200B-\u200D\uFEFF]+$/g, '')
    .replace(/^\s+|\s+$/g, '');
}
