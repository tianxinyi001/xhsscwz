import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const usersFile = path.join(dataDir, 'users.json');
const notesFile = path.join(dataDir, 'notes.json');

// 确保data目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 用户数据类型
export interface User {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// 笔记数据类型
export interface Note {
  id: string;
  userId: number;
  title: string;
  content: string;
  authorName: string;
  authorAvatar?: string;
  authorUserId?: string;
  images: string[];
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  url?: string;
  createTime: string;
  extractedAt: string;
}

// 用户数据管理
export class UserData {
  private static loadUsers(): User[] {
    try {
      if (fs.existsSync(usersFile)) {
        const data = fs.readFileSync(usersFile, 'utf-8');
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('加载用户数据失败:', error);
      return [];
    }
  }

  private static saveUsers(users: User[]): void {
    try {
      fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    } catch (error) {
      console.error('保存用户数据失败:', error);
    }
  }

  static findByUsername(username: string): User | undefined {
    const users = this.loadUsers();
    return users.find(u => u.username === username || u.email === username);
  }

  static findById(id: number): User | undefined {
    const users = this.loadUsers();
    return users.find(u => u.id === id);
  }

  static create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const users = this.loadUsers();
    const id = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    
    const newUser: User = {
      ...userData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  static existsByUsernameOrEmail(username: string, email: string): boolean {
    const users = this.loadUsers();
    return users.some(u => u.username === username || u.email === email);
  }
}

// 笔记数据管理
export class NotesData {
  private static loadNotes(): Note[] {
    try {
      if (fs.existsSync(notesFile)) {
        const data = fs.readFileSync(notesFile, 'utf-8');
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('加载笔记数据失败:', error);
      return [];
    }
  }

  private static saveNotes(notes: Note[]): void {
    try {
      fs.writeFileSync(notesFile, JSON.stringify(notes, null, 2));
    } catch (error) {
      console.error('保存笔记数据失败:', error);
    }
  }

  static getUserNotes(userId: number): Note[] {
    const notes = this.loadNotes();
    return notes
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.extractedAt).getTime() - new Date(a.extractedAt).getTime());
  }

  static findById(id: string, userId: number): Note | undefined {
    const notes = this.loadNotes();
    return notes.find(n => n.id === id && n.userId === userId);
  }

  static create(noteData: Omit<Note, 'extractedAt'>): Note {
    const notes = this.loadNotes();
    
    const newNote: Note = {
      ...noteData,
      extractedAt: new Date().toISOString()
    };

    // 如果已存在相同ID的笔记，则替换
    const existingIndex = notes.findIndex(n => n.id === newNote.id && n.userId === noteData.userId);
    if (existingIndex >= 0) {
      notes[existingIndex] = newNote;
    } else {
      notes.push(newNote);
    }

    this.saveNotes(notes);
    return newNote;
  }

  static delete(id: string, userId: number): boolean {
    const notes = this.loadNotes();
    const index = notes.findIndex(n => n.id === id && n.userId === userId);
    
    if (index >= 0) {
      notes.splice(index, 1);
      this.saveNotes(notes);
      return true;
    }
    return false;
  }

  static clearUserNotes(userId: number): boolean {
    const notes = this.loadNotes();
    const filteredNotes = notes.filter(n => n.userId !== userId);
    this.saveNotes(filteredNotes);
    return true;
  }

  static searchNotes(userId: number, query: string): Note[] {
    const notes = this.getUserNotes(userId);
    const lowercaseQuery = query.toLowerCase();
    
    return notes.filter(note => 
      note.title.toLowerCase().includes(lowercaseQuery) ||
      note.content.toLowerCase().includes(lowercaseQuery) ||
      note.authorName.toLowerCase().includes(lowercaseQuery) ||
      note.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  static getNotesByTag(userId: number, tag: string): Note[] {
    const notes = this.getUserNotes(userId);
    return notes.filter(note => note.tags.includes(tag));
  }

  static getUserTags(userId: number): string[] {
    const notes = this.getUserNotes(userId);
    const allTags = new Set<string>();
    
    notes.forEach(note => {
      note.tags.forEach(tag => allTags.add(tag));
    });
    
    return Array.from(allTags);
  }
} 