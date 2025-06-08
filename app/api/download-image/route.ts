import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, noteId } = await request.json();

    if (!imageUrl || !noteId) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少必要参数' 
      }, { status: 400 });
    }

    console.log('开始下载图片:', imageUrl);

    // 获取图片数据
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.xiaohongshu.com/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`图片下载失败: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 确定文件扩展名
    const contentType = response.headers.get('content-type') || '';
    let extension = '.jpg';
    if (contentType.includes('png')) {
      extension = '.png';
    } else if (contentType.includes('webp')) {
      extension = '.webp';
    } else if (contentType.includes('gif')) {
      extension = '.gif';
    }

    // 创建保存目录
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'covers');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // 生成文件名
    const timestamp = Date.now();
    const filename = `${noteId}_${timestamp}${extension}`;
    const filepath = path.join(uploadsDir, filename);

    // 保存文件
    await writeFile(filepath, buffer);

    // 返回本地URL路径
    const localUrl = `/uploads/covers/${filename}`;

    console.log('图片保存成功:', localUrl);

    return NextResponse.json({
      success: true,
      localUrl,
      originalUrl: imageUrl,
      size: buffer.length
    });

  } catch (error) {
    console.error('图片下载保存失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
} 