import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();
const bucketName = (process.env.NEXT_PUBLIC_SUPABASE_IMAGE_BUCKET ?? 'covers').trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function generateUniqueFilename(noteId: string, originalUrl: string): string {
  const timestamp = Date.now();
  const hash = crypto.createHash('md5').update(originalUrl).digest('hex').slice(0, 8);
  return `${noteId}_${hash}_${timestamp}.jpg`;
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
  return Buffer.from(arrayBuffer);
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, noteId } = await request.json();
    console.log('permanent-images config:', {
      bucketName,
      hasSupabaseUrl: Boolean(supabaseUrl),
      hasAnonKey: Boolean(supabaseAnonKey),
    });
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.warn('permanent-images buckets list error:', bucketsError.message);
    } else {
      console.log('permanent-images buckets:', (buckets || []).map(bucket => bucket.name));
    }

    if (!imageUrl || !noteId) {
      return NextResponse.json({ success: false, error: 'Missing required params' }, { status: 400 });
    }

    if (!/^https?:\/\//.test(imageUrl)) {
      return NextResponse.json({ success: false, error: 'imageUrl must be absolute' }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ success: false, error: 'Supabase env vars missing' }, { status: 500 });
    }

    const buffer = await fetchImageBuffer(imageUrl);
    const filename = generateUniqueFilename(noteId, imageUrl);

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filename, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filename);
    const publicUrl = publicUrlData?.publicUrl;

    if (!publicUrl) {
      return NextResponse.json({ success: false, error: 'Failed to get public url' }, { status: 500 });
    }

    return NextResponse.json({ success: true, imageUrl: publicUrl, filename });
  } catch (error) {
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

    const { data, error } = await supabase.storage.from(bucketName).list();
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const noteImages = (data || []).filter(file => file.name.startsWith(noteId));

    return NextResponse.json({ success: true, images: noteImages.map(file => file.name) });
  } catch (error) {
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

    const { error } = await supabase.storage.from(bucketName).remove([filename]);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    );
  }
}
