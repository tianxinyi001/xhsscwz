import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ error: '缺少图片URL参数' }, { status: 400 });
    }

    // 验证URL是否来自小红书CDN
    if (!imageUrl.includes('xhscdn.com')) {
      return NextResponse.json({ error: '无效的图片URL' }, { status: 400 });
    }

    // 确保使用HTTPS
    const httpsUrl = imageUrl.startsWith('http://') 
      ? imageUrl.replace('http://', 'https://') 
      : imageUrl;

    console.log('代理请求图片:', httpsUrl);

    // 请求图片
    const response = await fetch(httpsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.xiaohongshu.com/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      console.error('图片请求失败:', response.status, response.statusText);
      return NextResponse.json({ error: '图片加载失败' }, { status: response.status });
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    console.log('图片代理成功，大小:', imageBuffer.byteLength, '字节');

    // 返回图片数据
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('图片代理错误:', error);
    return NextResponse.json(
      { error: '图片代理失败' },
      { status: 500 }
    );
  }
} 