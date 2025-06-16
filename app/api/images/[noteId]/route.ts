import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'images');

export async function GET(
  request: NextRequest,
  { params }: { params: { noteId: string } }
) {
  try {
    const { noteId } = params;
    const filePath = join(UPLOAD_DIR, `${noteId}.jpg`);

    // 检查文件是否存在
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: '图片不存在' },
        { status: 404 }
      );
    }

    // 返回图片URL
    const imageUrl = `/uploads/images/${noteId}.jpg`;
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('获取图片失败:', error);
    return NextResponse.json(
      { error: '获取图片失败' },
      { status: 500 }
    );
  }
} 