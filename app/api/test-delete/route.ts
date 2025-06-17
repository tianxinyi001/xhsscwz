import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🧪 测试删除功能...');
    
    // 1. 查询所有笔记
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('*');
    
    if (notesError) {
      return NextResponse.json({
        success: false,
        error: notesError.message
      }, { status: 500 });
    }

    // 2. 分析图片存储情况
    const imageAnalysis = {
      totalNotes: notes.length,
      notesWithFilename: 0,
      notesWithPermanentImages: 0,
      totalImages: 0,
      imageFiles: [] as string[]
    };

    notes.forEach(note => {
      if (note.filename) {
        imageAnalysis.notesWithFilename++;
        imageAnalysis.imageFiles.push(note.filename);
        imageAnalysis.totalImages++;
      }
      
      if (note.permanent_images && note.permanent_images.length > 0) {
        imageAnalysis.notesWithPermanentImages++;
        note.permanent_images.forEach((imageUrl: string) => {
          const urlParts = imageUrl.split('/');
          const filename = urlParts[urlParts.length - 1];
          if (filename && !imageAnalysis.imageFiles.includes(filename)) {
            imageAnalysis.imageFiles.push(filename);
            imageAnalysis.totalImages++;
          }
        });
      }
    });

    // 3. 查询Supabase Storage中的文件
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('covers')
      .list();

    const storageAnalysis = {
      totalStorageFiles: storageFiles?.length || 0,
      storageFiles: storageFiles?.map(file => file.name) || []
    };

    // 4. 对比分析
    const orphanedFiles = storageAnalysis.storageFiles.filter(
      filename => !imageAnalysis.imageFiles.includes(filename)
    );

    const missingFiles = imageAnalysis.imageFiles.filter(
      filename => !storageAnalysis.storageFiles.includes(filename)
    );

    return NextResponse.json({
      success: true,
      analysis: {
        database: imageAnalysis,
        storage: storageAnalysis,
        orphanedFiles: orphanedFiles, // Storage中存在但数据库中没有引用的文件
        missingFiles: missingFiles,   // 数据库中引用但Storage中不存在的文件
        summary: {
          databaseImages: imageAnalysis.totalImages,
          storageImages: storageAnalysis.totalStorageFiles,
          orphaned: orphanedFiles.length,
          missing: missingFiles.length
        }
      }
    });

  } catch (error) {
    console.error('❌ 测试删除功能失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '测试失败'
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log('🧹 清理孤立的Storage文件...');
    
    // 1. 获取数据库中引用的所有文件名
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('filename, permanent_images');
    
    if (notesError) {
      return NextResponse.json({
        success: false,
        error: notesError.message
      }, { status: 500 });
    }

    const referencedFiles = new Set<string>();
    
    notes.forEach(note => {
      if (note.filename) {
        referencedFiles.add(note.filename);
      }
      
      if (note.permanent_images && note.permanent_images.length > 0) {
        note.permanent_images.forEach((imageUrl: string) => {
          const urlParts = imageUrl.split('/');
          const filename = urlParts[urlParts.length - 1];
          if (filename) {
            referencedFiles.add(filename);
          }
        });
      }
    });

    // 2. 获取Storage中的所有文件
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('covers')
      .list();

    if (storageError) {
      return NextResponse.json({
        success: false,
        error: storageError.message
      }, { status: 500 });
    }

    // 3. 找出孤立的文件
    const orphanedFiles = storageFiles.filter(
      file => !referencedFiles.has(file.name)
    );

    // 4. 删除孤立的文件
    if (orphanedFiles.length > 0) {
      console.log(`🗑️ 发现 ${orphanedFiles.length} 个孤立文件，开始清理...`);
      
      const filesToDelete = orphanedFiles.map(file => file.name);
      const { error: deleteError } = await supabase.storage
        .from('covers')
        .remove(filesToDelete);

      if (deleteError) {
        return NextResponse.json({
          success: false,
          error: deleteError.message,
          orphanedFiles: filesToDelete
        }, { status: 500 });
      }

      console.log(`✅ 成功清理 ${orphanedFiles.length} 个孤立文件`);
      
      return NextResponse.json({
        success: true,
        message: `成功清理 ${orphanedFiles.length} 个孤立文件`,
        deletedFiles: filesToDelete
      });
    } else {
      return NextResponse.json({
        success: true,
        message: '没有发现孤立的文件',
        deletedFiles: []
      });
    }

  } catch (error) {
    console.error('❌ 清理孤立文件失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '清理失败'
    }, { status: 500 });
  }
} 