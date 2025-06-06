import { NotesData, Note } from './database';
import { StoredNote } from './types';

export interface DatabaseNote {
  id: string;
  user_id: number;
  title: string;
  content: string;
  author_name: string;
  author_avatar: string;
  author_user_id: string;
  images: string; // JSON string
  tags: string; // JSON string
  likes: number;
  comments: number;
  shares: number;
  url: string;
  create_time: string;
  extracted_at: string;
}

// 数据库记录转换为应用数据格式
function dbNoteToStoredNote(dbNote: Note): StoredNote {
  return {
    id: dbNote.id,
    title: dbNote.title,
    content: dbNote.content || '',
    author: {
      name: dbNote.authorName || '',
      avatar: dbNote.authorAvatar,
      userId: dbNote.authorUserId
    },
    images: dbNote.images || [],
    tags: dbNote.tags || [],
    likes: dbNote.likes,
    comments: dbNote.comments,
    shares: dbNote.shares,
    url: dbNote.url,
    createTime: dbNote.createTime,
    extractedAt: dbNote.extractedAt
  };
}

// 应用数据格式转换为数据库记录
function storedNoteToDbData(note: Omit<StoredNote, 'extractedAt'>, userId: number): Omit<Note, 'extractedAt'> {
  return {
    id: note.id,
    userId,
    title: note.title,
    content: note.content,
    authorName: note.author.name,
    authorAvatar: note.author.avatar || undefined,
    authorUserId: note.author.userId || undefined,
    images: note.images,
    tags: note.tags,
    likes: note.likes || 0,
    comments: note.comments || 0,
    shares: note.shares || 0,
    url: note.url || undefined,
    createTime: note.createTime
  };
}

export class NotesService {
  // 保存笔记
  saveNote(note: Omit<StoredNote, 'extractedAt'>, userId: number): StoredNote {
    const dbData = storedNoteToDbData(note, userId);
    const savedNote = NotesData.create(dbData);
    return dbNoteToStoredNote(savedNote);
  }

  // 获取用户的所有笔记
  getUserNotes(userId: number): StoredNote[] {
    const dbNotes = NotesData.getUserNotes(userId);
    return dbNotes.map(dbNoteToStoredNote);
  }

  // 根据ID获取笔记
  getNoteById(id: string, userId: number): StoredNote | null {
    const dbNote = NotesData.findById(id, userId);
    return dbNote ? dbNoteToStoredNote(dbNote) : null;
  }

  // 删除笔记
  deleteNote(id: string, userId: number): boolean {
    return NotesData.delete(id, userId);
  }

  // 清空用户所有笔记
  clearUserNotes(userId: number): boolean {
    return NotesData.clearUserNotes(userId);
  }

  // 搜索笔记
  searchNotes(userId: number, query: string): StoredNote[] {
    const dbNotes = NotesData.searchNotes(userId, query);
    return dbNotes.map(dbNoteToStoredNote);
  }

  // 根据标签筛选笔记
  getNotesByTag(userId: number, tag: string): StoredNote[] {
    const dbNotes = NotesData.getNotesByTag(userId, tag);
    return dbNotes.map(dbNoteToStoredNote);
  }

  // 获取用户的所有标签
  getUserTags(userId: number): string[] {
    return NotesData.getUserTags(userId);
  }
} 