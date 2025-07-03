'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StorageManager } from '@/lib/storage';
import { StoredNote } from '@/lib/types';
import { 
  Tag, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Merge,
  Hash,
  FileText,
  AlertTriangle,
  X,
  Check,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface TagStats {
  name: string;
  count: number;
  notes: StoredNote[];
}

interface TagManagementProps {
  onTagsUpdated?: () => void;
}

function TagRenameModal({ 
  isOpen, 
  onClose, 
  tag, 
  onRename 
}: {
  isOpen: boolean;
  onClose: () => void;
  tag: string | null;
  onRename: (oldTag: string, newTag: string) => void;
}) {
  const [newTagName, setNewTagName] = useState('');

  useEffect(() => {
    if (isOpen && tag) {
      setNewTagName(tag);
    }
  }, [isOpen, tag]);

  const handleRename = () => {
    if (tag && newTagName.trim() && newTagName.trim() !== tag) {
      onRename(tag, newTagName.trim());
    }
    onClose();
  };

  if (!isOpen || !tag) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">重命名标签</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-2 block">原标签名</label>
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-800">
              {tag}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-2 block">新标签名</label>
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="输入新的标签名..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRename();
                }
              }}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            取消
          </Button>
          <Button 
            onClick={handleRename} 
            className="flex-1 bg-red-500 hover:bg-red-600"
            disabled={!newTagName.trim() || newTagName.trim() === tag}
          >
            重命名
          </Button>
        </div>
      </div>
    </div>
  );
}

function TagDeleteModal({ 
  isOpen, 
  onClose, 
  tag, 
  noteCount,
  onDelete 
}: {
  isOpen: boolean;
  onClose: () => void;
  tag: string | null;
  noteCount: number;
  onDelete: (tag: string) => void;
}) {
  const handleDelete = () => {
    if (tag) {
      onDelete(tag);
    }
    onClose();
  };

  if (!isOpen || !tag) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">删除标签</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">
                确定要删除标签 "{tag}" 吗？
              </p>
              <p className="text-xs text-red-600 mt-1">
                此操作将从 {noteCount} 篇笔记中移除该标签，且无法撤销。
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            取消
          </Button>
          <Button 
            onClick={handleDelete} 
            variant="destructive"
            className="flex-1"
          >
            删除标签
          </Button>
        </div>
      </div>
    </div>
  );
}

function TagMergeModal({ 
  isOpen, 
  onClose, 
  allTags, 
  sourceTag,
  onMerge 
}: {
  isOpen: boolean;
  onClose: () => void;
  allTags: TagStats[];
  sourceTag: string | null;
  onMerge: (sourceTag: string, targetTag: string) => void;
}) {
  const [targetTag, setTargetTag] = useState('');
  const [showCreateNew, setShowCreateNew] = useState(false);

  const availableTags = allTags.filter(tag => tag.name !== sourceTag);

  const handleMerge = () => {
    if (sourceTag && targetTag.trim()) {
      onMerge(sourceTag, targetTag.trim());
    }
    onClose();
  };

  const handleClose = () => {
    setTargetTag('');
    setShowCreateNew(false);
    onClose();
  };

  if (!isOpen || !sourceTag) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">合并标签</h3>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-2 block">源标签</label>
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-800">
              {sourceTag}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              此标签将被合并到目标标签中
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-600">目标标签</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateNew(!showCreateNew)}
                className="text-red-500 hover:text-red-600"
              >
                <Plus className="h-4 w-4 mr-1" />
                新建
              </Button>
            </div>

            {showCreateNew ? (
              <Input
                value={targetTag}
                onChange={(e) => setTargetTag(e.target.value)}
                placeholder="输入新标签名..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleMerge();
                  }
                }}
              />
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-2">选择现有标签：</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {availableTags.map((tag) => (
                    <button
                      key={tag.name}
                      onClick={() => setTargetTag(tag.name)}
                      className={`w-full text-left p-2 rounded-lg border text-sm transition-colors ${
                        targetTag === tag.name
                          ? 'bg-red-500 text-white border-red-500'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-red-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{tag.name}</span>
                        <span className="text-xs opacity-75">
                          {tag.count} 篇笔记
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button variant="ghost" onClick={handleClose} className="flex-1">
            取消
          </Button>
          <Button 
            onClick={handleMerge} 
            className="flex-1 bg-red-500 hover:bg-red-600"
            disabled={!targetTag.trim()}
          >
            合并标签
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function TagManagement({ onTagsUpdated }: TagManagementProps) {
  const [tagStats, setTagStats] = useState<TagStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 弹窗状态
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // 加载标签统计数据
  const loadTagStats = async () => {
    try {
      setLoading(true);
      const notes = await StorageManager.getAllNotes();
      
      // 统计每个标签的使用情况
      const tagMap = new Map<string, StoredNote[]>();
      
      notes.forEach(note => {
        note.tags.forEach(tag => {
          if (!tagMap.has(tag)) {
            tagMap.set(tag, []);
          }
          tagMap.get(tag)!.push(note);
        });
      });

      // 转换为统计数据并按使用频率排序
      const stats: TagStats[] = Array.from(tagMap.entries())
        .map(([name, notes]) => ({
          name,
          count: notes.length,
          notes
        }))
        .sort((a, b) => b.count - a.count);

      setTagStats(stats);
    } catch (error) {
      console.error('❌ 加载标签统计失败:', error);
      setError('加载标签数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTagStats();
  }, []);

  // 重命名标签
  const handleRenameTag = async (oldTag: string, newTag: string) => {
    try {
      const notes = await StorageManager.getAllNotes();
      
      // 更新所有包含该标签的笔记
      const updatePromises = notes
        .filter(note => note.tags.includes(oldTag))
        .map(async (note) => {
          const updatedTags = note.tags.map(tag => tag === oldTag ? newTag : tag);
          const updatedNote = { ...note, tags: updatedTags };
          await StorageManager.saveNote(updatedNote);
          return updatedNote;
        });

      await Promise.all(updatePromises);
      
      // 重新加载数据
      await loadTagStats();
      onTagsUpdated?.();
      
      console.log(`✅ 标签 "${oldTag}" 已重命名为 "${newTag}"`);
    } catch (error) {
      console.error('❌ 重命名标签失败:', error);
      setError('重命名标签失败');
    }
  };

  // 删除标签
  const handleDeleteTag = async (tagToDelete: string) => {
    try {
      const notes = await StorageManager.getAllNotes();
      
      // 从所有笔记中移除该标签
      const updatePromises = notes
        .filter(note => note.tags.includes(tagToDelete))
        .map(async (note) => {
          const updatedTags = note.tags.filter(tag => tag !== tagToDelete);
          const updatedNote = { ...note, tags: updatedTags };
          await StorageManager.saveNote(updatedNote);
          return updatedNote;
        });

      await Promise.all(updatePromises);
      
      // 重新加载数据
      await loadTagStats();
      onTagsUpdated?.();
      
      console.log(`✅ 标签 "${tagToDelete}" 已删除`);
    } catch (error) {
      console.error('❌ 删除标签失败:', error);
      setError('删除标签失败');
    }
  };

  // 合并标签
  const handleMergeTags = async (sourceTag: string, targetTag: string) => {
    try {
      const notes = await StorageManager.getAllNotes();
      
      // 更新所有包含源标签的笔记
      const updatePromises = notes
        .filter(note => note.tags.includes(sourceTag))
        .map(async (note) => {
          let updatedTags = [...note.tags];
          
          // 移除源标签
          updatedTags = updatedTags.filter(tag => tag !== sourceTag);
          
          // 添加目标标签（如果不存在）
          if (!updatedTags.includes(targetTag)) {
            updatedTags.push(targetTag);
          }
          
          const updatedNote = { ...note, tags: updatedTags };
          await StorageManager.saveNote(updatedNote);
          return updatedNote;
        });

      await Promise.all(updatePromises);
      
      // 重新加载数据
      await loadTagStats();
      onTagsUpdated?.();
      
      console.log(`✅ 标签 "${sourceTag}" 已合并到 "${targetTag}"`);
    } catch (error) {
      console.error('❌ 合并标签失败:', error);
      setError('合并标签失败');
    }
  };

  // 筛选标签
  const filteredTags = tagStats.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载标签数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 头部 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-red-600 hover:bg-red-50"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                返回主页
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mb-2">
          <Hash className="h-6 w-6 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-800">标签管理</h1>
        </div>
        <p className="text-gray-600">
          管理您的标签系统，包括重命名、删除和合并标签
        </p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-red-800">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-700 p-0 h-auto"
            >
              关闭
            </Button>
          </div>
        </div>
      )}

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Tag className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">总标签数</p>
              <p className="text-xl font-semibold text-gray-800">{tagStats.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">总笔记数</p>
              <p className="text-xl font-semibold text-gray-800">
                {tagStats.reduce((sum, tag) => sum + tag.notes.length, 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Hash className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">平均标签/笔记</p>
              <p className="text-xl font-semibold text-gray-800">
                {tagStats.length > 0 
                  ? (tagStats.reduce((sum, tag) => sum + tag.count, 0) / tagStats.length).toFixed(1)
                  : '0'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 标签列表 */}
      <div className="bg-white rounded-xl border">
        {filteredTags.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {searchQuery ? '未找到匹配的标签' : '暂无标签'}
            </h3>
            <p className="text-gray-500">
              {searchQuery ? '试试其他关键词' : '开始收藏笔记后，标签会自动出现在这里'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredTags.map((tag) => (
              <div key={tag.name} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Tag className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{tag.name}</h3>
                      <p className="text-sm text-gray-500">
                        {tag.count} 篇笔记使用了此标签
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTag(tag.name);
                        setShowRenameModal(true);
                      }}
                      className="text-gray-600 hover:text-blue-600"
                      title="重命名标签"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTag(tag.name);
                        setShowMergeModal(true);
                      }}
                      className="text-gray-600 hover:text-green-600"
                      title="合并标签"
                    >
                      <Merge className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTag(tag.name);
                        setShowDeleteModal(true);
                      }}
                      className="text-gray-600 hover:text-red-600"
                      title="删除标签"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 弹窗组件 */}
      <TagRenameModal
        isOpen={showRenameModal}
        onClose={() => setShowRenameModal(false)}
        tag={selectedTag}
        onRename={handleRenameTag}
      />

      <TagDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        tag={selectedTag}
        noteCount={tagStats.find(t => t.name === selectedTag)?.count || 0}
        onDelete={handleDeleteTag}
      />

      <TagMergeModal
        isOpen={showMergeModal}
        onClose={() => setShowMergeModal(false)}
        allTags={tagStats}
        sourceTag={selectedTag}
        onMerge={handleMergeTags}
      />
    </div>
  );
} 