import { StoredNote } from './types';

export class StorageManager {
  // 保存笔记到数据库
  static async saveNote(note: StoredNote): Promise<void> {
    try {
      console.log('💾 保存笔记到数据库:', note.id, note.title);
      
      // 先检查笔记是否已存在
      const existingNote = await this.getNoteById(note.id);
      
      const response = await fetch('/api/notes', {
        method: existingNote ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(note),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '保存笔记失败');
      }
      
      console.log('✅ 笔记保存成功:', note.id);
    } catch (error) {
      console.error('❌ 保存笔记失败:', error);
      throw error;
    }
  }

  // 获取所有笔记
  static async getAllNotes(): Promise<StoredNote[]> {
    try {
      console.log('📖 从数据库获取所有笔记...');
      
      const response = await fetch('/api/notes', {
        method: 'GET',
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '获取笔记失败');
      }
      
      console.log('✅ 成功获取笔记:', result.data.length, '篇');
      return result.data || [];
    } catch (error) {
      console.error('❌ 获取笔记失败:', error);
      return [];
    }
  }

  // 根据ID获取笔记
  static async getNoteById(id: string): Promise<StoredNote | null> {
    try {
      const notes = await this.getAllNotes();
      return notes.find(note => note.id === id) || null;
    } catch (error) {
      console.error('❌ 获取笔记失败:', error);
      return null;
    }
  }

  // 删除笔记
  static async deleteNote(id: string): Promise<void> {
    try {
      console.log('🗑️ 从数据库删除笔记:', id);
      
      const response = await fetch(`/api/notes?id=${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '删除笔记失败');
      }
      
      console.log('✅ 笔记删除成功:', id);
    } catch (error) {
      console.error('❌ 删除笔记失败:', error);
      throw error;
    }
  }

  // 清空所有笔记
  static async clearAllNotes(): Promise<void> {
    try {
      console.log('🧹 清空所有笔记...');
      
      const notes = await this.getAllNotes();
      
      // 批量删除所有笔记
      for (const note of notes) {
        await this.deleteNote(note.id);
      }
      
      console.log('✅ 所有笔记清空成功');
    } catch (error) {
      console.error('❌ 清空笔记失败:', error);
      throw error;
    }
  }

  // 搜索笔记
  static async searchNotes(query: string): Promise<StoredNote[]> {
    try {
      const notes = await this.getAllNotes();
      const lowercaseQuery = query.toLowerCase();
      
      return notes.filter(note => 
        note.title.toLowerCase().includes(lowercaseQuery) ||
        note.content.toLowerCase().includes(lowercaseQuery) ||
        note.author.name.toLowerCase().includes(lowercaseQuery) ||
        note.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
      );
    } catch (error) {
      console.error('❌ 搜索笔记失败:', error);
      return [];
    }
  }

  // 兼容性方法：从 localStorage 迁移数据到数据库
  static async migrateFromLocalStorage(): Promise<void> {
    try {
      console.log('🔄 开始迁移本地数据到数据库...');
      
      // 检查是否有本地数据
      const localData = localStorage.getItem('xhs_notes');
      if (!localData) {
        console.log('📭 没有本地数据需要迁移');
        return;
      }
      
      const localNotes: StoredNote[] = JSON.parse(localData);
      console.log('📦 发现本地笔记:', localNotes.length, '篇');
      
      // 获取数据库中的现有笔记
      const existingNotes = await this.getAllNotes();
      const existingIds = new Set(existingNotes.map(note => note.id));
      
      // 过滤出需要迁移的笔记
      const notesToMigrate = localNotes.filter(note => !existingIds.has(note.id));
      
      if (notesToMigrate.length === 0) {
        console.log('✅ 所有本地数据已存在于数据库中');
        return;
      }
      
      console.log('🚀 开始迁移', notesToMigrate.length, '篇笔记...');
      
      // 批量迁移笔记
      for (const note of notesToMigrate) {
        await this.saveNote(note);
      }
      
      console.log('✅ 数据迁移完成，迁移了', notesToMigrate.length, '篇笔记');
      
      // 询问用户是否清除本地数据
      if (confirm('数据迁移完成！是否清除本地存储的数据？')) {
        localStorage.removeItem('xhs_notes');
        console.log('🧹 本地数据已清除');
      }
      
    } catch (error) {
      console.error('❌ 数据迁移失败:', error);
      throw error;
    }
  }
} 