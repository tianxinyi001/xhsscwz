// 浏览器端图片缓存管理器
export class ImageCacheManager {
  private static dbName = 'XHSImageCache';
  private static dbVersion = 1;
  private static storeName = 'images';

  // 初始化IndexedDB
  static async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('noteId', 'noteId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // 下载并缓存图片到IndexedDB
  static async cacheImage(imageUrl: string, noteId: string): Promise<string | null> {
    try {
      console.log('开始缓存图片到浏览器:', imageUrl);
      
      // 下载图片
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.xiaohongshu.com/',
        },
      });

      if (!response.ok) {
        throw new Error(`图片下载失败: ${response.status}`);
      }

      const blob = await response.blob();
      
      // 转换为Base64
      const base64 = await this.blobToBase64(blob);
      
      // 保存到IndexedDB
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const imageData = {
        id: `${noteId}_${Date.now()}`,
        noteId: noteId,
        originalUrl: imageUrl,
        base64Data: base64,
        mimeType: blob.type,
        size: blob.size,
        timestamp: Date.now()
      };
      
      await new Promise((resolve, reject) => {
        const request = store.add(imageData);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      console.log('图片已缓存到浏览器:', imageData.id);
      
      // 返回Base64数据URL
      return base64;
      
    } catch (error) {
      console.error('缓存图片到浏览器失败:', error);
      return null;
    }
  }

  // 获取缓存的图片
  static async getCachedImage(noteId: string): Promise<string | null> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('noteId');
      
      return new Promise((resolve, reject) => {
        const request = index.get(noteId);
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            resolve(result.base64Data);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('获取缓存图片失败:', error);
      return null;
    }
  }

  // 检查是否有缓存
  static async hasCachedImage(noteId: string): Promise<boolean> {
    try {
      const cachedImage = await this.getCachedImage(noteId);
      return cachedImage !== null;
    } catch (error) {
      return false;
    }
  }

  // 清理过期缓存（超过30天）
  static async cleanExpiredCache(): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const range = IDBKeyRange.upperBound(thirtyDaysAgo);
      
      const request = index.openCursor(range);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        }
      };
    } catch (error) {
      console.error('清理缓存失败:', error);
    }
  }

  // 获取缓存统计信息
  static async getCacheStats(): Promise<{ count: number; totalSize: number }> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const images = request.result;
          const count = images.length;
          const totalSize = images.reduce((total, img) => total + (img.size || 0), 0);
          resolve({ count, totalSize });
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('获取缓存统计失败:', error);
      return { count: 0, totalSize: 0 };
    }
  }

  // 清空所有缓存
  static async clearAllCache(): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      await new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      console.log('已清空所有图片缓存');
    } catch (error) {
      console.error('清空缓存失败:', error);
    }
  }

  // 工具方法：Blob转Base64
  private static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
} 