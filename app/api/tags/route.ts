import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - 获取所有标签统计
export async function GET() {
  try {
    const { data: notes, error } = await supabase
      .from('notes')
      .select('id, title, tags');

    if (error) {
      console.error('❌ 获取笔记失败:', error);
      return NextResponse.json(
        { success: false, error: '获取笔记数据失败' },
        { status: 500 }
      );
    }

    // 统计标签
    const tagStats = new Map<string, { count: number; noteIds: string[] }>();
    
    notes.forEach(note => {
      note.tags.forEach((tag: string) => {
        if (!tagStats.has(tag)) {
          tagStats.set(tag, { count: 0, noteIds: [] });
        }
        const stats = tagStats.get(tag)!;
        stats.count++;
        stats.noteIds.push(note.id);
      });
    });

    const result = Array.from(tagStats.entries()).map(([name, stats]) => ({
      name,
      count: stats.count,
      noteIds: stats.noteIds
    }));

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ 获取标签统计失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// PUT - 批量更新标签
export async function PUT(request: NextRequest) {
  try {
    const { action, oldTag, newTag, noteIds } = await request.json();

    if (!action || !oldTag) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 获取需要更新的笔记
    const { data: notes, error: fetchError } = await supabase
      .from('notes')
      .select('id, tags')
      .in('id', noteIds || []);

    if (fetchError) {
      console.error('❌ 获取笔记失败:', fetchError);
      return NextResponse.json(
        { success: false, error: '获取笔记数据失败' },
        { status: 500 }
      );
    }

    const updatePromises = notes.map(async (note) => {
      let updatedTags = [...note.tags];

      switch (action) {
        case 'rename':
          if (!newTag) {
            throw new Error('重命名操作需要新标签名');
          }
          updatedTags = updatedTags.map(tag => tag === oldTag ? newTag : tag);
          break;

        case 'delete':
          updatedTags = updatedTags.filter(tag => tag !== oldTag);
          break;

        case 'merge':
          if (!newTag) {
            throw new Error('合并操作需要目标标签名');
          }
          // 移除旧标签
          updatedTags = updatedTags.filter(tag => tag !== oldTag);
          // 添加新标签（如果不存在）
          if (!updatedTags.includes(newTag)) {
            updatedTags.push(newTag);
          }
          break;

        default:
          throw new Error('不支持的操作类型');
      }

      // 更新数据库
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
        notes: results
      }
    });

  } catch (error) {
    console.error('❌ 批量更新标签失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    );
  }
} 