'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { StorageManager } from '@/lib/storage';
import { Upload, Download, ArrowRight, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface LocalNote {
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
}

export default function MigratePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [localNotes, setLocalNotes] = useState<LocalNote[]>([]);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'migrating' | 'completed' | 'error'>('idle');
  const [migratedCount, setMigratedCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // 检查是否已登录
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth');
    }
  }, [user, isLoading, router]);

  // 加载localStorage中的数据
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const notes = StorageManager.getAllNotes();
        setLocalNotes(notes);
        console.log('找到本地笔记:', notes.length, '条');
      } catch (error) {
        console.error('读取本地数据失败:', error);
      }
    }
  }, []);

  // 执行数据迁移
  const handleMigration = async () => {
    if (localNotes.length === 0) {
      setErrorMessage('没有找到需要迁移的数据');
      return;
    }

    setMigrationStatus('migrating');
    setMigratedCount(0);
    setErrorMessage('');

    try {
      for (let i = 0; i < localNotes.length; i++) {
        const note = localNotes[i];
        
        // 构造服务器端数据格式
        const serverNote = {
          id: note.id,
          title: note.title,
          content: note.content || '',
          author: {
            name: note.author?.name || '',
            avatar: note.author?.avatar,
            userId: note.author?.userId
          },
          images: note.images || [],
          tags: note.tags || [],
          likes: note.likes || 0,
          comments: note.comments || 0,
          shares: note.shares || 0,
          url: note.url,
          createTime: note.createTime || note.extractedAt
        };

        // 发送到服务器
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(serverNote),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`迁移第${i + 1}条笔记失败: ${error.error || '未知错误'}`);
        }

        setMigratedCount(i + 1);
        
        // 添加小延迟避免请求过快
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setMigrationStatus('completed');
      console.log('数据迁移完成，共迁移', localNotes.length, '条笔记');
      
      // 可选：清除localStorage中的数据
      // StorageManager.clearAllNotes();
      
    } catch (error) {
      console.error('迁移失败:', error);
      setErrorMessage(error instanceof Error ? error.message : '迁移过程中发生未知错误');
      setMigrationStatus('error');
    }
  };

  // 清除本地数据
  const handleClearLocalData = () => {
    if (confirm('确认要清除本地数据吗？此操作不可逆！')) {
      StorageManager.clearAllNotes();
      setLocalNotes([]);
      alert('本地数据已清除');
    }
  };

  // 跳转到主页
  const goToHome = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-red-400 to-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Upload className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">数据迁移工具</h1>
          <p className="text-gray-600">将您之前保存在本地的笔记迁移到服务器</p>
        </div>

        {/* 用户信息 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-red-400 to-pink-400 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">{user.username[0].toUpperCase()}</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">当前用户：{user.username}</h3>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>

        {/* 本地数据统计 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Download className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold">本地数据检测</h3>
          </div>
          
          {localNotes.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">没有找到本地存储的笔记数据</p>
              <p className="text-sm text-gray-500 mt-2">
                这可能是因为：数据已经迁移过、浏览器数据被清除、或者首次使用
              </p>
            </div>
          ) : (
            <div>
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">发现 {localNotes.length} 条本地笔记</span>
                </div>
              </div>
              
              {/* 笔记预览 */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {localNotes.slice(0, 10).map((note, index) => (
                  <div key={note.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-500 w-8">{index + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{note.title}</p>
                      <p className="text-xs text-gray-500">
                        {note.tags.length > 0 && `标签: ${note.tags.join(', ')} • `}
                        {new Date(note.extractedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {localNotes.length > 10 && (
                  <p className="text-xs text-gray-500 text-center py-2">
                    还有 {localNotes.length - 10} 条笔记...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 迁移控制 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <ArrowRight className="h-5 w-5 text-green-500" />
            <h3 className="text-lg font-semibold">数据迁移</h3>
          </div>

          {migrationStatus === 'idle' && localNotes.length > 0 && (
            <div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-yellow-900 mb-2">迁移说明</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• 将把所有本地笔记迁移到服务器</li>
                  <li>• 迁移过程中请不要关闭页面</li>
                  <li>• 迁移完成后可以选择清除本地数据</li>
                  <li>• 如果笔记已存在，将会被覆盖</li>
                </ul>
              </div>
              <Button
                onClick={handleMigration}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3"
              >
                开始迁移 {localNotes.length} 条笔记
              </Button>
            </div>
          )}

          {migrationStatus === 'migrating' && (
            <div className="text-center py-6">
              <div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-lg font-medium text-gray-900">正在迁移数据...</p>
              <p className="text-sm text-gray-600 mt-2">
                已完成 {migratedCount} / {localNotes.length} 条笔记
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(migratedCount / localNotes.length) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {migrationStatus === 'completed' && (
            <div className="text-center py-6">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">迁移完成！</h4>
              <p className="text-gray-600 mb-6">
                成功迁移了 {migratedCount} 条笔记到服务器
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={goToHome}
                  className="bg-gradient-to-r from-red-400 to-pink-400 hover:from-red-500 hover:to-pink-500 text-white"
                >
                  返回主页
                </Button>
                <Button
                  onClick={handleClearLocalData}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  清除本地数据
                </Button>
              </div>
            </div>
          )}

          {migrationStatus === 'error' && (
            <div className="text-center py-6">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">迁移失败</h4>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 text-sm">{errorMessage}</p>
              </div>
              <p className="text-gray-600 mb-6">
                已成功迁移 {migratedCount} 条笔记
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => setMigrationStatus('idle')}
                  className="bg-gradient-to-r from-red-400 to-pink-400 hover:from-red-500 hover:to-pink-500 text-white"
                >
                  重试迁移
                </Button>
                <Button
                  onClick={goToHome}
                  variant="outline"
                >
                  返回主页
                </Button>
              </div>
            </div>
          )}

          {localNotes.length === 0 && (
            <div className="text-center py-6">
              <Button
                onClick={goToHome}
                className="bg-gradient-to-r from-red-400 to-pink-400 hover:from-red-500 hover:to-pink-500 text-white"
              >
                返回主页
              </Button>
            </div>
          )}
        </div>

        {/* 注意事项 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 温馨提示</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 迁移后的数据将与您的账户绑定，登录后可在任何设备访问</li>
            <li>• 本地数据可以保留作为备份，也可以在迁移完成后清除</li>
            <li>• 如果遇到问题，可以多次执行迁移操作</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 