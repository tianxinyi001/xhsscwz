import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { NotesService } from '@/lib/notes-service';

const notesService = new NotesService();

// 获取单个笔记
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({
        success: false,
        error: '请先登录'
      }, { status: 401 });
    }

    const note = notesService.getNoteById(params.id, user.id);
    
    if (!note) {
      return NextResponse.json({
        success: false,
        error: '笔记不存在'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      note
    });
  } catch (error) {
    console.error('获取笔记错误:', error);
    return NextResponse.json({
      success: false,
      error: '服务器错误'
    }, { status: 500 });
  }
}

// 删除笔记
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({
        success: false,
        error: '请先登录'
      }, { status: 401 });
    }

    const success = notesService.deleteNote(params.id, user.id);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: '笔记不存在或删除失败'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除笔记错误:', error);
    return NextResponse.json({
      success: false,
      error: '服务器错误'
    }, { status: 500 });
  }
} 