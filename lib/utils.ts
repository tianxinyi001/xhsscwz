import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 格式化时间
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '日期格式错误';
  }
}

// 生成唯一ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 截取文本
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// 验证小红书URL - 放宽限制，支持多种格式
export function isValidXHSUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  const trimmedUrl = url.trim();
  
  // 如果为空则无效
  if (!trimmedUrl) {
    return false;
  }
  
  // 检查是否包含小红书相关关键词
  const xhsKeywords = [
    'xiaohongshu',
    'xhscdn',
    '小红书',
    'xhs',
    'redbook'
  ];
  
  const lowerUrl = trimmedUrl.toLowerCase();
  
  // 如果包含小红书关键词，则认为是有效的
  if (xhsKeywords.some(keyword => lowerUrl.includes(keyword))) {
    return true;
  }
  
  // 尝试解析为URL，如果是有效URL且包含小红书域名
  try {
    const urlObj = new URL(trimmedUrl);
    if (urlObj.hostname.includes('xiaohongshu.com') || 
        urlObj.hostname.includes('xhscdn.com')) {
      return true;
    }
  } catch {
    // 不是标准URL格式，但可能是分享码或其他格式
    // 让智能体来处理，只要不是明显无关的内容
  }
  
  // 检查是否看起来像分享码（包含数字和字母的组合）
  if (/[a-zA-Z0-9]{8,}/.test(trimmedUrl)) {
    return true;
  }
  
  // 检查是否包含可能的链接特征
  if (trimmedUrl.includes('http') || trimmedUrl.includes('www.') || trimmedUrl.includes('.com')) {
    return true;
  }
  
  // 如果输入看起来像ID或代码（至少3个字符）
  if (trimmedUrl.length >= 3) {
    return true;
  }
  
  return false;
}

export function extractXHSUrl(input: string): string {
  // 移除多余的空白字符
  const cleanInput = input.trim();
  
  // 使用正则表达式匹配小红书URL
  const urlPattern = /https:\/\/www\.xiaohongshu\.com\/discovery\/item\/[a-zA-Z0-9]+(\?[^\s]*)?/;
  const match = cleanInput.match(urlPattern);
  
  if (match) {
    return match[0];
  }
  
  // 如果没有找到完整URL，但有noteId，尝试提取noteId
  const noteIdPattern = /([a-zA-Z0-9]{24})/;
  const noteIdMatch = cleanInput.match(noteIdPattern);
  
  if (noteIdMatch) {
    // 如果找到noteId但没有完整URL，返回原始输入让调用者处理
    return cleanInput;
  }
  
  return cleanInput;
} 