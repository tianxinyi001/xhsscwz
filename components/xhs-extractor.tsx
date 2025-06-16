'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StorageManager } from '@/lib/storage';
import { StoredNote } from '@/lib/types';
import { generateId, isValidXHSUrl, extractXHSUrl } from '@/lib/utils';
import { ImageCacheManager } from '@/lib/image-cache';
import { Trash2, ExternalLink, Plus, Tag, X } from 'lucide-react';

interface ApiResponse {
  success: boolean;
  data?: any;
  raw?: string;
  error?: string;
}

interface SimpleNote {
  id: string;
  title: string;
  cover: string;
  url: string;
  tags: string[];
  extractedAt: string;
}

// 标签选择弹窗组件
function TagSelectionModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  allTags,
  onCreateTag 
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tags: string[]) => void;
  allTags: string[];
  onCreateTag: (tag: string) => void;
}) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showNewTagInput, setShowNewTagInput] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleCreateTag = () => {
    if (newTag.trim() && !allTags.includes(newTag.trim())) {
      onCreateTag(newTag.trim());
      setSelectedTags([...selectedTags, newTag.trim()]);
      setNewTag('');
      setShowNewTagInput(false);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedTags);
    setSelectedTags([]);
    onClose();
  };

  const handleClose = () => {
    setSelectedTags([]);
    setNewTag('');
    setShowNewTagInput(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">选择标签</h3>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* 现有标签 */}
          {allTags.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">选择现有标签：</p>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-red-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 新建标签 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">创建新标签：</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewTagInput(!showNewTagInput)}
                className="text-red-500 hover:text-red-600"
              >
                <Plus className="h-4 w-4 mr-1" />
                新建
              </Button>
            </div>

            {showNewTagInput && (
              <div className="flex gap-2">
                <Input
                  placeholder="输入标签名称..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="flex-1 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateTag();
                    }
                  }}
                />
                <Button size="sm" onClick={handleCreateTag}>
                  创建
                </Button>
              </div>
            )}
          </div>

          {/* 已选标签 */}
          {selectedTags.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">已选标签：</p>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded-full flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                      className="hover:text-red-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <Button variant="ghost" onClick={handleClose} className="flex-1">
            取消
          </Button>
          <Button onClick={handleConfirm} className="flex-1 bg-red-500 hover:bg-red-600">
            确定收藏
          </Button>
        </div>
      </div>
    </div>
  );
}

// 标签编辑弹窗组件
function TagEditModal({ 
  isOpen, 
  onClose, 
  onSave, 
  note,
  allTags,
  onCreateTag 
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteId: string, newTags: string[]) => void;
  note: SimpleNote | null;
  allTags: string[];
  onCreateTag: (tag: string) => void;
}) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showNewTagInput, setShowNewTagInput] = useState(false);

  // 当弹窗打开时，初始化选中的标签
  useEffect(() => {
    if (note && isOpen) {
      setSelectedTags([...note.tags]);
    }
  }, [note, isOpen]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleCreateTag = () => {
    if (newTag.trim() && !allTags.includes(newTag.trim())) {
      onCreateTag(newTag.trim());
      setSelectedTags([...selectedTags, newTag.trim()]);
      setNewTag('');
      setShowNewTagInput(false);
    }
  };

  const handleSave = () => {
    if (note) {
      onSave(note.id, selectedTags);
    }
    handleClose();
  };

  const handleClose = () => {
    setSelectedTags([]);
    setNewTag('');
    setShowNewTagInput(false);
    onClose();
  };

  if (!isOpen || !note) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">编辑标签</h3>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 笔记信息 */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-800 line-clamp-2">{note.title}</p>
        </div>

        <div className="space-y-4">
          {/* 现有标签 */}
          {allTags.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">选择标签：</p>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-red-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 新建标签 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">创建新标签：</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewTagInput(!showNewTagInput)}
                className="text-red-500 hover:text-red-600"
              >
                <Plus className="h-4 w-4 mr-1" />
                新建
              </Button>
            </div>

            {showNewTagInput && (
              <div className="flex gap-2">
                <Input
                  placeholder="输入标签名称..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="flex-1 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateTag();
                    }
                  }}
                />
                <Button size="sm" onClick={handleCreateTag}>
                  创建
                </Button>
              </div>
            )}
          </div>

          {/* 已选标签 */}
          {selectedTags.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">已选标签：</p>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded-full flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                      className="hover:text-red-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <Button variant="ghost" onClick={handleClose} className="flex-1">
            取消
          </Button>
          <Button onClick={handleSave} className="flex-1 bg-red-500 hover:bg-red-600">
            保存修改
          </Button>
        </div>
      </div>
    </div>
  );
}

// 删除确认弹窗组件
function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  noteTitle 
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  noteTitle: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="h-6 w-6 text-red-500" />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-800 mb-2">确认删除</h3>
          
          <div className="text-sm text-gray-600 mb-4">
            <p className="mb-2">您确定要删除这篇笔记吗？</p>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-medium text-gray-800 line-clamp-2">{noteTitle}</p>
            </div>
            <p className="mt-2 text-red-500">此操作无法撤销</p>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              onClick={onClose} 
              className="flex-1"
            >
              取消
            </Button>
            <Button 
              onClick={onConfirm} 
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              确认删除
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 清空确认弹窗组件
function ClearAllConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  notesCount 
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  notesCount: number;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="h-6 w-6 text-red-500" />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-800 mb-2">确认清空收藏</h3>
          
          <div className="text-sm text-gray-600 mb-4">
            <p className="mb-2">您确定要清空所有收藏的笔记吗？</p>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-medium text-gray-800">共 {notesCount} 篇笔记</p>
            </div>
            <p className="mt-2 text-red-500">此操作无法撤销</p>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              onClick={onClose} 
              className="flex-1"
            >
              取消
            </Button>
            <Button 
              onClick={onConfirm} 
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              确认清空
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 数据管理弹窗组件
function DataManagementModal({ 
  isOpen, 
  onClose, 
  onExport,
  onImport,
  notesCount 
}: {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  notesCount: number;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">数据管理</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* 当前数据状态 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">当前数据</h4>
            <p className="text-sm text-gray-600">已收藏 {notesCount} 篇笔记</p>
            <p className="text-xs text-gray-500 mt-1">
              数据存储在浏览器本地，换浏览器或清理缓存会丢失
            </p>
          </div>

          {/* 导出数据 */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">备份数据</h4>
            <Button
              onClick={onExport}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              📥 导出备份文件
            </Button>
            <p className="text-xs text-gray-500">
              将您的收藏数据导出为JSON文件，可在其他浏览器中恢复
            </p>
          </div>

          {/* 导入数据 */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">恢复数据</h4>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={onImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="import-file"
              />
              <label
                htmlFor="import-file"
                className="flex items-center justify-center w-full bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2 cursor-pointer transition-colors font-medium text-sm"
              >
                📤 选择备份文件恢复
              </label>
            </div>
            <p className="text-xs text-gray-500">
              选择之前导出的JSON备份文件，自动合并去重
            </p>
          </div>

          {/* 使用说明 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h5 className="text-sm font-medium text-yellow-800 mb-1">💡 使用建议</h5>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• 定期导出备份，防止数据丢失</li>
              <li>• 换浏览器时使用备份文件恢复数据</li>
              <li>• 导入时会自动过滤重复内容</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            关闭
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function XHSExtractor() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(''); // 新增：加载阶段状态
  const [savedNotes, setSavedNotes] = useState<SimpleNote[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // 标签相关状态
  const [allTags, setAllTags] = useState<string[]>([]);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  
  // 弹窗状态
  const [showTagModal, setShowTagModal] = useState(false);
  const [pendingNoteData, setPendingNoteData] = useState<any>(null);
  
  // 标签编辑状态
  const [showTagEditModal, setShowTagEditModal] = useState(false);
  const [editingNote, setEditingNote] = useState<SimpleNote | null>(null);

  // 删除确认状态
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingNote, setDeletingNote] = useState<SimpleNote | null>(null);

  // 清空确认状态
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  // 数据导出/导入相关状态
  const [showDataManagement, setShowDataManagement] = useState(false);

  // 重新提取封面相关状态
  const [isRefreshingCovers, setIsRefreshingCovers] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState({ current: 0, total: 0 });
  const [refreshingSingleId, setRefreshingSingleId] = useState<string | null>(null);

  // 在客户端初始化时加载数据
  useEffect(() => {
    const notes = StorageManager.getAllNotes().map(note => ({
      id: note.id,
      title: note.title,
      cover: note.images[0] || '',
      url: note.url || '',
      tags: note.tags || [],
      extractedAt: note.extractedAt
    }));
    setSavedNotes(notes);
    
    // 提取所有已存在的标签
    const existingTags = Array.from(new Set(notes.flatMap(note => note.tags)));
    setAllTags(existingTags);
    
    // 批量修复历史数据中的图片URL - 延迟执行以确保界面已渲染
    setTimeout(() => {
      fixHistoricalImageUrls(notes);
    }, 500);

    // 启动图片健康检查 - 检测失效的图片链接
    setTimeout(() => {
      performImageHealthCheck(notes);
    }, 1000);

    // 清理过期的浏览器缓存
    setTimeout(() => {
      ImageCacheManager.cleanExpiredCache();
    }, 2000);
  }, []);

  // 批量修复历史数据中的图片URL
  const fixHistoricalImageUrls = (notes: SimpleNote[]) => {
    try {
      let hasUpdates = false;
      const fixedNotes: { title: string; originalUrl: string; fixedUrl: string }[] = [];
      
      console.log('🔧 开始检查需要修复的图片URL...');
      
      notes.forEach(note => {
        try {
          if (note.cover && note.cover.includes('xhscdn.com')) {
            let needsFix = false;
            let fixedUrl = note.cover;
            
            // 检查是否需要修复
            if (!note.cover.startsWith('/api/image-proxy')) {
              needsFix = true;
              
              // 确保使用HTTPS
              if (fixedUrl.startsWith('http://')) {
                fixedUrl = fixedUrl.replace('http://', 'https://');
              }
              
              // 转换为代理URL
              fixedUrl = `/api/image-proxy?url=${encodeURIComponent(fixedUrl)}`;
            }
            
            if (needsFix) {
              // 更新localStorage中的数据
              const existingNote = StorageManager.getNoteById(note.id);
              if (existingNote && existingNote.images && existingNote.images.length > 0) {
                const originalImageUrl = existingNote.images[0];
                existingNote.images[0] = fixedUrl;
                StorageManager.saveNote(existingNote);
                
                // 标记需要更新界面
                hasUpdates = true;
                note.cover = fixedUrl;
                
                fixedNotes.push({
                  title: note.title,
                  originalUrl: originalImageUrl,
                  fixedUrl: fixedUrl
                });
                
                console.log(`✅ 修复: ${note.title}`, {
                  原始: originalImageUrl,
                  修复后: fixedUrl.substring(0, 80) + '...'
                });
              }
            }
          }
        } catch (noteError) {
          console.error(`修复笔记失败: ${note.title}`, noteError);
        }
      });
      
      // 如果有更新，刷新界面并提示用户
      if (hasUpdates) {
        setSavedNotes([...notes]);
        console.log(`🎉 批量修复完成！已修复 ${fixedNotes.length} 篇笔记的图片显示问题`);
        
        // 显示详细的修复报告
        console.group('📋 详细修复报告');
        fixedNotes.forEach((item, index) => {
          console.log(`${index + 1}. ${item.title.substring(0, 30)}...`);
        });
        console.groupEnd();
        
        // 显示用户友好的通知
        setTimeout(() => {
          const notification = document.createElement('div');
          notification.innerHTML = `
            <div style="
              position: fixed; 
              top: 80px; 
              right: 20px; 
              background: linear-gradient(135deg, #4ade80, #22c55e); 
              color: white; 
              padding: 16px 20px; 
              border-radius: 12px; 
              box-shadow: 0 10px 30px rgba(0,0,0,0.2);
              z-index: 10000;
              font-family: system-ui, -apple-system, sans-serif;
              max-width: 320px;
              animation: slideIn 0.3s ease-out;
            ">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 20px;">🔧</span>
                <strong>图片修复完成</strong>
              </div>
              <div style="font-size: 14px; opacity: 0.95;">
                成功修复 ${fixedNotes.length} 篇笔记的封面显示问题
              </div>
              <div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">
                现在所有图片都能正常显示了 ✨
              </div>
            </div>
            <style>
              @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
            </style>
          `;
          
          document.body.appendChild(notification);
          
          // 播放成功音效
          playNotificationSound();
          
          // 5秒后自动移除通知
          setTimeout(() => {
            if (notification.parentNode) {
              notification.style.animation = 'slideIn 0.3s ease-out reverse';
              setTimeout(() => {
                document.body.removeChild(notification);
              }, 300);
            }
          }, 5000);
        }, 1000);
        
      } else {
        console.log('✅ 图片URL检查完成，无需修复');
        
        // 如果是手动触发的修复，显示提示
        if (notes.length > 0) {
          setTimeout(() => {
            const notification = document.createElement('div');
            notification.innerHTML = `
              <div style="
                position: fixed; 
                top: 80px; 
                right: 20px; 
                background: linear-gradient(135deg, #6b7280, #4b5563); 
                color: white; 
                padding: 16px 20px; 
                border-radius: 12px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                z-index: 10000;
                font-family: system-ui, -apple-system, sans-serif;
                max-width: 320px;
                animation: slideIn 0.3s ease-out;
              ">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <span style="font-size: 20px;">✅</span>
                  <strong>检查完成</strong>
                </div>
                <div style="font-size: 14px; opacity: 0.95;">
                  所有图片URL都已经是最新格式，无需修复
                </div>
              </div>
              <style>
                @keyframes slideIn {
                  from { transform: translateX(100%); opacity: 0; }
                  to { transform: translateX(0); opacity: 1; }
                }
              </style>
            `;
            
            document.body.appendChild(notification);
            
            // 3秒后自动移除通知
            setTimeout(() => {
              if (notification.parentNode) {
                notification.style.animation = 'slideIn 0.3s ease-out reverse';
                setTimeout(() => {
                  document.body.removeChild(notification);
                }, 300);
              }
            }, 3000);
          }, 100);
        }
      }
    } catch (error) {
      console.error('批量修复过程中出现错误:', error);
      setError('图片修复过程中出现错误，请稍后重试');
    }
  };

  // 创建新标签
  const handleCreateTag = (tag: string) => {
    if (!allTags.includes(tag)) {
      setAllTags(prev => [...prev, tag]);
    }
  };

  // 播放提示音
  const playNotificationSound = () => {
    try {
      // 使用Web Audio API生成提示音
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // 创建振荡器
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // 连接节点
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // 设置音频参数
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 频率 800Hz
      oscillator.type = 'sine'; // 正弦波
      
      // 设置音量包络（淡入淡出）
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
      
      // 播放音频
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
    } catch (error) {
      console.log('无法播放提示音:', error);
    }
  };

  // 播放删除音效
  const playDeleteSound = () => {
    try {
      // 使用Web Audio API生成删除音效
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // 创建振荡器
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // 连接节点
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // 设置音频参数 - 删除音效用较低的频率
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime); // 频率 400Hz（较低）
      oscillator.type = 'sine'; // 正弦波
      
      // 设置音量包络（快速衰减）
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      
      // 播放音频
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
      
    } catch (error) {
      console.log('无法播放删除音效:', error);
    }
  };

  const handleExtract = async () => {
    if (!url.trim()) {
      setError('请输入小红书链接');
      return;
    }

    // 提取正确的URL并验证
    const extractedUrl = extractXHSUrl(url);
    if (!isValidXHSUrl(extractedUrl)) {
      setError('请输入有效的小红书链接');
      return;
    }

    // 立即显示标签选择弹窗
    setShowTagModal(true);
  };

  // 确认收藏笔记 - 在用户选择标签后执行提取
  const handleConfirmSave = async (selectedTags: string[]) => {
    setIsLoading(true);
    setLoadingStage('正在解析链接...');
    setError(null);
    setShowTagModal(false);

    try {
      // 从用户输入中提取正确的URL
      const extractedUrl = extractXHSUrl(url);
      console.log('用户输入:', url);
      console.log('提取的URL:', extractedUrl);
      console.log('提取的URL类型:', typeof extractedUrl);
      console.log('提取的URL长度:', extractedUrl?.length);

      setLoadingStage('正在获取笔记信息...');

      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: extractedUrl, quickPreview: true }),
      });

      setLoadingStage('正在处理数据...');

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || '提取失败');
      }

      console.log('API完整响应:', result);
      const parsedData = result.data;
      console.log('解析的数据:', parsedData);
      
      setLoadingStage('正在保存笔记...');
      
      // 使用提取的正确URL
      const finalUrl = extractedUrl;
      
      console.log('最终使用的URL:', finalUrl);
      console.log('最终URL类型:', typeof finalUrl);
      console.log('最终URL长度:', finalUrl?.length);
      
      // 生成笔记ID
      const noteId = generateId();
      
      // 尝试下载并保存封面图片（服务器 + 浏览器缓存）
      let localImageUrl: string | null = null;
      let cachedImageUrl: string | null = null;
      
      let permanentUrl: string | null = null;
      if (parsedData.cover && parsedData.cover !== '无封面') {
        setLoadingStage('正在保存封面图片...');
        let realImageUrl = parsedData.cover;
        if (realImageUrl.startsWith('/api/image-proxy')) {
          const urlParams = new URLSearchParams(realImageUrl.split('?')[1]);
          realImageUrl = urlParams.get('url') || realImageUrl;
        }
        permanentUrl = await downloadAndSaveImage(realImageUrl, noteId);
        if (permanentUrl) {
          // 更新localStorage，添加永久图片路径
          const existingNote = StorageManager.getNoteById(noteId);
          if (existingNote) {
            existingNote.permanentImages = [permanentUrl];
            StorageManager.saveNote(existingNote);
          }
          setSavedNotes(prev => [
            { ...simpleNote, cover: finalCoverUrl },
            ...prev
          ]);
          forceRefreshImage(noteId, permanentUrl);
          console.log('✅ 封面已保存到永久存储:', permanentUrl);
        } else {
          console.warn('❌ 封面保存到永久存储失败');
        }
      }
      
      // 收藏时直接用永久封面
      const finalCoverUrl = permanentUrl ? permanentUrl : '';
      
      // 构造简化的笔记对象
      const simpleNote: SimpleNote = {
        id: noteId,
        title: parsedData.title || '未提取到标题',
        cover: finalCoverUrl,
        url: finalUrl, // 使用提取的正确URL
        tags: selectedTags,
        extractedAt: new Date().toISOString()
      };
      
      console.log('保存的笔记对象:', simpleNote);
      console.log('保存的笔记URL:', simpleNote.url);
      console.log('保存的笔记URL类型:', typeof simpleNote.url);

      // 保存到本地存储（保持兼容性）
      const fullNote: StoredNote = {
        id: simpleNote.id,
        title: simpleNote.title,
        content: '',
        author: { name: '' },
        images: finalCoverUrl ? [finalCoverUrl] : [],
        originalImages: parsedData.cover && parsedData.cover !== '无封面' && !parsedData.cover.startsWith('/api/image-proxy')
          ? [parsedData.cover] // 保存原始URL
          : undefined,
        permanentImages: permanentUrl ? [permanentUrl] : undefined,
        tags: simpleNote.tags,
        url: simpleNote.url, // 使用提取的正确URL
        createTime: simpleNote.extractedAt,
        extractedAt: simpleNote.extractedAt
      };

      StorageManager.saveNote(fullNote);
      
      setLoadingStage('收藏成功！');
      
      // 收藏后直接从 localStorage 重新加载所有笔记，避免重复
      const notes = StorageManager.getAllNotes().map(note => ({
        id: note.id,
        title: note.title,
        cover: note.images[0] || '',
        url: note.url || '',
        tags: note.tags || [],
        extractedAt: note.extractedAt
      }));
      setSavedNotes(notes);
      setUrl('');
      setPendingNoteData(null);
      playNotificationSound();
      await new Promise(resolve => setTimeout(resolve, 800));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '提取失败，请稍后重试');
      // 重新显示标签弹窗，让用户可以重试
      setShowTagModal(true);
    } finally {
      setIsLoading(false);
      setLoadingStage('');
    }
  };

  const handleDeleteNote = (id: string) => {
    StorageManager.deleteNote(id);
    setSavedNotes(prev => prev.filter(note => note.id !== id));
  };

  // 显示删除确认弹窗
  const handleShowDeleteConfirm = (note: SimpleNote) => {
    setDeletingNote(note);
    setShowDeleteModal(true);
  };

  // 确认删除
  const handleConfirmDelete = () => {
    if (deletingNote) {
      StorageManager.deleteNote(deletingNote.id);
      setSavedNotes(prev => prev.filter(note => note.id !== deletingNote.id));
      
      // 播放提示音
      playDeleteSound();
    }
    setShowDeleteModal(false);
    setDeletingNote(null);
  };

  // 取消删除
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingNote(null);
  };

  // 打开标签编辑弹窗
  const handleEditTags = (note: SimpleNote) => {
    setEditingNote(note);
    setShowTagEditModal(true);
  };

  // 保存标签修改
  const handleSaveTagEdit = (noteId: string, newTags: string[]) => {
    // 更新本地状态
    setSavedNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, tags: newTags }
        : note
    ));

    // 更新本地存储
    const existingNote = StorageManager.getNoteById(noteId);
    if (existingNote) {
      const updatedNote = { ...existingNote, tags: newTags };
      StorageManager.saveNote(updatedNote);
    }

    // 更新全局标签列表
    const allNotesAfterUpdate = savedNotes.map(note => 
      note.id === noteId 
        ? { ...note, tags: newTags }
        : note
    );
    const updatedAllTags = Array.from(new Set(allNotesAfterUpdate.flatMap(note => note.tags)));
    setAllTags(updatedAllTags);
  };

  const handleClearAll = () => {
    StorageManager.clearAllNotes();
    setSavedNotes([]);
  };

  // 显示清空确认弹窗
  const handleShowClearAllConfirm = () => {
    setShowClearAllModal(true);
  };

  // 确认清空
  const handleConfirmClearAll = () => {
    StorageManager.clearAllNotes();
    setSavedNotes([]);
    setAllTags([]);
    setFilterTag(null);
    setShowClearAllModal(false);
    
    // 播放删除音效
    playDeleteSound();
  };

  // 取消清空
  const handleCancelClearAll = () => {
    setShowClearAllModal(false);
  };

  // 数据导出功能
  const handleExportData = () => {
    try {
      const allNotes = StorageManager.getAllNotes();
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        notes: allNotes,
        tags: allTags
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `小红书收藏_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 播放提示音
      playNotificationSound();
      
      console.log('数据导出成功:', allNotes.length, '篇笔记');
    } catch (error) {
      console.error('数据导出失败:', error);
      setError('数据导出失败，请稍后重试');
    }
  };

  // 数据导入功能
  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        
        // 验证数据格式
        if (!importData.notes || !Array.isArray(importData.notes)) {
          throw new Error('无效的数据格式');
        }
        
        // 获取现有数据
        const existingNotes = StorageManager.getAllNotes();
        const existingIds = new Set(existingNotes.map(note => note.id));
        
        // 过滤重复数据
        const newNotes = importData.notes.filter((note: StoredNote) => !existingIds.has(note.id));
        
        if (newNotes.length === 0) {
          setError('没有新的数据需要导入');
          return;
        }
        
        // 导入新数据
        newNotes.forEach((note: StoredNote) => {
          StorageManager.saveNote(note);
        });
        
        // 更新界面
        const updatedNotes = [...existingNotes, ...newNotes].map(note => ({
          id: note.id,
          title: note.title,
          cover: note.images[0] || '',
          url: note.url || '',
          tags: note.tags || [],
          extractedAt: note.extractedAt
        }));
        
        setSavedNotes(updatedNotes);
        
        // 更新标签
        const allImportedTags = Array.from(new Set([
          ...allTags,
          ...newNotes.flatMap((note: StoredNote) => note.tags || [])
        ]));
        setAllTags(allImportedTags);
        
        // 播放提示音
        playNotificationSound();
        
        console.log('数据导入成功:', newNotes.length, '篇新笔记');
        setShowDataManagement(false);
        
        // 显示成功消息
        const successMsg = `成功导入 ${newNotes.length} 篇笔记`;
        setTimeout(() => {
          alert(successMsg);
        }, 100);
        
      } catch (error) {
        console.error('数据导入失败:', error);
        setError('数据导入失败，请检查文件格式');
      }
    };
    
    reader.readAsText(file);
    
    // 清空input
    event.target.value = '';
  };

  const openNote = (noteUrl: string) => {
    console.log('点击卡片，准备打开URL:', noteUrl);
    console.log('URL类型:', typeof noteUrl);
    console.log('URL长度:', noteUrl?.length);
    console.log('URL是否以http开头:', noteUrl?.startsWith('http://'));
    console.log('URL是否以https开头:', noteUrl?.startsWith('https://'));
    
    if (noteUrl && (noteUrl.startsWith('https://') || noteUrl.startsWith('http://'))) {
      console.log('URL验证通过，即将打开');
      window.open(noteUrl, '_blank');
    } else {
      console.error('无效的URL:', noteUrl);
      console.error('URL验证失败的原因: URL为空或不以http/https开头');
    }
  };

  // 根据标签筛选笔记
  const filteredNotes = filterTag 
    ? savedNotes.filter(note => note.tags.includes(filterTag))
    : savedNotes;

  // 处理图片URL，使用代理来绕过防盗链
  const getProxyImageUrl = (originalUrl: string): string => {
    if (!originalUrl || originalUrl === '无封面') {
      return '';
    }
    
    // 如果已经是代理URL，直接返回
    if (originalUrl.startsWith('/api/image-proxy')) {
      return originalUrl;
    }
    
    // 将HTTP转换为HTTPS
    let processedUrl = originalUrl;
    if (processedUrl.startsWith('http://')) {
      processedUrl = processedUrl.replace('http://', 'https://');
    }
    
    // 如果是小红书CDN链接，使用代理
    if (processedUrl.includes('xhscdn.com')) {
      return `/api/image-proxy?url=${encodeURIComponent(processedUrl)}`;
    }
    
    return processedUrl;
  };

  // 获取最佳图片URL，优先使用本地图片，然后是浏览器缓存
  const getImageUrl = (note: SimpleNote): string => {
    // 检查是否有永久存储的图片
    const existingNote = StorageManager.getNoteById(note.id);
    
    // 优先级1: 永久存储图片
    if (existingNote?.permanentImages && existingNote.permanentImages[0]) {
      return existingNote.permanentImages[0];
    }
    
    // 优先级2: 本地服务器图片
    if (existingNote?.localImages && existingNote.localImages[0]) {
      return existingNote.localImages[0];
    }
    
    // 优先级3: 浏览器缓存图片
    if (existingNote?.cachedImages && existingNote.cachedImages[0]) {
      return existingNote.cachedImages[0];
    }
    
    // 优先级4: 如果是本地路径，直接返回
    if (note.cover && note.cover.startsWith('/permanent-images/')) {
      return note.cover;
    }
    
    // 优先级5: 如果是Base64数据，直接返回
    if (note.cover && note.cover.startsWith('data:')) {
      return note.cover;
    }
    
    // 优先级6: 回退到代理图片逻辑
    return getProxyImageUrl(note.cover);
  };

  // 修复历史数据中的图片URL
  const fixImageUrl = (noteId: string, newImageUrl: string) => {
    // 更新localStorage中的数据
    const existingNote = StorageManager.getNoteById(noteId);
    if (existingNote && existingNote.images[0] !== newImageUrl) {
      existingNote.images[0] = newImageUrl;
      StorageManager.saveNote(existingNote);
      
      // 更新界面显示
      setSavedNotes(prev => prev.map(note => 
        note.id === noteId 
          ? { ...note, cover: newImageUrl }
          : note
      ));
    }
  };

  // 单个笔记重新提取封面
  const refreshSingleCover = async (noteId: string) => {
    const note = savedNotes.find(n => n.id === noteId);
    if (!note || !note.url) {
      console.error('找不到笔记或URL为空:', noteId);
      setError('找不到笔记信息');
      return;
    }

    if (refreshingSingleId === noteId) {
      console.log('该笔记正在刷新中，跳过重复请求');
      return;
    }

    setRefreshingSingleId(noteId);
    setError(null);

    try {
      console.log(`🔄 开始重新提取单个封面: ${note.title}`);
      
      // 显示开始提示
      const startNotification = document.createElement('div');
      startNotification.innerHTML = `
        <div style="
          position: fixed; 
          top: 80px; 
          right: 20px; 
          background: linear-gradient(135deg, #3b82f6, #1d4ed8); 
          color: white; 
          padding: 12px 16px; 
          border-radius: 8px; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10000;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
          animation: slideIn 0.3s ease-out;
        ">
          🔄 正在重新提取封面...
        </div>
        <style>
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        </style>
      `;
      document.body.appendChild(startNotification);
      
      const extractedUrl = extractXHSUrl(note.url || '');
      console.log('提取的URL:', extractedUrl);
      
      if (!extractedUrl || !isValidXHSUrl(extractedUrl)) {
        throw new Error(`无效的URL: ${note.url}`);
      }
      
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: extractedUrl, quickPreview: true }),
      });
      
      console.log('API响应状态:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API调用失败: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('API返回结果:', result);
      
      // 移除开始提示
      if (startNotification.parentNode) {
        document.body.removeChild(startNotification);
      }
      
      if (result.success && result.data && result.data.cover && result.data.cover !== '无封面') {
        const updatedCover = result.data.cover;
        console.log('获取到新封面:', updatedCover);
        
        // 更新localStorage
        const existingNote = StorageManager.getNoteById(noteId);
        if (existingNote) {
          existingNote.images[0] = updatedCover;
          // 保存原始URL（如果不是代理URL）
          if (!updatedCover.startsWith('/api/image-proxy')) {
            existingNote.originalImages = [updatedCover];
          }
          StorageManager.saveNote(existingNote);
          console.log('已更新localStorage');
        }
        
        // 更新界面状态
        setSavedNotes(prev => prev.map(n => 
          n.id === noteId ? { ...n, cover: updatedCover } : n
        ));
        
        // 立即更新对应的图片元素，强制重新加载
        forceRefreshImage(noteId, updatedCover, 100);
        
        console.log(`✅ 单个封面更新成功: ${note.title}`);
        
        // 显示成功通知
        const successNotification = document.createElement('div');
        successNotification.innerHTML = `
          <div style="
            position: fixed; 
            top: 80px; 
            right: 20px; 
            background: linear-gradient(135deg, #10b981, #059669); 
            color: white; 
            padding: 12px 16px; 
            border-radius: 8px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 14px;
            animation: slideIn 0.3s ease-out;
          ">
            ✅ 封面更新成功！
          </div>
          <style>
            @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          </style>
        `;
        document.body.appendChild(successNotification);
        
        // 播放成功音效
        playNotificationSound();
        
        // 3秒后移除成功通知
        setTimeout(() => {
          if (successNotification.parentNode) {
            successNotification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
              document.body.removeChild(successNotification);
            }, 300);
          }
        }, 3000);
        
      } else {
        throw new Error(`无法获取有效封面: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      console.error(`单个封面提取失败: ${note.title}`, error);
      
      // 显示错误通知
      const errorNotification = document.createElement('div');
      errorNotification.innerHTML = `
        <div style="
          position: fixed; 
          top: 80px; 
          right: 20px; 
          background: linear-gradient(135deg, #ef4444, #dc2626); 
          color: white; 
          padding: 12px 16px; 
          border-radius: 8px; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10000;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
          animation: slideIn 0.3s ease-out;
        ">
          ❌ 封面提取失败: ${error instanceof Error ? error.message : '未知错误'}
        </div>
        <style>
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        </style>
      `;
      document.body.appendChild(errorNotification);
      
      // 5秒后移除错误通知
      setTimeout(() => {
        if (errorNotification.parentNode) {
          errorNotification.style.animation = 'slideIn 0.3s ease-out reverse';
          setTimeout(() => {
            document.body.removeChild(errorNotification);
          }, 300);
        }
      }, 5000);
      
      setError(`封面提取失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setRefreshingSingleId(null);
    }
  };

  // 渲染小红书风格的简化笔记卡片
  const renderNoteCard = (note: SimpleNote) => {
    const imageUrl = getImageUrl(note);
    
    return (
      <div 
        key={note.id}
        data-note-id={note.id}
        className="xhs-note-card group"
        onClick={() => openNote(note.url)}
      >
        {/* 封面图片 */}
        <div className="relative overflow-hidden aspect-[3/4] w-full bg-gray-100 flex items-center justify-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={note.title}
              className="max-w-full max-h-full object-contain mx-auto"
              onError={(e) => {
                // 图片加载失败时的处理策略
                console.error('图片加载失败:', imageUrl);
                
                const target = e.target as HTMLImageElement;
                
                // 如果是本地图片失败，尝试使用代理URL
                if (imageUrl.startsWith('/uploads/')) {
                  const fallbackUrl = getProxyImageUrl(note.cover);
                  if (fallbackUrl && fallbackUrl !== imageUrl) {
                    console.log('本地图片失败，尝试代理URL:', fallbackUrl);
                    target.src = fallbackUrl;
                    return;
                  }
                }
                
                // 如果当前使用的不是代理URL，尝试使用代理
                if (!note.cover.startsWith('/api/image-proxy') && note.cover.includes('xhscdn.com')) {
                  const fallbackUrl = getProxyImageUrl(note.cover);
                  if (fallbackUrl !== imageUrl) {
                    console.log('尝试代理URL:', fallbackUrl);
                    target.src = fallbackUrl;
                    
                    // 修复localStorage中的数据
                    fixImageUrl(note.id, fallbackUrl);
                    return;
                  }
                }
                
                // 如果是HTTP URL，尝试HTTPS
                if (note.cover.startsWith('http://')) {
                  const httpsUrl = note.cover.replace('http://', 'https://');
                  const httpsProxyUrl = getProxyImageUrl(httpsUrl);
                  console.log('尝试HTTPS代理URL:', httpsProxyUrl);
                  target.src = httpsProxyUrl;
                  
                  // 修复localStorage中的数据
                  fixImageUrl(note.id, httpsProxyUrl);
                  return;
                }
                
                // 最终失败，显示占位符和重新提取按钮
                target.style.display = 'none';
                const placeholder = target.nextElementSibling as HTMLElement;
                if (placeholder) {
                  placeholder.style.display = 'flex';
                }
              }}
              onLoad={() => {
                console.log('图片加载成功:', imageUrl);
                
                // 如果成功加载了修复后的URL，更新数据
                if (imageUrl !== note.cover && imageUrl.startsWith('/api/image-proxy')) {
                  fixImageUrl(note.id, imageUrl);
                }
              }}
            />
          ) : null}
          {/* 图片加载失败或无封面时的占位符 */}
          <div 
            data-placeholder="true"
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200"
            style={{ display: imageUrl ? 'none' : 'flex' }}
          >
            <div className="text-center">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-gray-500 text-xs">📷</span>
              </div>
              <span className="text-gray-400 text-xs">暂无封面</span>
              {/* 重新提取封面按钮 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('点击重新获取按钮，笔记ID:', note.id);
                  refreshSingleCover(note.id);
                }}
                disabled={refreshingSingleId === note.id}
                className={`mt-2 px-2 py-1 text-white text-xs rounded transition-colors flex items-center gap-1 ${
                  refreshingSingleId === note.id 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-500 hover:bg-green-600'
                }`}
                title="重新提取封面"
              >
                {refreshingSingleId === note.id ? (
                  <>
                    <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full"></div>
                    提取中...
                  </>
                ) : (
                  <>🔄 重新获取</>
                )}
              </button>
            </div>
          </div>
          
          {/* 删除按钮 */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleShowDeleteConfirm(note);
              }}
              className="h-7 w-7 p-0 bg-black/20 hover:bg-black/40 text-white rounded-full"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          {/* 编辑标签按钮 */}
          <div className="absolute top-2 right-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleEditTags(note);
              }}
              className="h-7 w-7 p-0 bg-black/20 hover:bg-black/40 text-white rounded-full"
            >
              <Tag className="h-3 w-3" />
            </Button>
          </div>

          {/* 外链图标 */}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black/20 rounded-full p-1">
              <ExternalLink className="h-3 w-3 text-white" />
            </div>
          </div>
        </div>
        
        {/* 标题和标签 */}
        <div className="p-3">
          <h3 className="title line-clamp-2 mb-2">
            {note.title}
          </h3>
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {note.tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 重新提取丢失的封面
  const refreshMissingCovers = async () => {
    if (isRefreshingCovers) return;
    
    setIsRefreshingCovers(true);
    setError(null);
    
    try {
      // 找出需要重新提取封面的笔记
      const notesToRefresh = savedNotes.filter(note => 
        note.url && (
          !note.cover || 
          note.cover === '无封面' || 
          note.cover === '' ||
          note.cover.includes('暂无封面')
        )
      );
      
      if (notesToRefresh.length === 0) {
        setTimeout(() => {
          const notification = document.createElement('div');
          notification.innerHTML = `
            <div style="
              position: fixed; 
              top: 80px; 
              right: 20px; 
              background: linear-gradient(135deg, #6b7280, #4b5563); 
              color: white; 
              padding: 16px 20px; 
              border-radius: 12px; 
              box-shadow: 0 10px 30px rgba(0,0,0,0.2);
              z-index: 10000;
              font-family: system-ui, -apple-system, sans-serif;
              max-width: 320px;
              animation: slideIn 0.3s ease-out;
            ">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 20px;">✅</span>
                <strong>检查完成</strong>
              </div>
              <div style="font-size: 14px; opacity: 0.95;">
                所有笔记都已有封面，无需重新提取
              </div>
            </div>
            <style>
              @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
            </style>
          `;
          
          document.body.appendChild(notification);
          
          setTimeout(() => {
            if (notification.parentNode) {
              notification.style.animation = 'slideIn 0.3s ease-out reverse';
              setTimeout(() => {
                document.body.removeChild(notification);
              }, 300);
            }
          }, 3000);
        }, 100);
        
        setIsRefreshingCovers(false);
        return;
      }
      
      console.log(`🔄 开始重新提取 ${notesToRefresh.length} 篇笔记的封面...`);
      setRefreshProgress({ current: 0, total: notesToRefresh.length });
      
      const successCount = { value: 0 };
      const failCount = { value: 0 };
      
      // 逐个重新提取封面
      for (let i = 0; i < notesToRefresh.length; i++) {
        const note = notesToRefresh[i];
        setRefreshProgress({ current: i + 1, total: notesToRefresh.length });
        
        try {
          console.log(`📷 重新提取封面 (${i + 1}/${notesToRefresh.length}): ${note.title}`);
          
          // 从URL中提取正确的小红书链接
          const extractedUrl = extractXHSUrl(note.url || '');
          if (!extractedUrl || !isValidXHSUrl(extractedUrl)) {
            console.warn(`跳过无效URL: ${note.url}`);
            failCount.value++;
            continue;
          }
          
          // 调用API重新提取封面
          const response = await fetch('/api/extract', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: extractedUrl, quickPreview: true }),
          });
          
          if (!response.ok) {
            throw new Error(`API调用失败: ${response.status}`);
          }
          
          const result = await response.json();
          
          if (result.success && result.data && result.data.cover && result.data.cover !== '无封面') {
            // 更新笔记封面
            const updatedCover = result.data.cover;
            
            // 更新localStorage
            const existingNote = StorageManager.getNoteById(note.id);
            if (existingNote) {
              existingNote.images[0] = updatedCover;
              // 保存原始URL（如果不是代理URL）
              if (!updatedCover.startsWith('/api/image-proxy')) {
                existingNote.originalImages = [updatedCover];
              }
              StorageManager.saveNote(existingNote);
            }
            
            // 更新界面状态
            setSavedNotes(prev => prev.map(n => 
              n.id === note.id ? { ...n, cover: updatedCover } : n
            ));
            
            // 立即更新对应的图片元素，错开更新时间避免闪烁
            forceRefreshImage(note.id, updatedCover, 200 * i);
            
            successCount.value++;
            console.log(`✅ 封面更新成功: ${note.title}`);
          } else {
            console.warn(`封面提取失败: ${note.title}`, result);
            failCount.value++;
          }
          
          // 避免请求过于频繁
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`封面提取失败: ${note.title}`, error);
          failCount.value++;
        }
      }
      
      // 显示完成通知
      setTimeout(() => {
        const notification = document.createElement('div');
        notification.innerHTML = `
          <div style="
            position: fixed; 
            top: 80px; 
            right: 20px; 
            background: linear-gradient(135deg, #10b981, #059669); 
            color: white; 
            padding: 16px 20px; 
            border-radius: 12px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            z-index: 10000;
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 320px;
            animation: slideIn 0.3s ease-out;
          ">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 20px;">📷</span>
              <strong>封面刷新完成</strong>
            </div>
            <div style="font-size: 14px; opacity: 0.95; margin-bottom: 4px;">
              成功恢复 ${successCount.value} 个封面
            </div>
            ${failCount.value > 0 ? `<div style="font-size: 12px; opacity: 0.8;">失败 ${failCount.value} 个</div>` : ''}
          </div>
          <style>
            @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          </style>
        `;
        
        document.body.appendChild(notification);
        
        // 播放成功音效
        playNotificationSound();
        
        setTimeout(() => {
          if (notification.parentNode) {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
              document.body.removeChild(notification);
            }, 300);
          }
        }, 5000);
      }, 500);
      
      console.log(`🎉 封面刷新完成! 成功: ${successCount.value}, 失败: ${failCount.value}`);
      
    } catch (error) {
      console.error('重新提取封面过程中出现错误:', error);
      setError('重新提取封面失败，请稍后重试');
    } finally {
      setIsRefreshingCovers(false);
      setRefreshProgress({ current: 0, total: 0 });
    }
  };

  // 强制刷新指定笔记的图片显示
  const forceRefreshImage = (noteId: string, newImageUrl: string, delay: number = 100) => {
    setTimeout(() => {
      const noteCard = document.querySelector(`[data-note-id="${noteId}"]`);
      if (noteCard) {
        const imgElement = noteCard.querySelector('img') as HTMLImageElement;
        const placeholderElement = noteCard.querySelector('[data-placeholder]') as HTMLElement;
        
        if (placeholderElement) {
          // 隐藏占位符
          placeholderElement.style.display = 'none';
        }
        
        if (imgElement) {
          // 显示并更新图片
          imgElement.style.display = 'block';
          
          // 强制重新加载图片（添加时间戳避免缓存）
          const timestamp = Date.now();
          const newSrc = newImageUrl.includes('?') 
            ? `${newImageUrl}&t=${timestamp}`
            : `${newImageUrl}?t=${timestamp}`;
          
          imgElement.src = newSrc;
          
          console.log(`🖼️ 强制刷新图片显示 [${noteId}]:`, newSrc);
        } else {
          // 如果没有img元素，创建一个新的
          const imageContainer = noteCard.querySelector('.aspect-\\[3\\/4\\]');
          if (imageContainer && placeholderElement) {
            const newImg = document.createElement('img');
            newImg.src = newImageUrl;
            newImg.alt = '';
            newImg.className = 'max-w-full max-h-full object-contain mx-auto';
            
            imageContainer.insertBefore(newImg, placeholderElement);
            
            console.log(`🆕 创建新图片元素 [${noteId}]:`, newImageUrl);
          }
        }
      }
    }, delay);
  };

  // 图片健康检查 - 检测并修复失效的图片链接
  const performImageHealthCheck = async (notes: SimpleNote[]) => {
    console.log('🔍 开始图片健康检查...');
    
    const failedImages: { noteId: string; title: string; imageUrl: string }[] = [];
    
    // 检查每个笔记的封面
    for (const note of notes) {
      if (note.cover && note.cover.startsWith('/api/image-proxy')) {
        try {
          // 尝试加载图片，如果失败则记录
          const checkResult = await checkImageAvailability(note.cover);
          if (!checkResult) {
            failedImages.push({
              noteId: note.id,
              title: note.title,
              imageUrl: note.cover
            });
          }
        } catch (error) {
          failedImages.push({
            noteId: note.id,
            title: note.title,
            imageUrl: note.cover
          });
        }
      }
    }
    
    if (failedImages.length > 0) {
      console.log(`⚠️ 发现 ${failedImages.length} 个失效的图片链接`);
      
      // 显示检测结果通知
      setTimeout(() => {
        const notification = document.createElement('div');
        notification.innerHTML = `
          <div style="
            position: fixed; 
            top: 80px; 
            right: 20px; 
            background: linear-gradient(135deg, #f59e0b, #d97706); 
            color: white; 
            padding: 16px 20px; 
            border-radius: 12px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            z-index: 10000;
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 320px;
            animation: slideIn 0.3s ease-out;
          ">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 20px;">⚠️</span>
              <strong>发现失效封面</strong>
            </div>
            <div style="font-size: 14px; opacity: 0.95; margin-bottom: 8px;">
              检测到 ${failedImages.length} 个封面链接失效
            </div>
            <div style="font-size: 12px; opacity: 0.8;">
              建议点击"📷 刷新封面"重新获取
            </div>
          </div>
          <style>
            @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          </style>
        `;
        
        document.body.appendChild(notification);
        
        // 8秒后自动移除通知
        setTimeout(() => {
          if (notification.parentNode) {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
              document.body.removeChild(notification);
            }, 300);
          }
        }, 8000);
      }, 100);
      
      // 自动尝试从原始URL重新生成代理URL
      await autoFixFailedImages(failedImages);
    } else {
      console.log('✅ 图片健康检查完成，所有封面正常');
    }
  };

  // 检查图片是否可用
  const checkImageAvailability = (imageUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = imageUrl;
      
      // 5秒超时
      setTimeout(() => resolve(false), 5000);
    });
  };

  // 自动修复失效的图片
  const autoFixFailedImages = async (failedImages: { noteId: string; title: string; imageUrl: string }[]) => {
    console.log('🔧 开始自动修复失效的图片...');
    
    let fixedCount = 0;
    
    for (const failed of failedImages) {
      try {
        const existingNote = StorageManager.getNoteById(failed.noteId);
        if (!existingNote) continue;
        
        let fixedUrl: string | null = null;
        
        // 策略1: 如果有原始URL，重新生成代理URL
        if (existingNote.originalImages && existingNote.originalImages[0]) {
          const originalUrl = existingNote.originalImages[0];
          const newProxyUrl = getProxyImageUrl(originalUrl);
          
          const isValid = await checkImageAvailability(newProxyUrl);
          if (isValid) {
            fixedUrl = newProxyUrl;
            console.log(`✅ 策略1成功 - 重新生成代理URL: ${failed.title}`);
          }
        }
        
        // 策略2: 如果策略1失败，且有URL，重新调用API获取最新封面
        if (!fixedUrl && existingNote.url) {
          try {
            console.log(`🔄 策略2 - 重新调用API获取封面: ${failed.title}`);
            
            const extractedUrl = extractXHSUrl(existingNote.url);
            if (extractedUrl && isValidXHSUrl(extractedUrl)) {
              const response = await fetch('/api/extract', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: extractedUrl, quickPreview: true }),
              });
              
              if (response.ok) {
                const result = await response.json();
                if (result.success && result.data && result.data.cover && result.data.cover !== '无封面') {
                  fixedUrl = result.data.cover;
                  
                  // 保存新的原始URL
                  if (fixedUrl && !fixedUrl.startsWith('/api/image-proxy')) {
                    existingNote.originalImages = [fixedUrl];
                  }
                  
                  console.log(`✅ 策略2成功 - API重新获取: ${failed.title}`);
                }
              }
            }
          } catch (apiError) {
            console.warn(`策略2失败: ${failed.title}`, apiError);
          }
        }
        
        // 如果找到了有效的修复URL，应用修复
        if (fixedUrl) {
          // 在这个if块内，fixedUrl已经确认不为null
          const validFixedUrl = fixedUrl; // TypeScript类型细化
          
          // 更新存储
          existingNote.images[0] = validFixedUrl;
          StorageManager.saveNote(existingNote);
          
          // 更新界面
          setSavedNotes(prev => prev.map(note => 
            note.id === failed.noteId ? { ...note, cover: validFixedUrl } : note
          ));
          
          // 强制刷新图片显示
          forceRefreshImage(failed.noteId, validFixedUrl, fixedCount * 100);
          
          fixedCount++;
          console.log(`✅ 自动修复成功: ${failed.title}`);
        } else {
          console.warn(`❌ 所有修复策略都失败: ${failed.title}`);
        }
        
        // 避免请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error(`自动修复失败: ${failed.title}`, error);
      }
    }
    
    if (fixedCount > 0) {
      console.log(`🎉 自动修复完成，成功修复 ${fixedCount}/${failedImages.length} 个封面`);
      
      // 显示修复结果
      setTimeout(() => {
        const notification = document.createElement('div');
        notification.innerHTML = `
          <div style="
            position: fixed; 
            top: 80px; 
            right: 20px; 
            background: linear-gradient(135deg, #10b981, #059669); 
            color: white; 
            padding: 16px 20px; 
            border-radius: 12px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            z-index: 10000;
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 320px;
            animation: slideIn 0.3s ease-out;
          ">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 20px;">🔧</span>
              <strong>自动修复完成</strong>
            </div>
            <div style="font-size: 14px; opacity: 0.95;">
              成功修复 ${fixedCount}/${failedImages.length} 个失效封面
            </div>
            ${failedImages.length - fixedCount > 0 ? 
              `<div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">
                ${failedImages.length - fixedCount} 个无法自动修复，建议手动刷新
              </div>` : 
              `<div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">
                所有失效封面已恢复显示 ✨
              </div>`
            }
          </div>
          <style>
            @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          </style>
        `;
        
        document.body.appendChild(notification);
        
        // 播放成功音效
        playNotificationSound();
        
        // 5秒后移除通知
        setTimeout(() => {
          if (notification.parentNode) {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
              document.body.removeChild(notification);
            }, 300);
          }
        }, 5000);
      }, 2000);
    } else {
      console.log('❌ 无法自动修复任何失效的封面');
    }
  };

  // 下载并保存图片到永久存储
  async function downloadAndSaveImage(imageUrl: string, noteId: string): Promise<string | null> {
    try {
      console.log('开始保存图片到永久存储:', { imageUrl, noteId });
      
      const response: Response = await fetch('/api/permanent-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl, noteId }),
      });

      console.log('收到服务器响应:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('保存图片失败:', { status: response.status, error: errorText });
        throw new Error(`保存图片失败: ${response.status}`);
      }

      const result = await response.json();
      console.log('服务器返回结果:', result);
      
      if (!result.success) {
        console.error('保存图片失败:', result.error);
        throw new Error(result.error || '保存图片失败');
      }

      console.log('图片保存成功:', result.imageUrl);
      return result.imageUrl;
    } catch (error) {
      console.error('保存图片失败:', error);
      return null;
    }
  }

  // 批量下载所有封面到本地
  const downloadAllCoversToLocal = async () => {
    if (isRefreshingCovers) return;
    
    setIsRefreshingCovers(true);
    setError(null);
    
    try {
      const allNotes = StorageManager.getAllNotes();
      
      // 过滤出需要下载的笔记（还没有本地图片的）
      const notesToDownload = allNotes.filter(note => 
        note.images && note.images[0] && 
        !note.localImages && 
        !note.images[0].startsWith('/uploads/') &&
        note.images[0] !== '无封面'
      );
      
      if (notesToDownload.length === 0) {
        setTimeout(() => {
          const notification = document.createElement('div');
          notification.innerHTML = `
            <div style="
              position: fixed; 
              top: 80px; 
              right: 20px; 
              background: linear-gradient(135deg, #6b7280, #4b5563); 
              color: white; 
              padding: 16px 20px; 
              border-radius: 12px; 
              box-shadow: 0 10px 30px rgba(0,0,0,0.2);
              z-index: 10000;
              font-family: system-ui, -apple-system, sans-serif;
              max-width: 320px;
              animation: slideIn 0.3s ease-out;
            ">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 20px;">✅</span>
                <strong>检查完成</strong>
              </div>
              <div style="font-size: 14px; opacity: 0.95;">
                所有封面都已保存到本地，无需重新下载
              </div>
            </div>
            <style>
              @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
            </style>
          `;
          
          document.body.appendChild(notification);
          
          setTimeout(() => {
            if (notification.parentNode) {
              notification.style.animation = 'slideIn 0.3s ease-out reverse';
              setTimeout(() => {
                document.body.removeChild(notification);
              }, 300);
            }
          }, 3000);
        }, 100);
        
        setIsRefreshingCovers(false);
        return;
      }
      
      console.log(`💾 开始批量下载 ${notesToDownload.length} 个封面到本地...`);
      setRefreshProgress({ current: 0, total: notesToDownload.length });
      
      const successCount = { value: 0 };
      const failCount = { value: 0 };
      
      // 逐个下载封面
      for (let i = 0; i < notesToDownload.length; i++) {
        const note = notesToDownload[i];
        setRefreshProgress({ current: i + 1, total: notesToDownload.length });
        
        try {
          console.log(`💾 下载封面 (${i + 1}/${notesToDownload.length}): ${note.title}`);
          
          const localUrl = await downloadAndSaveImage(note.images[0], note.id);
          
          if (localUrl) {
            // 更新localStorage，添加本地图片路径
            note.localImages = [localUrl];
            StorageManager.saveNote(note);
            
            // 更新界面状态
            setSavedNotes(prev => prev.map(n => 
              n.id === note.id ? { ...n, cover: localUrl } : n
            ));
            
            // 强制刷新图片显示
            forceRefreshImage(note.id, localUrl, 200 * i);
            
            successCount.value++;
            console.log(`✅ 封面下载成功: ${note.title}`);
          } else {
            console.warn(`封面下载失败: ${note.title}`);
            failCount.value++;
          }
          
          // 避免请求过于频繁
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`封面下载失败: ${note.title}`, error);
          failCount.value++;
        }
      }
      
      // 显示完成通知
      setTimeout(() => {
        const notification = document.createElement('div');
        notification.innerHTML = `
          <div style="
            position: fixed; 
            top: 80px; 
            right: 20px; 
            background: linear-gradient(135deg, #10b981, #059669); 
            color: white; 
            padding: 16px 20px; 
            border-radius: 12px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            z-index: 10000;
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 320px;
            animation: slideIn 0.3s ease-out;
          ">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 20px;">💾</span>
              <strong>下载完成</strong>
            </div>
            <div style="font-size: 14px; opacity: 0.95; margin-bottom: 4px;">
              成功下载 ${successCount.value}/${notesToDownload.length} 个封面到本地
            </div>
            ${failCount.value > 0 ? `<div style="font-size: 12px; opacity: 0.8;">失败 ${failCount.value} 个</div>` : 
              `<div style="font-size: 12px; opacity: 0.8;">所有封面已永久保存 🎉</div>`}
          </div>
          <style>
            @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          </style>
        `;
        
        document.body.appendChild(notification);
        
        // 播放成功音效
        playNotificationSound();
        
        setTimeout(() => {
          if (notification.parentNode) {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
              document.body.removeChild(notification);
            }, 300);
          }
        }, 5000);
      }, 500);
      
      console.log(`🎉 批量下载完成! 成功: ${successCount.value}, 失败: ${failCount.value}`);
      
    } catch (error) {
      console.error('批量下载过程中出现错误:', error);
      setError('批量下载失败，请稍后重试');
    } finally {
      setIsRefreshingCovers(false);
      setRefreshProgress({ current: 0, total: 0 });
    }
  };

  const cacheAllImagesToBrowser = async () => {
    if (isRefreshingCovers) return;
    
    setIsRefreshingCovers(true);
    setError(null);
    
    try {
      const allNotes = StorageManager.getAllNotes();
      
      // 过滤出需要缓存的笔记（还没有缓存的）
      const notesToCache = allNotes.filter(note => 
        note.images && note.images[0] && 
        !note.cachedImages && 
        !note.images[0].startsWith('/uploads/') &&
        note.images[0] !== '无封面'
      );
      
      if (notesToCache.length === 0) {
        setTimeout(() => {
          const notification = document.createElement('div');
          notification.innerHTML = `
            <div style="
              position: fixed; 
              top: 80px; 
              right: 20px; 
              background: linear-gradient(135deg, #6b7280, #4b5563); 
              color: white; 
              padding: 16px 20px; 
              border-radius: 12px; 
              box-shadow: 0 10px 30px rgba(0,0,0,0.2);
              z-index: 10000;
              font-family: system-ui, -apple-system, sans-serif;
              max-width: 320px;
              animation: slideIn 0.3s ease-out;
            ">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 20px;">✅</span>
                <strong>检查完成</strong>
              </div>
              <div style="font-size: 14px; opacity: 0.95;">
                所有笔记都已缓存到浏览器，无需重新缓存
              </div>
            </div>
            <style>
              @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
            </style>
          `;
          
          document.body.appendChild(notification);
          
          setTimeout(() => {
            if (notification.parentNode) {
              notification.style.animation = 'slideIn 0.3s ease-out reverse';
              setTimeout(() => {
                document.body.removeChild(notification);
              }, 300);
            }
          }, 3000);
        }, 100);
        
        setIsRefreshingCovers(false);
        return;
      }
      
      console.log(`💽 开始批量缓存 ${notesToCache.length} 个封面到浏览器...`);
      setRefreshProgress({ current: 0, total: notesToCache.length });
      
      const successCount = { value: 0 };
      const failCount = { value: 0 };
      
      // 逐个缓存封面
      for (let i = 0; i < notesToCache.length; i++) {
        const note = notesToCache[i];
        setRefreshProgress({ current: i + 1, total: notesToCache.length });
        
        try {
          console.log(`💽 缓存封面 (${i + 1}/${notesToCache.length}): ${note.title}`);
          
          const cachedUrl = await ImageCacheManager.cacheImage(note.images[0], note.id);
          
          if (cachedUrl) {
            // 更新localStorage，添加浏览器缓存路径
            note.cachedImages = [cachedUrl];
            StorageManager.saveNote(note);
            
            // 更新界面状态
            setSavedNotes(prev => prev.map(n => 
              n.id === note.id ? { ...n, cover: cachedUrl } : n
            ));
            
            // 强制刷新图片显示
            forceRefreshImage(note.id, cachedUrl, 200 * i);
            
            successCount.value++;
            console.log(`✅ 封面缓存成功: ${note.title}`);
          } else {
            console.warn(`封面缓存失败: ${note.title}`);
            failCount.value++;
          }
          
          // 避免请求过于频繁
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`封面缓存失败: ${note.title}`, error);
          failCount.value++;
        }
      }
      
      // 显示完成通知
      setTimeout(() => {
        const notification = document.createElement('div');
        notification.innerHTML = `
          <div style="
            position: fixed; 
            top: 80px; 
            right: 20px; 
            background: linear-gradient(135deg, #10b981, #059669); 
            color: white; 
            padding: 16px 20px; 
            border-radius: 12px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            z-index: 10000;
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 320px;
            animation: slideIn 0.3s ease-out;
          ">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 20px;">💽</span>
              <strong>缓存完成</strong>
            </div>
            <div style="font-size: 14px; opacity: 0.95; margin-bottom: 4px;">
              成功缓存 ${successCount.value} 个封面
            </div>
            ${failCount.value > 0 ? `<div style="font-size: 12px; opacity: 0.8;">失败 ${failCount.value} 个</div>` : ''}
          </div>
          <style>
            @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          </style>
        `;
        
        document.body.appendChild(notification);
        
        // 播放成功音效
        playNotificationSound();
        
        setTimeout(() => {
          if (notification.parentNode) {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
              document.body.removeChild(notification);
            }, 300);
          }
        }, 5000);
      }, 500);
      
      console.log(`🎉 批量缓存完成! 成功: ${successCount.value}, 失败: ${failCount.value}`);
      
    } catch (error) {
      console.error('批量缓存过程中出现错误:', error);
      setError('批量缓存失败，请稍后重试');
    } finally {
      setIsRefreshingCovers(false);
      setRefreshProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 全局加载进度条 */}
      {(isLoading || isRefreshingCovers) && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="bg-gradient-to-r from-red-400 to-pink-400 h-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/30" 
                 style={{ 
                   animation: 'loading-progress 2s ease-in-out infinite' 
                 }}>
            </div>
          </div>
          <div className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-center gap-3 text-sm text-gray-700">
                <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full"></div>
                <span className="font-medium">
                  {isRefreshingCovers 
                    ? `正在批量处理... (${refreshProgress.current}/${refreshProgress.total})`
                    : (loadingStage || '正在处理...')
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 顶部导航栏 */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-gradient-to-r from-red-400 to-pink-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-base">红</span>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">红书对标库</h1>
          </div>
          <div className="ml-12 mt-1">
            <span className="text-xs text-gray-400 font-normal tracking-wide leading-tight">发现红书爆款，收藏你的专属灵感</span>
          </div>
          {savedNotes.length > 0 && (
            <div className="absolute top-6 right-8">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshMissingCovers}
                  disabled={isRefreshingCovers}
                  className="text-gray-500 hover:text-green-500"
                  title="重新提取丢失的封面"
                >
                  {isRefreshingCovers ? (
                    <>
                      <div className="animate-spin h-3 w-3 border border-green-500 border-t-transparent rounded-full mr-1"></div>
                      📷 提取中 {refreshProgress.current}/{refreshProgress.total}
                    </>
                  ) : (
                    <>📷 刷新封面</>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    console.log('=== 调试信息 ===');
                    console.log('savedNotes数量:', savedNotes.length);
                    console.log('refreshingSingleId:', refreshingSingleId);
                    console.log('缺失封面的笔记:', savedNotes.filter(note => 
                      !note.cover || note.cover === '无封面' || note.cover === ''
                    ));
                    
                    // 测试第一个无封面的笔记
                    const testNote = savedNotes.find(note => 
                      !note.cover || note.cover === '无封面' || note.cover === ''
                    );
                    if (testNote) {
                      console.log('测试笔记:', testNote);
                      refreshSingleCover(testNote.id);
                    } else {
                      console.log('没有找到需要测试的笔记');
                    }
                  }}
                  className="text-gray-500 hover:text-purple-500"
                  title="调试单个封面提取"
                >
                  🐛 调试测试
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fixHistoricalImageUrls(savedNotes)}
                  className="text-gray-500 hover:text-orange-500"
                  title="修复图片显示问题"
                >
                  🔧 修复图片
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDataManagement(true)}
                  className="text-gray-500 hover:text-blue-500"
                >
                  💾 备份恢复
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShowClearAllConfirm}
                  className="text-gray-500 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  清空收藏
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => performImageHealthCheck(savedNotes)}
                  className="text-gray-500 hover:text-purple-500"
                  title="检查图片健康状态"
                >
                  🔍 健康检查
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadAllCoversToLocal()}
                  disabled={isRefreshingCovers}
                  className="text-gray-500 hover:text-blue-500"
                  title="下载所有封面到本地"
                >
                  💾 本地保存
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => cacheAllImagesToBrowser()}
                  disabled={isRefreshingCovers}
                  className="text-gray-500 hover:text-purple-500"
                  title="缓存所有图片到浏览器"
                >
                  💽 浏览器缓存
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* 添加笔记区域 */}
        <div className="mb-8">
          <div className="flex gap-4">
            {/* 输入区域 */}
            <div className="flex-1">
              {/* 链接输入和收藏按钮 */}
              <div className="flex gap-3">
                <Input
                  placeholder="🔗 粘贴小红书链接，快速收藏笔记..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className={`flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:border-red-300 focus:ring-red-100 transition-all duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'}`}
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isLoading && url.trim()) {
                      handleExtract();
                    }
                  }}
                />
                <Button 
                  onClick={handleExtract}
                  disabled={isLoading || !url.trim()}
                  className="bg-gradient-to-r from-red-400 to-pink-400 hover:from-red-500 hover:to-pink-500 text-white rounded-xl px-6 py-3 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  收藏笔记
                </Button>
              </div>
              {error && (
                <p className="text-red-500 text-sm mt-3">{error}</p>
              )}
            </div>
          </div>
        </div>

        {/* 顶部导航栏功能按钮 */}
        <div className="absolute top-6 right-8">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshMissingCovers}
              disabled={isRefreshingCovers}
              className="text-gray-500 hover:text-green-500"
              title="重新提取丢失的封面"
            >
              {isRefreshingCovers ? (
                <>
                  <div className="animate-spin h-3 w-3 border border-green-500 border-t-transparent rounded-full mr-1"></div>
                  📷 提取中 {refreshProgress.current}/{refreshProgress.total}
                </>
              ) : (
                <>📷 刷新封面</>
              )}
            </Button>
          </div>
        </div>

        {/* 标签导航栏 - 类似小红书主页 */}
        {allTags.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setFilterTag(null)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  filterTag === null
                    ? 'bg-red-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                推荐
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                    filterTag === tag
                      ? 'bg-red-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 笔记收藏区域 */}
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Tag className="h-5 w-5 text-red-500" />
              我的收藏 ({filteredNotes.length})
              {filterTag && (
                <span className="text-sm font-normal text-gray-500">
                  · {filterTag}
                </span>
              )}
            </h2>
          </div>
          
          {filteredNotes.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                {savedNotes.length === 0 ? '还没有收藏的笔记' : '没有找到匹配的笔记'}
              </h3>
              <p className="text-gray-500">
                {savedNotes.length === 0 ? '快去收藏你喜欢的小红书笔记吧！' : '试试其他标签'}
              </p>
            </div>
          ) : (
            <div className="notes-grid">
              {filteredNotes.map((note) => renderNoteCard(note))}
            </div>
          )}
        </div>
      </div>

      {/* 标签选择弹窗 */}
      <TagSelectionModal
        isOpen={showTagModal}
        onClose={() => setShowTagModal(false)}
        onConfirm={handleConfirmSave}
        allTags={allTags}
        onCreateTag={handleCreateTag}
      />

      {/* 标签编辑弹窗 */}
      <TagEditModal
        isOpen={showTagEditModal}
        onClose={() => setShowTagEditModal(false)}
        onSave={handleSaveTagEdit}
        note={editingNote}
        allTags={allTags}
        onCreateTag={handleCreateTag}
      />

      {/* 删除确认弹窗 */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        noteTitle={deletingNote?.title || ''}
      />

      {/* 清空确认弹窗 */}
      <ClearAllConfirmModal
        isOpen={showClearAllModal}
        onClose={handleCancelClearAll}
        onConfirm={handleConfirmClearAll}
        notesCount={savedNotes.length}
      />

      {/* 数据管理弹窗 */}
      <DataManagementModal
        isOpen={showDataManagement}
        onClose={() => setShowDataManagement(false)}
        onExport={handleExportData}
        onImport={handleImportData}
        notesCount={savedNotes.length}
      />
    </div>
  );
} 