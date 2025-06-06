import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { NotesData } from '@/lib/database';

// 简单的用户认证
async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  if (!token || !token.startsWith('test-token-')) {
    return null;
  }

  const userId = token.replace('test-token-', '');
  return {
    id: parseInt(userId),
    username: 'testuser',
    email: 'testuser@test.com'
  };
}

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
      notes = NotesData.searchNotes(user.id, search);
    } else if (tag) {
      notes = NotesData.getNotesByTag(user.id, tag);
    } else {
      notes = NotesData.getUserNotes(user.id);
    }

    // 获取用户的所有标签
    const tags = NotesData.getUserTags(user.id);

    console.log(`获取笔记 - 用户ID: ${user.id}, 笔记数量: ${notes.length}, 标签数量: ${tags.length}`);

    return NextResponse.json({
      success: true,
      notes,
      tags
    });
  } catch (error) {
    console.error('获取笔记错误:', error);
    return NextResponse.json({
      success: false,
      error: '服务器错误: ' + (error instanceof Error ? error.message : String(error))
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
    
    console.log('保存笔记请求:', { userId: user.id, noteData });
    
    if (!noteData.id || !noteData.title) {
      return NextResponse.json({
        success: false,
        error: '笔记数据不完整'
      }, { status: 400 });
    }

    // 转换数据格式
    const dbNote = {
      id: noteData.id,
      userId: user.id,
      title: noteData.title,
      content: noteData.content || '',
      authorName: noteData.author?.name || '',
      authorAvatar: noteData.author?.avatar,
      authorUserId: noteData.author?.userId,
      images: noteData.images || [],
      tags: noteData.tags || [],
      likes: noteData.likes || 0,
      comments: noteData.comments || 0,
      shares: noteData.shares || 0,
      url: noteData.url,
      createTime: noteData.createTime || new Date().toISOString()
    };

    const savedNote = NotesData.create(dbNote, user.id);

    console.log('笔记保存成功:', savedNote);

    return NextResponse.json({
      success: true,
      note: savedNote
    });
  } catch (error) {
    console.error('保存笔记错误:', error);
    return NextResponse.json({
      success: false,
      error: '保存失败: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
} 