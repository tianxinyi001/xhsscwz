// Coze API Types
export interface CozeMessage {
  role: 'user' | 'assistant';
  content: string;
  content_type: 'text';
}

export interface CozeChatRequest {
  bot_id: string;
  user_id: string;
  stream: boolean;
  auto_save_history: boolean;
  additional_messages: CozeMessage[];
}

export interface CozeChatResponse {
  code: number;
  message: string;
  data: {
    id: string;
    conversation_id: string;
    bot_id: string;
    user_id: string;
    content: string;
    status: string;
    create_time: number;
    update_time: number;
  };
}

// 小红书笔记数据类型
export interface XHSNote {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
    userId?: string;
  };
  images: string[];
  tags: string[];
  likes?: number;
  comments?: number;
  shares?: number;
  url?: string;
  createTime: string;
  extractedAt: string;
  rating?: number;
}

// 本地存储类型
export interface StoredNote {
  id: string;
  title: string;
  content: string;
  author: { name: string };
  images: string[];
  originalImages?: string[]; // 原始图片URL
  localImages?: string[]; // 本地保存的图片路径
  cachedImages?: string[]; // 浏览器缓存的图片（Base64）
  permanentImages?: string[]; // 永久存储的图片路径
  filename?: string; // Supabase 图片文件名
  tags: string[];
  url?: string;
  createTime: string;
  extractedAt: string;
  rating?: number;
}

// 应用状态类型
export interface AppState {
  isLoading: boolean;
  notes: StoredNote[];
  currentNote: StoredNote | null;
  error: string | null;
} 
