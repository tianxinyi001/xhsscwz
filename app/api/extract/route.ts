import { NextRequest, NextResponse } from 'next/server';
import { CozeClient } from '@/lib/coze-client';

export async function POST(request: NextRequest) {
  try {
    const { url, quickPreview } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: '请提供小红书链接' },
        { status: 400 }
      );
    }

    const cozeClient = new CozeClient();
    const response = await cozeClient.extractXHSInfo(url, quickPreview);
    const parsedData = cozeClient.parseXHSResponse(response);
    
    // 处理嵌套的output结构
    const dataSource = parsedData.output || parsedData;

    // 快速预览模式：只返回基本信息
    if (quickPreview) {
      // 优先从output中提取noteId
      const noteId = dataSource.noteId || parsedData.noteId;
      
      console.log('提取的数据:', {
        title: dataSource.title,
        noteId: noteId,
        hasOutput: !!parsedData.output,
        dataSource: dataSource
      });
      
      // 处理封面链接，确保使用HTTPS
      let coverUrl = dataSource.cover || 
                    (dataSource.imageList && dataSource.imageList[0]?.urlPre) ||
                    (dataSource.imageList && dataSource.imageList[0]?.urlDefault) ||
                    '无封面';
      
      // 将HTTP链接转换为HTTPS
      if (coverUrl && typeof coverUrl === 'string' && coverUrl.startsWith('http://')) {
        coverUrl = coverUrl.replace('http://', 'https://');
      }
      
      // 如果是小红书CDN链接，转换为代理URL
      if (coverUrl && coverUrl !== '无封面' && coverUrl.includes('xhscdn.com')) {
        coverUrl = `/api/image-proxy?url=${encodeURIComponent(coverUrl)}`;
      }
      
      const quickData = {
        title: dataSource.title || parsedData.title || '未提取到标题',
        cover: coverUrl,
        noteId: noteId,
        url: url
      };

      console.log('返回的快速数据:', quickData);

      return NextResponse.json({
        success: true,
        data: quickData,
        raw: response
      });
    }

    // 完整模式：返回所有信息（保持兼容性）
    const normalizedData = {
      title: dataSource.title || parsedData.title || '未提取到标题',
      author: dataSource.author || '未知作者',
      content: dataSource.content || dataSource.desc || '无内容',
      cover: (() => {
        let cover = dataSource.cover || (dataSource.imageList && dataSource.imageList[0]?.urlDefault);
        // 将HTTP链接转换为HTTPS
        if (cover && typeof cover === 'string' && cover.startsWith('http://')) {
          cover = cover.replace('http://', 'https://');
        }
        // 如果是小红书CDN链接，转换为代理URL
        if (cover && cover.includes('xhscdn.com')) {
          cover = `/api/image-proxy?url=${encodeURIComponent(cover)}`;
        }
        return cover;
      })(),
      images: (() => {
        const images = dataSource.images || (dataSource.imageList?.map((img: any) => img.urlDefault || img.url) || []);
        // 将所有图片链接转换为HTTPS并使用代理
        return images.map((img: string) => {
          if (img && typeof img === 'string') {
            if (img.startsWith('http://')) {
              img = img.replace('http://', 'https://');
            }
            if (img.includes('xhscdn.com')) {
              img = `/api/image-proxy?url=${encodeURIComponent(img)}`;
            }
          }
          return img;
        });
      })(),
      tags: dataSource.tags || [],
      noteId: dataSource.noteId || parsedData.noteId,
      stats: {
        likes: dataSource.interactInfo?.likedCount || 0,
        comments: dataSource.interactInfo?.commentCount || 0,
        shares: dataSource.interactInfo?.shareCount || 0
      },
      publishTime: dataSource.time ? new Date(dataSource.time).toISOString() : null,
      url: url,
      ...parsedData // 保留原始数据
    };

    return NextResponse.json({
      success: true,
      data: normalizedData,
      raw: response
    });

  } catch (error) {
    console.error('API 错误:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '提取失败，请稍后重试',
        success: false 
      },
      { status: 500 }
    );
  }
} 