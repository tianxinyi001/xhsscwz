'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Download, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface LocalStorageNote {
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

interface MigrationResult {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

export function DataMigration() {
  const [isScanning, setIsScanning] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [localNotes, setLocalNotes] = useState<LocalStorageNote[]>([]);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);

  // 扫描localStorage中的数据
  const scanLocalData = () => {
    setIsScanning(true);
    try {
      const stored = localStorage.getItem('xhs_notes');
      if (stored) {
        const notes = JSON.parse(stored) as LocalStorageNote[];
        setLocalNotes(notes);
        console.log('扫描到本地数据:', notes);
      } else {
        setLocalNotes([]);
      }
    } catch (error) {
      console.error('扫描本地数据失败:', error);
      setLocalNotes([]);
    } finally {
      setIsScanning(false);
    }
  };

  // 迁移数据到服务器
  const migrateData = async () => {
    if (localNotes.length === 0) {
      alert('没有找到需要迁移的数据');
      return;
    }

    setIsMigrating(true);
    const result: MigrationResult = {
      total: localNotes.length,
      success: 0,
      failed: 0,
      errors: []
    };

    for (const note of localNotes) {
      try {
        // 转换数据格式
        const serverNote = {
          id: note.id,
          title: note.title,
          content: note.content || '',
          author: note.author,
          images: note.images || [],
          tags: note.tags || [],
          likes: note.likes || 0,
          comments: note.comments || 0,
          shares: note.shares || 0,
          url: note.url || '',
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

        const apiResult = await response.json();

        if (apiResult.success) {
          result.success++;
          console.log(`成功迁移笔记: ${note.title}`);
        } else {
          result.failed++;
          result.errors.push(`${note.title}: ${apiResult.error || '未知错误'}`);
          console.error(`迁移失败: ${note.title}`, apiResult.error);
        }
      } catch (error) {
        result.failed++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(`${note.title}: ${errorMsg}`);
        console.error(`迁移笔记失败: ${note.title}`, error);
      }
    }

    setMigrationResult(result);
    setIsMigrating(false);

    // 迁移成功后询问是否清理localStorage
    if (result.success > 0 && result.failed === 0) {
      const shouldClear = confirm(`所有数据迁移成功！是否清理本地存储中的旧数据？\n\n注意：清理后无法恢复，请确保服务器数据正常。`);
      if (shouldClear) {
        localStorage.removeItem('xhs_notes');
        alert('本地旧数据已清理完成！');
        setLocalNotes([]);
      }
    }
  };

  // 导出本地数据（备份用）
  const exportLocalData = () => {
    if (localNotes.length === 0) {
      alert('没有找到需要导出的数据');
      return;
    }

    const dataStr = JSON.stringify(localNotes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `xhs-notes-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Upload className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">数据迁移工具</h1>
          <p className="text-gray-600">将localStorage中的笔记数据迁移到服务器</p>
        </div>

        {/* 扫描本地数据 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">1. 扫描本地数据</h2>
            <Button
              onClick={scanLocalData}
              disabled={isScanning}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isScanning ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  扫描中...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  扫描本地数据
                </>
              )}
            </Button>
          </div>

          {localNotes.length > 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="font-medium text-green-800">
                  找到 {localNotes.length} 条笔记数据
                </span>
              </div>
              <div className="text-sm text-green-700">
                <p>数据预览：</p>
                <ul className="mt-2 space-y-1">
                  {localNotes.slice(0, 5).map((note, index) => (
                    <li key={index} className="truncate">
                      • {note.title} ({note.tags?.length || 0} 个标签)
                    </li>
                  ))}
                  {localNotes.length > 5 && (
                    <li className="text-gray-600">... 还有 {localNotes.length - 5} 条</li>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">
                {isScanning ? '正在扫描...' : '未找到本地数据，请先点击扫描按钮'}
              </p>
            </div>
          )}
        </div>

        {/* 数据备份 */}
        {localNotes.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">2. 数据备份（推荐）</h2>
              <Button
                onClick={exportLocalData}
                variant="outline"
                className="border-amber-300 text-amber-600 hover:bg-amber-50"
              >
                <Download className="h-4 w-4 mr-2" />
                导出备份文件
              </Button>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                <div className="text-amber-800">
                  <p className="font-medium">建议先备份数据</p>
                  <p className="text-sm mt-1">
                    在迁移前建议先导出备份文件，以防迁移过程中出现意外情况。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 开始迁移 */}
        {localNotes.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">3. 开始迁移</h2>
              <Button
                onClick={migrateData}
                disabled={isMigrating}
                className="bg-green-500 hover:bg-green-600"
              >
                {isMigrating ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    迁移中...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    开始迁移数据
                  </>
                )}
              </Button>
            </div>

            {isMigrating && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Loader className="h-5 w-5 text-blue-500 mr-2 animate-spin" />
                  <span className="text-blue-800">正在迁移数据到服务器，请稍候...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 迁移结果 */}
        {migrationResult && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">迁移结果</h2>
            <div className={`border rounded-lg p-4 ${
              migrationResult.failed === 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className={`flex items-center mb-2 ${
                migrationResult.failed === 0 ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {migrationResult.failed === 0 ? (
                  <CheckCircle className="h-5 w-5 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-2" />
                )}
                <span className="font-medium">迁移完成</span>
              </div>
              
              <div className={`text-sm ${
                migrationResult.failed === 0 ? 'text-green-700' : 'text-yellow-700'
              }`}>
                <p>总计: {migrationResult.total} 条</p>
                <p>成功: {migrationResult.success} 条</p>
                <p>失败: {migrationResult.failed} 条</p>
                
                {migrationResult.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="font-medium mb-1">错误详情:</p>
                    <ul className="space-y-1">
                      {migrationResult.errors.map((error, index) => (
                        <li key={index} className="text-xs">• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 使用说明 */}
        <div className="border-t pt-6">
          <h3 className="font-semibold mb-3">使用说明：</h3>
          <ol className="text-sm text-gray-600 space-y-2">
            <li>1. 点击"扫描本地数据"查看localStorage中存储的笔记</li>
            <li>2. 建议先点击"导出备份文件"保存数据副本</li>
            <li>3. 确认无误后点击"开始迁移数据"将数据上传到服务器</li>
            <li>4. 迁移成功后可选择清理本地旧数据</li>
          </ol>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">
              💡 提示：迁移完成后，你的笔记数据将保存在服务器上，可以在不同设备间同步。
              迁移过程不会删除原有的localStorage数据，除非你主动选择清理。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 