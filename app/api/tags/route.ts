import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type TagStats = {
  name: string;
  count: number;
  noteIds: string[];
};

export async function GET() {
  try {
    const { data: notes, error } = await supabase
      .from('notes')
      .select('id, tags');

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const tagStats = new Map<string, { count: number; noteIds: string[] }>();

    (notes || []).forEach(note => {
      (note.tags || []).forEach((tag: string) => {
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
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to load tags' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { action, oldTag, newTag, noteIds } = await request.json();

    if (!action || !oldTag) {
      return NextResponse.json({ success: false, error: 'Missing required params' }, { status: 400 });
    }

    const { data: notes, error: fetchError } = await supabase
      .from('notes')
      .select('id, tags')
      .in('id', noteIds || []);

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    const updatePromises = (notes || []).map(async note => {
      let updatedTags = [...(note.tags || [])];

      switch (action) {
        case 'rename':
          if (!newTag) {
            throw new Error('Rename requires newTag');
          }
          updatedTags = updatedTags.map((tag: string) => (tag === oldTag ? newTag : tag));
          break;
        case 'delete':
          updatedTags = updatedTags.filter((tag: string) => tag !== oldTag);
          break;
        case 'merge':
          if (!newTag) {
            throw new Error('Merge requires newTag');
          }
          updatedTags = updatedTags.filter((tag: string) => tag !== oldTag);
          if (!updatedTags.includes(newTag)) {
            updatedTags.push(newTag);
          }
          break;
        default:
          throw new Error('Unsupported action');
      }

      const { error: updateError } = await supabase
        .from('notes')
        .update({ tags: updatedTags })
        .eq('id', note.id);

      if (updateError) {
        throw updateError;
      }

      return { id: note.id, tags: updatedTags };
    });

    const results = await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      data: {
        action,
        oldTag,
        newTag,
        updatedNotes: results.length,
        notes: results,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update tags' },
      { status: 500 }
    );
  }
}
