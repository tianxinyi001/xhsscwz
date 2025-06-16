import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';

// 确保上传目录存在
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'images');

export async function POST(request: NextRequest) {
  try {
    // 确保上传目录存在
    await mkdir(UPLOAD_DIR, { recursive: true });

    const formData = await request.formData();
    const image = formData.get('image') as File;
    const noteId = formData.get('noteId') as string;

    if (!image || !noteId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 生成文件名
    const fileName = `${noteId}.jpg`;
    const filePath = join(UPLOAD_DIR, fileName);

    // 将文件写入磁盘
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 返回可访问的URL
    const imageUrl = `/uploads/images/${fileName}`;

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('图片上传失败:', error);
    return NextResponse.json(
      { error: '图片上传失败' },
      { status: 500 }
    );
  }
} 