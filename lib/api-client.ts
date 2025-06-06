import { StoredNote } from './types';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface NotesResponse {
  notes: StoredNote[];
  tags: string[];
}

class ApiClient {
  private baseUrl = '';

  // 获取用户的所有笔记
  async getNotes(search?: string, tag?: string): Promise<NotesResponse> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (tag) params.append('tag', tag);
    
    const response = await fetch(`/api/notes?${params}`);
    const result: ApiResponse<NotesResponse> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || '获取笔记失败');
    }
    
    return result.data!;
  }

  // 保存笔记
  async saveNote(note: Omit<StoredNote, 'extractedAt'>): Promise<StoredNote> {
    const response = await fetch('/api/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(note),
    });
    
    const result: ApiResponse<{ note: StoredNote }> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || '保存笔记失败');
    }
    
    return result.data!.note;
  }

  // 删除笔记
  async deleteNote(id: string): Promise<void> {
    const response = await fetch(`/api/notes/${id}`, {
      method: 'DELETE',
    });
    
    const result: ApiResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || '删除笔记失败');
    }
  }

  // 获取单个笔记
  async getNote(id: string): Promise<StoredNote> {
    const response = await fetch(`/api/notes/${id}`);
    const result: ApiResponse<{ note: StoredNote }> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || '获取笔记失败');
    }
    
    return result.data!.note;
  }

  // 提取小红书笔记信息
  async extractXHSNote(url: string): Promise<any> {
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, quickPreview: true }),
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || '提取失败');
    }
    
    return result.data;
  }
}

export const apiClient = new ApiClient(); 