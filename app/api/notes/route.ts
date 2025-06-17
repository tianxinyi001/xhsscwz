import { NextRequest, NextResponse } from 'next/server';
import { supabase, DatabaseNote } from '@/lib/supabase';
import { StoredNote } from '@/lib/types';

// 转换 StoredNote 到 DatabaseNote
function storedNoteToDatabase(note: StoredNote): Omit<DatabaseNote, 'created_at' | 'updated_at'> {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    author_name: note.author.name,
    images: note.images,
    original_images: note.originalImages,
    local_images: note.localImages,
    cached_images: note.cachedImages,
    permanent_images: note.permanentImages,
    filename: note.filename,
    tags: note.tags,
    url: note.url,
    create_time: note.createTime,
    extracted_at: note.extractedAt,
  };
}

// 转换 DatabaseNote 到 StoredNote
function databaseToStoredNote(dbNote: DatabaseNote): StoredNote {
  return {
    id: dbNote.id,
    title: dbNote.title,
    content: dbNote.content,
    author: { name: dbNote.author_name },
    images: dbNote.images,
    originalImages: dbNote.original_images,
    localImages: dbNote.local_images,
    cachedImages: dbNote.cached_images,
    permanentImages: dbNote.permanent_images,
    filename: dbNote.filename,
    tags: dbNote.tags,
    url: dbNote.url,
    createTime: dbNote.create_time,
    extractedAt: dbNote.extracted_at,
  };
}

// GET - 获取所有笔记
export async function GET() {
  try {
    console.log('📖 获取所有笔记...');
    
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ 获取笔记失败:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const notes = data.map(databaseToStoredNote);
    console.log('✅ 成功获取笔记:', notes.length, '篇');
    
    return NextResponse.json({ success: true, data: notes });
  } catch (error) {
    console.error('❌ 获取笔记异常:', error);
    return NextResponse.json({ success: false, error: '获取笔记失败' }, { status: 500 });
  }
}

// POST - 创建新笔记
export async function POST(request: NextRequest) {
  try {
    const note: StoredNote = await request.json();
    console.log('📝 创建新笔记:', note.id, note.title);
    
    const dbNote = storedNoteToDatabase(note);
    
    const { data, error } = await supabase
      .from('notes')
      .insert([dbNote])
      .select()
      .single();

    if (error) {
      console.error('❌ 创建笔记失败:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const createdNote = databaseToStoredNote(data);
    console.log('✅ 成功创建笔记:', createdNote.id);
    
    return NextResponse.json({ success: true, data: createdNote });
  } catch (error) {
    console.error('❌ 创建笔记异常:', error);
    return NextResponse.json({ success: false, error: '创建笔记失败' }, { status: 500 });
  }
}

// PUT - 更新笔记
export async function PUT(request: NextRequest) {
  try {
    const note: StoredNote = await request.json();
    console.log('✏️ 更新笔记:', note.id, note.title);
    
    const dbNote = storedNoteToDatabase(note);
    
    const { data, error } = await supabase
      .from('notes')
      .update(dbNote)
      .eq('id', note.id)
      .select()
      .single();

    if (error) {
      console.error('❌ 更新笔记失败:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const updatedNote = databaseToStoredNote(data);
    console.log('✅ 成功更新笔记:', updatedNote.id);
    
    return NextResponse.json({ success: true, data: updatedNote });
  } catch (error) {
    console.error('❌ 更新笔记异常:', error);
    return NextResponse.json({ success: false, error: '更新笔记失败' }, { status: 500 });
  }
}

// DELETE - 删除笔记
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, error: '缺少笔记ID' }, { status: 400 });
    }
    
    console.log('🗑️ 删除笔记:', id);
    
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ 删除笔记失败:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log('✅ 成功删除笔记:', id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ 删除笔记异常:', error);
    return NextResponse.json({ success: false, error: '删除笔记失败' }, { status: 500 });
  }
} 