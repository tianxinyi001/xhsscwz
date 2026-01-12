import { NextRequest, NextResponse } from 'next/server';
import { StoredNote } from '@/lib/types';
import { readNotes, writeNotes } from '@/lib/local-notes';

function sortNotes(notes: StoredNote[]): StoredNote[] {
  return [...notes].sort((a, b) => {
    const timeA = new Date(a.createTime || a.extractedAt).getTime();
    const timeB = new Date(b.createTime || b.extractedAt).getTime();
    return timeB - timeA;
  });
}

// GET - fetch all notes from local JSON
export async function GET() {
  try {
    const notes = sortNotes(await readNotes());
    return NextResponse.json({ success: true, data: notes });
  } catch (error) {
    console.error('Failed to load notes:', error);
    return NextResponse.json({ success: false, error: 'Failed to load notes' }, { status: 500 });
  }
}

// POST - create a new note (upsert by id)
export async function POST(request: NextRequest) {
  try {
    const note: StoredNote = await request.json();
    const notes = await readNotes();
    const existingIndex = notes.findIndex(existing => existing.id === note.id);

    if (existingIndex >= 0) {
      notes[existingIndex] = note;
    } else {
      notes.unshift(note);
    }

    await writeNotes(notes);
    return NextResponse.json({ success: true, data: note });
  } catch (error) {
    console.error('Failed to create note:', error);
    return NextResponse.json({ success: false, error: 'Failed to create note' }, { status: 500 });
  }
}

// PUT - update an existing note
export async function PUT(request: NextRequest) {
  try {
    const note: StoredNote = await request.json();
    const notes = await readNotes();
    const existingIndex = notes.findIndex(existing => existing.id === note.id);

    if (existingIndex === -1) {
      return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
    }

    notes[existingIndex] = note;
    await writeNotes(notes);
    return NextResponse.json({ success: true, data: note });
  } catch (error) {
    console.error('Failed to update note:', error);
    return NextResponse.json({ success: false, error: 'Failed to update note' }, { status: 500 });
  }
}

// DELETE - delete a note by id
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing note id' }, { status: 400 });
    }

    const notes = await readNotes();
    const filtered = notes.filter(note => note.id !== id);
    await writeNotes(filtered);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete note:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete note' }, { status: 500 });
  }
}
