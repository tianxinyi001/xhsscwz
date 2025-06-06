import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { NotesService } from '@/lib/notes-service';

const notesService = new NotesService();

// 获取用户的所有笔记
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({
        success: false,
        error: '请先登录'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const tag = searchParams.get('tag');

    let notes;
    if (search) {
      notes = notesService.searchNotes(user.id, search);
    } else if (tag) {
      notes = notesService.getNotesByTag(user.id, tag);
    } else {
      notes = notesService.getUserNotes(user.id);
    }

    // 获取用户的所有标签
    const tags = notesService.getUserTags(user.id);

    return NextResponse.json({
      success: true,
      notes,
      tags
    });
  } catch (error) {
    console.error('获取笔记错误:', error);
    return NextResponse.json({
      success: false,
      error: '服务器错误'
    }, { status: 500 });
  }
}

// 保存新笔记
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({
        success: false,
        error: '请先登录'
      }, { status: 401 });
    }

    const noteData = await request.json();
    
    if (!noteData.id || !noteData.title) {
      return NextResponse.json({
        success: false,
        error: '笔记数据不完整'
      }, { status: 400 });
    }

    const savedNote = notesService.saveNote(noteData, user.id);

    return NextResponse.json({
      success: true,
      note: savedNote
    });
  } catch (error) {
    console.error('保存笔记错误:', error);
    return NextResponse.json({
      success: false,
      error: '保存失败'
    }, { status: 500 });
  }
} 