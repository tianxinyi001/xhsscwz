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
      
      const quickData = {
        title: dataSource.title || parsedData.title || '未提取到标题',
        cover: dataSource.cover || 
               (dataSource.imageList && dataSource.imageList[0]?.urlPre) ||
               (dataSource.imageList && dataSource.imageList[0]?.urlDefault) ||
               '无封面',
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
      author: dataSource.user?.nickname || dataSource.author || '未知作者',
      content: dataSource.desc || dataSource.content || '无内容',
      cover: dataSource.cover || 
             (dataSource.imageList && dataSource.imageList[0]?.urlPre) ||
             (dataSource.imageList && dataSource.imageList[0]?.urlDefault) ||
             '无封面',
      images: dataSource.imageList?.map((img: any) => img.urlDefault || img.urlPre || img.url) || [],
      tags: dataSource.tagList?.map((tag: any) => tag.name) || [],
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