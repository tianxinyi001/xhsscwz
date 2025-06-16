import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import crypto from 'crypto';

// 定义永久存储目录
const PERMANENT_STORAGE_DIR = path.join(process.cwd(), 'public', 'permanent-images');

// 确保存储目录存在
async function ensureStorageDir() {
  console.log('检查存储目录:', PERMANENT_STORAGE_DIR);
  if (!existsSync(PERMANENT_STORAGE_DIR)) {
    console.log('创建存储目录...');
    await mkdir(PERMANENT_STORAGE_DIR, { recursive: true });
    console.log('存储目录创建成功');
  } else {
    console.log('存储目录已存在');
  }
}

// 生成唯一的文件名
function generateUniqueFilename(noteId: string, originalUrl: string): string {
  const timestamp = Date.now();
  const hash = crypto.createHash('md5').update(originalUrl).digest('hex').slice(0, 8);
  const filename = `${noteId}_${hash}_${timestamp}.jpg`;
  console.log('生成文件名:', filename);
  return filename;
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, noteId } = await request.json();
    console.log('收到保存请求:', { imageUrl, noteId });

    if (!imageUrl || !noteId) {
      console.error('缺少必要参数');
      return NextResponse.json({ 
        success: false, 
        error: '缺少必要参数' 
      }, { status: 400 });
    }

    // 确保存储目录存在
    await ensureStorageDir();

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
      console.error('图片下载失败:', response.status);
      throw new Error(`图片下载失败: ${response.status}`);
    }

    console.log('图片下载成功，开始处理数据');
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('图片数据大小:', buffer.length, '字节');

    // 生成唯一文件名
    const filename = generateUniqueFilename(noteId, imageUrl);
    const filepath = path.join(PERMANENT_STORAGE_DIR, filename);
    console.log('准备保存到:', filepath);

    // 保存文件
    await writeFile(filepath, buffer);
    console.log('文件保存成功');

    // 返回永久URL路径
    const permanentUrl = `/permanent-images/${filename}`;
    console.log('返回永久URL:', permanentUrl);

    return NextResponse.json({ 
      success: true,
      imageUrl: permanentUrl,
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

    // 确保存储目录存在
    await ensureStorageDir();

    // 查找该笔记的所有永久图片
    const files = await readdir(PERMANENT_STORAGE_DIR);
    const noteImages = files.filter((file: string) => file.startsWith(noteId));

    return NextResponse.json({ 
      success: true,
      images: noteImages.map((filename: string) => `/permanent-images/${filename}`)
    });

  } catch (error) {
    console.error('获取永久图片失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '获取图片失败'
    }, { status: 500 });
  }
} 