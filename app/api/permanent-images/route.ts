import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Supabase 配置
const SUPABASE_URL = 'https://gfwbgnzzvhsmmpwuytjr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmd2Jnbnp6dmhzbW1wd3V5dGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNTU1OTgsImV4cCI6MjA2NTYzMTU5OH0.OKSKkIki_BUYcAvgXUiB0AB__dcBtdDBOZOl_EsnrEw';
const BUCKET = 'covers';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function generateUniqueFilename(noteId: string, originalUrl: string): string {
  const timestamp = Date.now();
  const hash = crypto.createHash('md5').update(originalUrl).digest('hex').slice(0, 8);
  return `${noteId}_${hash}_${timestamp}.jpg`;
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, noteId } = await request.json();
    console.log('收到保存请求:', { imageUrl, noteId });

    if (!imageUrl || !noteId) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少必要参数' 
      }, { status: 400 });
    }

    if (!/^https?:\/\//.test(imageUrl)) {
      return NextResponse.json({
        success: false,
        error: 'imageUrl 必须是绝对URL'
      }, { status: 400 });
    }

    // 下载图片
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`图片下载失败: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传到 Supabase Storage
    const filename = generateUniqueFilename(noteId, imageUrl);
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(filename, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });
    if (error) {
      console.error('Supabase 上传失败:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 获取公开访问 URL（Public bucket）
    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(filename);
    const publicUrl = publicUrlData?.publicUrl;
    if (!publicUrl) {
      return NextResponse.json({ success: false, error: '获取公开URL失败' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      imageUrl: publicUrl,
      filename
    });
  } catch (error) {
    console.error('保存永久图片失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '保存图片失败'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少noteId参数' 
      }, { status: 400 });
    }

    // 查找该笔记的所有永久图片
    const { data, error } = await supabase.storage.from(BUCKET).list();
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    const noteImages = (data || []).filter(file => file.name.startsWith(noteId));

    return NextResponse.json({ 
      success: true,
      images: noteImages.map(file => file.name)
    });

  } catch (error) {
    console.error('获取永久图片失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '获取图片失败'
    }, { status: 500 });
  }
} 