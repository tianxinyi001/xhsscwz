'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StorageManager } from '@/lib/storage';
import { StoredNote } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Star, ArrowLeft } from 'lucide-react';

function getProxyImageUrl(originalUrl: string): string {
  if (!originalUrl) return '';
  if (originalUrl.startsWith('/api/image-proxy')) return originalUrl;

  let processedUrl = originalUrl;
  if (processedUrl.startsWith('http://')) {
    processedUrl = processedUrl.replace('http://', 'https://');
  }

  if (processedUrl.includes('xhscdn.com')) {
    return `/api/image-proxy?url=${encodeURIComponent(processedUrl)}`;
  }

  return processedUrl;
}

function splitWithHashtags(text: string): string[] {
  const hashPattern = /(#.+?#)/g;
  if (hashPattern.test(text)) {
    return text.split(hashPattern).filter((part) => part.length > 0);
  }
  return text.split(/(#[^\s#]+)/g).filter((part) => part.length > 0);
}

function renderTextWithHashtags(text: string) {
  return splitWithHashtags(text).map((part, index) => {
    const cleanedPart = part.replace(/\[话题\]/g, '');
    const isHash = /^#.+#?$/.test(cleanedPart);
    if (isHash) {
      return (
        <span key={`${part}-${index}`} className="text-blue-500">
          {cleanedPart}
        </span>
      );
    }
    return <Fragment key={`${part}-${index}`}>{cleanedPart}</Fragment>;
  });
}

export default function NoteDetail({ noteId }: { noteId: string }) {
  const router = useRouter();
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [note, setNote] = useState<StoredNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadNote = async () => {
      try {
        setLoading(true);
        const fetched = await StorageManager.getNoteById(noteId);
        setNote(fetched);
        setDraftTitle(fetched?.title || '');
        setDraftContent(fetched?.content || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    };

    loadNote();
  }, [noteId]);

  const paragraphs = useMemo(() => {
    if (!note?.content) return [];
    return note.content.split(/\n+/).map((item) => item.trim()).filter(Boolean);
  }, [note?.content]);

  const images = useMemo(() => {
    const primary = note?.images || [];
    const fallback = note?.originalImages || [];
    const merged = primary.length > 1 ? primary : fallback.length > 0 ? fallback : primary;
    return merged.map(getProxyImageUrl);
  }, [note?.images, note?.originalImages]);

  const handleRate = async (rating: number) => {
    if (!note) return;
    const updated = { ...note, rating };
    setNote(updated);
    try {
      await StorageManager.saveNote(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新星标失败');
    }
  };

  const handleSave = async () => {
    if (!note) return;
    try {
      setSaving(true);
      const updated: StoredNote = {
        ...note,
        title: draftTitle.trim() || note.title,
        content: draftContent
      };
      await StorageManager.saveNote(updated);
      setNote(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraftTitle(note?.title || '');
    setDraftContent(note?.content || '');
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500">
        加载中...
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500">
        未找到笔记
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-gray-600">
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.alert('AI 改写功能开发中')}
            >
              AI 改写
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.alert('发布功能开发中')}>
              发布
            </Button>
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? '保存中...' : '保存'}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  取消
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => setIsEditing(true)}>
                编辑
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        {images.length > 0 && (
          <div className="rounded-2xl bg-white shadow-sm p-4">
            <div className="mx-auto max-w-2xl">
              <div className="relative">
                <div
                  ref={carouselRef}
                  className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth gap-3"
                >
                  {images.map((imageUrl, index) => (
                    <div
                      key={`${imageUrl}-${index}`}
                      className="snap-center shrink-0 w-full"
                    >
                      <div className="rounded-2xl overflow-hidden bg-gray-50 aspect-[3/4]">
                        <img
                          src={imageUrl}
                          alt={`图片-${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => carouselRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 text-gray-600 rounded-full w-8 h-8 flex items-center justify-center shadow-sm"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={() => carouselRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 text-gray-600 rounded-full w-8 h-8 flex items-center justify-center shadow-sm"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
              <div className="mt-3 flex items-center justify-center gap-1 text-xs text-gray-400">
                {images.map((_, index) => (
                  <span key={index} className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 bg-white rounded-2xl p-5 shadow-sm">
          {isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>笔记标题</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.alert('AI 改写功能开发中')}
                >
                  AI 改写
                </Button>
              </div>
              <input
                className="w-full text-lg font-semibold text-gray-900 border-b border-gray-200 focus:outline-none focus:border-red-300 pb-2"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="标题"
              />
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>笔记正文</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.alert('AI 改写功能开发中')}
                >
                  AI 改写
                </Button>
              </div>
              <textarea
                className="w-full min-h-[200px] text-sm text-gray-800 border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300"
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                placeholder="输入正文内容（支持 Emoji）"
              />
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-gray-900 mb-3">{note.title}</h1>
              <div className="space-y-3 text-sm text-gray-800 leading-relaxed">
                {paragraphs.length > 0 ? (
                  paragraphs.map((para, index) => (
                    <p key={index}>{renderTextWithHashtags(para)}</p>
                  ))
                ) : (
                  <p className="text-gray-400">暂无正文内容</p>
                )}
              </div>
            </>
          )}

          <div className="mt-4 flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleRate(value)}
                className="p-0.5"
                title={`星标评级：${value}`}
              >
                <Star
                  className={`h-4 w-4 ${
                    (note.rating ?? 0) >= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="mt-4 text-xs text-gray-400">
            收集时间：{formatDate(note.extractedAt)}
          </div>

          {note.url && (
            <div className="mt-2 text-xs text-gray-400">
              原文链接：{' '}
              <a
                className="text-red-500 hover:text-red-600"
                href={note.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                打开原文
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
