import { StoredNote } from './types';

const STORAGE_KEY = 'xhs_notes';

export class StorageManager {
  // 保存笔记到本地存储
  static saveNote(note: StoredNote): void {
    try {
      const existingNotes = this.getAllNotes();
      const updatedNotes = [note, ...existingNotes.filter(n => n.id !== note.id)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    } catch (error) {
      console.error('保存笔记失败:', error);
    }
  }

  // 获取所有笔记
  static getAllNotes(): StoredNote[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('读取笔记失败:', error);
      return [];
    }
  }

  // 根据ID获取笔记
  static getNoteById(id: string): StoredNote | null {
    try {
      const notes = this.getAllNotes();
      return notes.find(note => note.id === id) || null;
    } catch (error) {
      console.error('获取笔记失败:', error);
      return null;
    }
  }

  // 删除笔记
  static deleteNote(id: string): void {
    try {
      const notes = this.getAllNotes();
      const filteredNotes = notes.filter(note => note.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredNotes));
    } catch (error) {
      console.error('删除笔记失败:', error);
    }
  }

  // 清空所有笔记
  static clearAllNotes(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('清空笔记失败:', error);
    }
  }

  // 搜索笔记
  static searchNotes(query: string): StoredNote[] {
    try {
      const notes = this.getAllNotes();
      const lowercaseQuery = query.toLowerCase();
      
      return notes.filter(note => 
        note.title.toLowerCase().includes(lowercaseQuery) ||
        note.content.toLowerCase().includes(lowercaseQuery) ||
        note.author.name.toLowerCase().includes(lowercaseQuery) ||
        note.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
      );
    } catch (error) {
      console.error('搜索笔记失败:', error);
      return [];
    }
  }
} 