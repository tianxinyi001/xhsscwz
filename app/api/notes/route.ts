import { NextRequest, NextResponse } from 'next/server';
import { supabase, DatabaseNote } from '@/lib/supabase';
import { StoredNote } from '@/lib/types';

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

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const notes = (data || []).map(databaseToStoredNote);
    return NextResponse.json({ success: true, data: notes });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to load notes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const note: StoredNote = await request.json();
    const dbNote = storedNoteToDatabase(note);

    const { data, error } = await supabase
      .from('notes')
      .insert([dbNote])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: databaseToStoredNote(data) });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create note' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const note: StoredNote = await request.json();
    const dbNote = storedNoteToDatabase(note);

    const { data, error } = await supabase
      .from('notes')
      .update(dbNote)
      .eq('id', note.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: databaseToStoredNote(data) });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update note' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing note id' }, { status: 400 });
    }

    const { error } = await supabase.from('notes').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete note' },
      { status: 500 }
    );
  }
}
