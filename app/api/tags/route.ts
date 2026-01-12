import { NextRequest, NextResponse } from 'next/server';
import { readNotes, writeNotes } from '@/lib/local-notes';

type TagStats = {
  name: string;
  count: number;
  noteIds: string[];
};

// GET - fetch tag stats from local JSON
export async function GET() {
  try {
    const notes = await readNotes();
    const tagStats = new Map<string, { count: number; noteIds: string[] }>();

    notes.forEach(note => {
      (note.tags || []).forEach(tag => {
        if (!tagStats.has(tag)) {
          tagStats.set(tag, { count: 0, noteIds: [] });
        }
        const stats = tagStats.get(tag)!;
        stats.count += 1;
        stats.noteIds.push(note.id);
      });
    });

    const result: TagStats[] = Array.from(tagStats.entries()).map(([name, stats]) => ({
      name,
      count: stats.count,
      noteIds: stats.noteIds,
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Failed to load tag stats:', error);
    return NextResponse.json({ success: false, error: 'Failed to load tag stats' }, { status: 500 });
  }
}

// PUT - batch update tags
export async function PUT(request: NextRequest) {
  try {
    const { action, oldTag, newTag, noteIds } = await request.json();

    if (!action || !oldTag) {
      return NextResponse.json({ success: false, error: 'Missing required params' }, { status: 400 });
    }

    const notes = await readNotes();
    const noteIdSet = new Set<string>(noteIds || []);
    const updatedNotes: { id: string; tags: string[] }[] = [];

    notes.forEach(note => {
      if (!noteIdSet.has(note.id)) {
        return;
      }

      let updatedTags = [...(note.tags || [])];

      switch (action) {
        case 'rename':
          if (!newTag) {
            throw new Error('Rename requires newTag');
          }
          updatedTags = updatedTags.map(tag => (tag === oldTag ? newTag : tag));
          break;
        case 'delete':
          updatedTags = updatedTags.filter(tag => tag !== oldTag);
          break;
        case 'merge':
          if (!newTag) {
            throw new Error('Merge requires newTag');
          }
          updatedTags = updatedTags.filter(tag => tag !== oldTag);
          if (!updatedTags.includes(newTag)) {
            updatedTags.push(newTag);
          }
          break;
        default:
          throw new Error('Unsupported action');
      }

      note.tags = updatedTags;
      updatedNotes.push({ id: note.id, tags: updatedTags });
    });

    await writeNotes(notes);

    return NextResponse.json({
      success: true,
      data: {
        action,
        oldTag,
        newTag,
        updatedNotes: updatedNotes.length,
        notes: updatedNotes,
      },
    });
  } catch (error) {
    console.error('Failed to update tags:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update tags' },
      { status: 500 }
    );
  }
}
