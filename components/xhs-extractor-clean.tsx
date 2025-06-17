'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StorageManager } from '@/lib/storage';
import { StoredNote } from '@/lib/types';
import { generateId, isValidXHSUrl, extractXHSUrl } from '@/lib/utils';
import { CozeClient } from '@/lib/coze-client';
import { deleteSupabaseImage } from '@/lib/supabase';
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
  filename?: string;
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

// 删除确认弹窗
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
          <div className="mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">确认删除</h3>
            <p className="text-sm text-gray-600">
              确定要删除笔记 <br />
              <span className="font-medium text-gray-900">"{noteTitle}"</span> 吗？
            </p>
            <p className="text-xs text-gray-500 mt-2">
              此操作将同时删除云端存储的封面图片，且无法撤销
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} className="flex-1">
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={onConfirm} 
              className="flex-1"
            >
              删除
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function XHSExtractor() {
  const [url, setUrl] = useState('');
  const [savedNotes, setSavedNotes] = useState<SimpleNote[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [currentNote, setCurrentNote] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTagSelection, setShowTagSelection] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingNote, setDeletingNote] = useState<SimpleNote | null>(null);
  const [isRefreshingCovers, setIsRefreshingCovers] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState({ current: 0, total: 0 });

  // 加载保存的笔记
  useEffect(() => {
    const notes = StorageManager.getAllNotes();
    const simpleNotes: SimpleNote[] = notes.map(note => ({
      id: note.id,
      title: note.title,
      cover: getImageUrl(note),
      url: note.url || '',
      tags: note.tags,
      extractedAt: note.extractedAt,
      filename: note.filename
    }));
    setSavedNotes(simpleNotes);
    
    // 修复 Set 迭代问题
    const tagsSet = new Set(notes.flatMap(note => note.tags));
    const tags = Array.from(tagsSet);
    setAllTags(tags);
  }, []);

  // 获取图片URL
  const getImageUrl = (note: StoredNote): string => {
    if (note.permanentImages && note.permanentImages.length > 0) {
      return note.permanentImages[0];
    }
    if (note.localImages && note.localImages.length > 0) {
      return note.localImages[0];
    }
    if (note.cachedImages && note.cachedImages.length > 0) {
      return note.cachedImages[0];
    }
    if (note.images && note.images.length > 0) {
      return getProxyImageUrl(note.images[0]);
    }
    return '无封面';
  };

  const getProxyImageUrl = (originalUrl: string): string => {
    if (!originalUrl || originalUrl === '无封面') return '无封面';
    if (originalUrl.includes('/api/image-proxy')) return originalUrl;
    if (originalUrl.startsWith('data:') || originalUrl.includes('supabase')) {
      return originalUrl;
    }
    return `/api/image-proxy?url=${encodeURIComponent(originalUrl)}`;
  };

  // 播放通知音效
  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2W2e/NewcKI4PQ8+FxLggWdLzm7qBMFAhCptlxgCEGPZDV7tGDLAQZdMrg26tfEAd+0ODb2VcKAq7vOzKrzmdAAQMeAPcFBwkeBY1kAFYHBA');
      audio.volume = 0.3;
      audio.play();
    } catch (error) {
      console.log('音效播放失败:', error);
    }
  };

  // 提取笔记
  const handleExtract = async () => {
    if (!url.trim()) {
      setError('请输入小红书链接');
      return;
    }

    if (!isValidXHSUrl(url)) {
      setError('请输入有效的小红书链接');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingStage('正在连接智能提取服务...');

    try {
      const extractedUrl = extractXHSUrl(url);
      
      setLoadingStage('正在分析链接内容...');
      
      // 首先尝试使用 Coze API
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: extractedUrl,
          quickPreview: false 
        }),
      });

      console.log('API 响应状态:', response.status);
      const result = await response.json();
      console.log('API 响应数据:', result);
      
      setLoadingStage('正在解析提取结果...');
      
      // 检查是否成功或者是降级响应
      if (result.success || result.fallback) {
        const noteData = result.data;
        
        if (noteData && noteData.title && noteData.title !== '未提取到标题') {
          setCurrentNote({
            ...noteData,
            url: extractedUrl,
            extractedAt: new Date().toISOString()
          });
          setShowTagSelection(true);
        } else if (result.fallback) {
          // 降级模式：让用户手动输入信息
          const fallbackNote = {
            title: `来自小红书的笔记 - ${new Date().toLocaleDateString()}`,
            content: '智能提取暂时不可用，您可以手动添加标签进行收藏',
            cover: '无封面',
            author: '未知作者',
            images: [],
            url: extractedUrl,
            extractedAt: new Date().toISOString(),
            fallback: true
          };
          
          setCurrentNote(fallbackNote);
          setError('⚠️ 智能提取暂时不可用，但您仍可以收藏此链接');
          setShowTagSelection(true);
        } else {
          throw new Error(result.error || '未能成功提取笔记信息');
        }
      } else {
        throw new Error(result.error || result.details || '提取失败');
      }
    } catch (error) {
      console.error('提取失败:', error);
      
      // 检查是否是网络错误
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('网络连接失败，请检查网络后重试');
      } else if (error instanceof Error && error.message.includes('500')) {
        setError('服务器暂时不可用，请稍后重试');
      } else {
        setError(error instanceof Error ? error.message : '提取失败，请稍后重试');
      }
    } finally {
      setIsLoading(false);
      setLoadingStage('');
    }
  };

  // 确认保存
  const handleConfirmSave = async (selectedTags: string[]) => {
    if (!currentNote) return;

    setLoadingStage('正在保存到永久存储...');
    
    try {
      const noteId = generateId();
      
      let permanentImageUrl = null;
      let filename = null;
      
      if (currentNote.cover && currentNote.cover !== '无封面') {
        try {
          let imageUrlToSave = currentNote.cover;
          
          if (imageUrlToSave.includes('/api/image-proxy?url=')) {
            const urlParam = new URL(imageUrlToSave, window.location.origin).searchParams.get('url');
            if (urlParam) {
              imageUrlToSave = decodeURIComponent(urlParam);
            }
          }
          
          const response = await fetch('/api/permanent-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: imageUrlToSave,
              noteId: noteId
            })
          });
          
          const result = await response.json();
          
          if (result.success) {
            permanentImageUrl = result.imageUrl;
            filename = result.filename;
            console.log('✅ 封面保存到永久存储成功:', permanentImageUrl);
          }
        } catch (error) {
          console.error('保存到永久存储失败:', error);
        }
      }

      const noteToSave: StoredNote = {
        id: noteId,
        title: currentNote.title,
        content: currentNote.content || '',
        author: { name: currentNote.author || '未知作者' },
        images: currentNote.images || [currentNote.cover],
        originalImages: currentNote.images || [currentNote.cover],
        permanentImages: permanentImageUrl ? [permanentImageUrl] : undefined,
        filename: filename || undefined,
        tags: selectedTags,
        url: currentNote.url,
        createTime: currentNote.createTime || new Date().toISOString(),
        extractedAt: new Date().toISOString()
      };

      StorageManager.saveNote(noteToSave);

      const notes = StorageManager.getAllNotes();
      const simpleNotes: SimpleNote[] = notes.map(note => ({
        id: note.id,
        title: note.title,
        cover: getImageUrl(note),
        url: note.url || '',
        tags: note.tags,
        extractedAt: note.extractedAt,
        filename: note.filename
      }));
      setSavedNotes(simpleNotes);
      
      // 修复 Set 迭代问题
      const uniqueTagsSet = new Set([...allTags, ...selectedTags]);
      const uniqueTags = Array.from(uniqueTagsSet);
      setAllTags(uniqueTags);

      setCurrentNote(null);
      setUrl('');
      setShowTagSelection(false);
      playNotificationSound();
      
    } catch (error) {
      console.error('保存笔记失败:', error);
      setError('保存笔记失败，请稍后重试');
    } finally {
      setIsLoading(false);
      setLoadingStage('');
    }
  };

  // 删除笔记
  const handleShowDeleteConfirm = (note: SimpleNote) => {
    setDeletingNote(note);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingNote) return;

    try {
      const fullNote = StorageManager.getNoteById(deletingNote.id);
      
      if (fullNote?.filename) {
        console.log('正在删除 Supabase 图片:', fullNote.filename);
        await deleteSupabaseImage(fullNote.filename);
      }

      StorageManager.deleteNote(deletingNote.id);
      
      const notes = StorageManager.getAllNotes();
      const simpleNotes: SimpleNote[] = notes.map(note => ({
        id: note.id,
        title: note.title,
        cover: getImageUrl(note),
        url: note.url || '',
        tags: note.tags,
        extractedAt: note.extractedAt,
        filename: note.filename
      }));
      setSavedNotes(simpleNotes);
      
      // 修复 Set 迭代问题
      const tagsSet = new Set(notes.flatMap(note => note.tags));
      const tags = Array.from(tagsSet);
      setAllTags(tags);
      
    } catch (error) {
      console.error('删除笔记失败:', error);
      setError('删除笔记失败，请稍后重试');
    } finally {
      setShowDeleteConfirm(false);
      setDeletingNote(null);
    }
  };

  // 创建新标签
  const handleCreateTag = (tag: string) => {
    if (!allTags.includes(tag)) {
      setAllTags([...allTags, tag]);
    }
  };

  // 刷新封面
  const refreshSingleCover = async (noteId: string) => {
    const note = savedNotes.find(n => n.id === noteId);
    if (!note || !note.url) return;

    try {
      setIsRefreshingCovers(true);
      const cozeClient = new CozeClient();
      const response = await cozeClient.extractXHSInfo(note.url, true);
      const noteData = cozeClient.parseXHSResponse(response);
      
      if (noteData?.cover && noteData.cover !== '无封面') {
        const fullNote = StorageManager.getNoteById(noteId);
        if (fullNote) {
          fullNote.images = [noteData.cover];
          fullNote.originalImages = [noteData.cover];
          StorageManager.saveNote(fullNote);
          
          setSavedNotes(prev => prev.map(n => 
            n.id === noteId ? { ...n, cover: getProxyImageUrl(noteData.cover) } : n
          ));
        }
      }
    } catch (error) {
      console.error('刷新封面失败:', error);
    } finally {
      setIsRefreshingCovers(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 加载进度条 */}
      {(isLoading || isRefreshingCovers) && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="bg-gradient-to-r from-red-400 to-pink-400 h-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/30" 
                 style={{ animation: 'loading-progress 2s ease-in-out infinite' }}>
            </div>
          </div>
          <div className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-center gap-3 text-sm text-gray-700">
                <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full"></div>
                <span className="font-medium">
                  {loadingStage || '正在处理...'}
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  savedNotes.forEach(note => {
                    if (!note.cover || note.cover === '无封面') {
                      refreshSingleCover(note.id);
                    }
                  });
                }}
                disabled={isRefreshingCovers}
                className="text-gray-500 hover:text-green-500"
                title="刷新缺失的封面"
              >
                📷 刷新封面
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* 添加笔记区域 */}
        <div className="mb-8">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="粘贴小红书链接..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-12 text-base"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    handleExtract();
                  }
                }}
              />
            </div>
            <Button 
              onClick={handleExtract}
              disabled={isLoading || !url.trim()}
              className="h-12 px-8 bg-red-500 hover:bg-red-600"
            >
              {isLoading ? '提取中...' : '智能提取'}
            </Button>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* 笔记网格 */}
        {savedNotes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {savedNotes.map((note) => (
              <div key={note.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                {/* 封面图片 */}
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  {note.cover && note.cover !== '无封面' ? (
                    <img
                      src={note.cover}
                      alt={note.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm">加载失败</div>';
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                      无封面
                    </div>
                  )}
                  
                  {/* 操作按钮 */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => refreshSingleCover(note.id)}
                      className="h-7 w-7 p-0 bg-white/80 hover:bg-white"
                      title="刷新封面"
                    >
                      📷
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShowDeleteConfirm(note)}
                      className="h-7 w-7 p-0 bg-white/80 hover:bg-white text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* 内容区域 */}
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 text-sm leading-tight mb-2 line-clamp-2">
                    {note.title}
                  </h3>
                  
                  {/* 标签 */}
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {note.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {note.tags.length > 3 && (
                        <span className="text-xs text-gray-400 px-2 py-1">
                          +{note.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* 操作区域 */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {new Date(note.extractedAt).toLocaleDateString()}
                    </span>
                    
                    {note.url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(note.url, '_blank')}
                        className="h-7 px-2 text-gray-500 hover:text-red-500"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-2xl">📝</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">还没有收藏的笔记</h3>
            <p className="text-gray-500 mb-6">粘贴小红书链接开始收藏你的第一篇笔记吧</p>
          </div>
        )}
      </div>

      {/* 弹窗组件 */}
      <TagSelectionModal
        isOpen={showTagSelection}
        onClose={() => setShowTagSelection(false)}
        onConfirm={handleConfirmSave}
        allTags={allTags}
        onCreateTag={handleCreateTag}
      />

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        noteTitle={deletingNote?.title || ''}
      />
    </div>
  );
} 