'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { StorageManager } from '@/lib/storage';
import { StoredNote } from '@/lib/types';
import { generateId } from '@/lib/utils';

export default function DatabaseTest() {
  const [notes, setNotes] = useState<StoredNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleSetupDatabase = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);
    try {
      console.log('🔧 开始设置数据库...');
      
      const response = await fetch('/api/setup-database', {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTestResult('✅ 数据库表创建成功！现在可以测试其他功能了');
      } else {
        setTestResult(`❌ 数据库设置失败：${result.error}`);
        setError(result.error);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setTestResult(`❌ 数据库设置失败：${errorMsg}`);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);
    try {
      // 直接测试 API 连接
      const response = await fetch('/api/notes', {
        method: 'GET',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTestResult(`✅ 数据库连接成功！当前有 ${result.data.length} 篇笔记`);
      } else {
        setTestResult(`❌ 数据库连接失败：${result.error}`);
        setError(result.error);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setTestResult(`❌ 连接测试失败：${errorMsg}`);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const loadedNotes = await StorageManager.getAllNotes();
      setNotes(loadedNotes);
      console.log('✅ 加载笔记成功:', loadedNotes.length, '篇');
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
      console.error('❌ 加载笔记失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTestNote = async () => {
    setLoading(true);
    setError(null);
    try {
      const testNote: StoredNote = {
        id: generateId(),
        title: `测试笔记 ${new Date().toLocaleTimeString()}`,
        content: '这是一个测试笔记',
        author: { name: '测试用户' },
        images: ['https://example.com/test.jpg'],
        tags: ['测试', '数据库'],
        url: 'https://example.com/test',
        createTime: new Date().toISOString(),
        extractedAt: new Date().toISOString()
      };

      await StorageManager.saveNote(testNote);
      console.log('✅ 保存测试笔记成功');
      
      // 重新加载笔记
      await handleLoadNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
      console.error('❌ 保存测试笔记失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await StorageManager.deleteNote(id);
      console.log('✅ 删除笔记成功:', id);
      
      // 重新加载笔记
      await handleLoadNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
      console.error('❌ 删除笔记失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMigrateData = async () => {
    setLoading(true);
    setError(null);
    try {
      await StorageManager.migrateFromLocalStorage();
      console.log('✅ 数据迁移成功');
      
      // 重新加载笔记
      await handleLoadNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : '迁移失败');
      console.error('❌ 数据迁移失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">数据库测试</h1>
      
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-red-800 mb-2">🚨 数据库表未创建</h2>
        <p className="text-red-700 text-sm mb-3">
          检测到数据库表还未创建。请先点击下面的按钮创建数据库表，或者在 Supabase 控制台手动创建。
        </p>
        <Button 
          onClick={handleSetupDatabase} 
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {loading ? '创建中...' : '🔧 自动创建数据库表'}
        </Button>
      </div>
      
      <div className="flex gap-4 mb-6 flex-wrap">
        <Button onClick={handleTestConnection} disabled={loading} variant="outline">
          {loading ? '测试中...' : '🔌 测试连接'}
        </Button>
        <Button onClick={handleLoadNotes} disabled={loading}>
          {loading ? '加载中...' : '📖 加载笔记'}
        </Button>
        <Button onClick={handleAddTestNote} disabled={loading}>
          {loading ? '保存中...' : '➕ 添加测试笔记'}
        </Button>
        <Button onClick={handleMigrateData} disabled={loading}>
          {loading ? '迁移中...' : '🔄 迁移本地数据'}
        </Button>
      </div>

      {testResult && (
        <div className={`border rounded-lg p-4 mb-4 ${
          testResult.includes('✅') ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <p className={testResult.includes('✅') ? 'text-green-700' : 'text-red-700'}>
            {testResult}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>错误:</strong> {error}
          {error.includes('relation "notes" does not exist') && (
            <div className="mt-2 text-sm">
              <p>💡 <strong>解决方案:</strong> 点击上面的 "🔧 自动创建数据库表" 按钮，或在 Supabase 控制台运行 SQL 脚本。</p>
            </div>
          )}
          {error.includes("Could not find the 'author_name' column") && (
            <div className="mt-2 text-sm">
              <p>💡 <strong>解决方案:</strong> 数据库表不存在或结构不正确，请点击 "🔧 自动创建数据库表" 按钮。</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="text-lg font-semibold mb-2">笔记列表 ({notes.length} 篇)</h2>
        
        {notes.length === 0 ? (
          <p className="text-gray-500">暂无笔记</p>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="bg-white p-4 rounded border">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{note.title}</h3>
                    <p className="text-sm text-gray-600">{note.content}</p>
                    <p className="text-xs text-gray-500">作者: {note.author.name}</p>
                    <p className="text-xs text-gray-500">
                      标签: {note.tags.join(', ')}
                    </p>
                    <p className="text-xs text-gray-500">
                      创建时间: {new Date(note.createTime).toLocaleString()}
                    </p>
                    {note.url && (
                      <p className="text-xs text-gray-500">
                        URL: <a href={note.url} target="_blank" rel="noopener noreferrer" className="text-blue-500">{note.url}</a>
                      </p>
                    )}
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteNote(note.id)}
                    disabled={loading}
                  >
                    删除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 