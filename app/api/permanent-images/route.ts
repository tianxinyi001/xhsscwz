import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const PERMANENT_DIR = path.join(process.cwd(), 'public', 'permanent-images');

function getExtension(contentType: string | null): string {
  switch (contentType) {
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/avif':
      return '.avif';
    case 'image/gif':
      return '.gif';
    case 'image/jpeg':
    default:
      return '.jpg';
  }
}

function generateUniqueFilename(noteId: string, originalUrl: string, extension: string): string {
  const timestamp = Date.now();
  const hash = crypto.createHash('md5').update(originalUrl).digest('hex').slice(0, 8);
  return `${noteId}_${hash}_${timestamp}${extension}`;
}

async function fetchImageBuffer(imageUrl: string) {
  const response = await fetch(imageUrl, {
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
    throw new Error(`Image download failed: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: response.headers.get('content-type'),
  };
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, noteId } = await request.json();
    console.log('Received permanent image request:', { imageUrl, noteId });

    if (!imageUrl || !noteId) {
      return NextResponse.json({ success: false, error: 'Missing required params' }, { status: 400 });
    }

    if (!/^https?:\/\//.test(imageUrl)) {
      return NextResponse.json({ success: false, error: 'imageUrl must be absolute' }, { status: 400 });
    }

    const { buffer, contentType } = await fetchImageBuffer(imageUrl);
    const extension = getExtension(contentType);
    const filename = generateUniqueFilename(noteId, imageUrl, extension);

    await fs.mkdir(PERMANENT_DIR, { recursive: true });
    await fs.writeFile(path.join(PERMANENT_DIR, filename), buffer);

    return NextResponse.json({
      success: true,
      imageUrl: `/permanent-images/${filename}`,
      filename,
    });
  } catch (error) {
    console.error('Permanent image save failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Save failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return NextResponse.json({ success: false, error: 'Missing noteId' }, { status: 400 });
    }

    let files: string[] = [];
    try {
      files = await fs.readdir(PERMANENT_DIR);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    const images = files.filter(file => file.startsWith(`${noteId}_`));

    return NextResponse.json({ success: true, images });
  } catch (error) {
    console.error('Permanent image list failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'List failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { filename } = await request.json();
    if (!filename) {
      return NextResponse.json({ success: false, error: 'Missing filename' }, { status: 400 });
    }

    try {
      await fs.unlink(path.join(PERMANENT_DIR, filename));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    );
  }
}
