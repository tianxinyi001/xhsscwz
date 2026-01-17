'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StorageManager } from '@/lib/storage';
import { StoredNote } from '@/lib/types';
import { generateId, isValidXHSUrl, extractXHSUrl, formatDate } from '@/lib/utils';
import { ImageCacheManager } from '@/lib/image-cache';
import { Trash2, ExternalLink, Plus, Tag, X, Star } from 'lucide-react';
import Link from 'next/link';

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
  createTime: string;
  extractedAt: string;
  rating?: number;
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

export default function XHSExtractor() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(''); // 新增：加载阶段状态
  const [savedNotes, setSavedNotes] = useState<SimpleNote[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // 标签相关状态
  const [allTags, setAllTags] = useState<string[]>([]);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  
  // 弹窗状态
  const [showTagModal, setShowTagModal] = useState(false);
  const [pendingNoteData, setPendingNoteData] = useState<any>(null);
  
  // 标签编辑状态
  const [showTagEditModal, setShowTagEditModal] = useState(false);
  const [editingNote, setEditingNote] = useState<SimpleNote | null>(null);

  // 删除确认状态
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingNote, setDeletingNote] = useState<SimpleNote | null>(null);

  // 数据加载状态
  const [isLoadingData, setIsLoadingData] = useState(true);

  // 在客户端初始化时加载数据
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoadingData(true);
        setLoadingStage('正在加载数据...');
        
        // 步骤1: 检查并执行一次性的数据迁移（仅在首次使用时）
        await StorageManager.migrateFromLocalStorage();
        
        // 步骤2: 从数据库加载所有笔记（每次启动都需要）
        setLoadingStage('正在获取收藏笔记...');
        const notes = await StorageManager.getAllNotes();
        const simpleNotes = notes.map(note => ({
      id: note.id,
      title: note.title,
      cover: note.images[0] || '',
      url: note.url || '',
      tags: note.tags || [],
      createTime: note.createTime,
      extractedAt: note.extractedAt,
      rating: note.rating ?? 0
    }));
        
        setSavedNotes(simpleNotes);
        
        // 步骤3: 初始化标签系统
        setLoadingStage('正在加载标签...');
        const existingTags = Array.from(new Set(simpleNotes.flatMap(note => note.tags)));
    setAllTags(existingTags);
    
        setLoadingStage('加载完成');
        console.log('✅ 应用初始化完成，共加载', simpleNotes.length, '篇笔记');
        
    } catch (error) {
        console.error('❌ 应用初始化失败:', error);
        setError('数据加载失败，请刷新页面重试');
      } finally {
        setIsLoadingData(false);
        setLoadingStage('');
      }
    };
    
    initializeData();
  }, []);

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
      let permanentUrl: string | null = null;
      
      // 如果有封面图片，先保存到永久存储
      if (parsedData.cover && parsedData.cover !== '无封面') {
        setLoadingStage('正在保存封面图片...');
        let realImageUrl = parsedData.cover;
        if (realImageUrl.startsWith('/api/image-proxy')) {
          const urlParams = new URLSearchParams(realImageUrl.split('?')[1]);
          realImageUrl = urlParams.get('url') || realImageUrl;
        }
        permanentUrl = await downloadAndSaveImage(realImageUrl, noteId);
        if (permanentUrl) {
          console.log('✅ 封面已保存到永久存储:', permanentUrl);
        } else {
          console.warn('❌ 封面保存到永久存储失败');
        }
      }
      
      // 收藏时直接用永久封面
      const finalCoverUrl = permanentUrl ? permanentUrl : '';
      
      // 构造简化的笔记对象
      const collectedAt = new Date().toISOString();
      const simpleNote: SimpleNote = {
        id: noteId,
        title: parsedData.title || '未提取到标题',
        cover: finalCoverUrl,
        url: finalUrl, // 使用提取的正确URL
        tags: selectedTags,
        createTime: collectedAt,
        extractedAt: collectedAt,
        rating: 0
      };
      
      console.log('保存的笔记对象:', simpleNote);
      console.log('保存的笔记URL:', simpleNote.url);
      console.log('保存的笔记URL类型:', typeof simpleNote.url);

      // 保存到数据库
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
        extractedAt: simpleNote.extractedAt,
        rating: simpleNote.rating
      };

      await StorageManager.saveNote(fullNote);
      
      setLoadingStage('收藏成功！');
      
      // 收藏后直接从数据库重新加载所有笔记，避免重复
      const notes = await StorageManager.getAllNotes();
      const simpleNotes = notes.map(note => ({
        id: note.id,
        title: note.title,
        cover: note.images[0] || '',
        url: note.url || '',
        tags: note.tags || [],
        createTime: note.createTime,
        extractedAt: note.extractedAt,
        rating: note.rating ?? 0
      }));
      setSavedNotes(simpleNotes);
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

  const handleDeleteNote = async (id: string) => {
    try {
      await StorageManager.deleteNote(id);
    setSavedNotes(prev => prev.filter(note => note.id !== id));
    } catch (error) {
      console.error('删除笔记失败:', error);
      setError('删除笔记失败，请稍后重试');
    }
  };

  // 显示删除确认弹窗
  const handleShowDeleteConfirm = (note: SimpleNote) => {
    setDeletingNote(note);
    setShowDeleteModal(true);
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (deletingNote) {
      try {
        console.log('🗑️ 开始删除笔记和相关图片:', deletingNote.title);
        
        // 获取完整的笔记数据
        const existingNote = await StorageManager.getNoteById(deletingNote.id);
        
        if (existingNote) {
          // 收集所有需要删除的图片文件名
          const imagesToDelete: string[] = [];
          
          // 1. 从 filename 字段获取文件名
          if (existingNote.filename) {
            imagesToDelete.push(existingNote.filename);
            console.log('📎 添加filename图片:', existingNote.filename);
          }
          
          // 2. 从 permanentImages 中提取文件名
          if (existingNote.permanentImages && existingNote.permanentImages.length > 0) {
            existingNote.permanentImages.forEach(imageUrl => {
              // 从Supabase Storage URL中提取文件名
              // URL格式: https://gfwbgnzzvhsmmpwuytjr.supabase.co/storage/v1/object/public/covers/filename.jpg
              const urlParts = imageUrl.split('/');
              const filename = urlParts[urlParts.length - 1];
              if (filename && !imagesToDelete.includes(filename)) {
                imagesToDelete.push(filename);
                console.log('🖼️ 添加permanentImages图片:', filename);
              }
            });
          }
          
          // 3. 删除Supabase Storage中的所有图片
          if (imagesToDelete.length > 0) {
            console.log('🗑️ 准备删除图片文件:', imagesToDelete);
            
            for (const filename of imagesToDelete) {
              try {
                const deleteResponse = await fetch('/api/permanent-images', {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ filename }),
                });
                
                if (deleteResponse.ok) {
                  console.log('✅ 成功删除图片:', filename);
                } else {
                  const errorData = await deleteResponse.json();
                  console.warn('⚠️ 删除图片失败:', filename, errorData.error);
                }
              } catch (e) {
                console.warn('⚠️ 删除图片时出错:', filename, e);
              }
            }
          } else {
            console.log('ℹ️ 该笔记没有需要删除的Storage图片');
          }
        }
        
        // 4. 删除数据库中的笔记
        console.log('🗑️ 删除数据库笔记记录...');
        await StorageManager.deleteNote(deletingNote.id);
        
        // 5. 更新界面状态
      setSavedNotes(prev => prev.filter(note => note.id !== deletingNote.id));
      
        // 6. 播放删除音效
      playDeleteSound();
        
        console.log('✅ 笔记和图片删除完成:', deletingNote.title);
        
      } catch (error) {
        console.error('❌ 删除笔记失败:', error);
        setError('删除笔记失败，请稍后重试');
      }
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
  const handleSaveTagEdit = async (noteId: string, newTags: string[]) => {
    // 更新界面状态
    setSavedNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, tags: newTags }
        : note
    ));

    // 更新本地存储
    const existingNote = await StorageManager.getNoteById(noteId);
    if (existingNote) {
      const updatedNote = { ...existingNote, tags: newTags };
      await StorageManager.saveNote(updatedNote);
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

  const handleRateNote = async (noteId: string, rating: number) => {
    setSavedNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, rating }
        : note
    ));

    try {
      const existingNote = await StorageManager.getNoteById(noteId);
      if (existingNote) {
        const updatedNote = { ...existingNote, rating };
        await StorageManager.saveNote(updatedNote);
      }
    } catch (error) {
      console.error('更新星标评级失败:', error);
      setError('更新星标评级失败，请稍后重试');
    }
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

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    const timeA = new Date(a.createTime || a.extractedAt).getTime();
    const timeB = new Date(b.createTime || b.extractedAt).getTime();
    return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
  });

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
  const getImageUrl = async (note: SimpleNote): Promise<string> => {
    // 检查是否有永久存储的图片
    const existingNote = await StorageManager.getNoteById(note.id);
    
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
  const fixImageUrl = async (noteId: string, newImageUrl: string) => {
    // 更新localStorage中的数据
    const existingNote = await StorageManager.getNoteById(noteId);
    if (existingNote && existingNote.images[0] !== newImageUrl) {
      existingNote.images[0] = newImageUrl;
      await StorageManager.saveNote(existingNote);
      
      // 更新界面显示
      setSavedNotes(prev => prev.map(note => 
        note.id === noteId 
          ? { ...note, cover: newImageUrl }
          : note
      ));
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 全局加载进度条 */}
      {(isLoading) && (
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
            <Link href="/tags">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                title="标签管理"
              >
                <Tag className="h-4 w-4 mr-1" />
                标签管理
              </Button>
            </Link>
          </div>
        </div>

        {/* 标签导航栏 - 类似小红书主页 */}
        {allTags.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
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
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>创建日期</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-700 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300"
              >
                <option value="desc">新 → 旧</option>
                <option value="asc">旧 → 新</option>
              </select>
            </div>
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
            <div className="notes-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {sortedNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-[3/4]">
                    <img
                      src={note.cover}
                      alt={note.title}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => openNote(note.url)}
                      loading="lazy"
                    />
                    {/* 操作按钮浮层 */}
                    <div className="absolute top-0 right-0 p-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleShowDeleteConfirm(note)}
                        className="h-8 w-8 bg-black/40 hover:bg-black/60 text-white rounded-full"
                        title="删除笔记"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openNote(note.url)}
                        className="h-8 w-8 bg-black/40 hover:bg-black/60 text-white rounded-full"
                        title="打开原笔记"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {/* 标题和标签区域 */}
                  <div className="p-3">
                    <div className="text-gray-900 text-sm font-medium line-clamp-2 mb-2">
                      {note.title}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditTags(note)}
                        className="h-6 w-6 text-gray-400 hover:text-red-500 ml-0.5"
                        title="编辑标签"
                      >
                        <Tag className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="mt-2 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRateNote(note.id, value);
                          }}
                          className="p-0.5"
                          title={`星标评级：${value}`}
                        >
                          <Star
                            className={`h-4 w-4 ${
                              (note.rating ?? 0) >= value
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                      收集时间：{formatDate(note.extractedAt)}
                    </p>
                  </div>
                </div>
              ))}
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
    </div>
  );
} 
