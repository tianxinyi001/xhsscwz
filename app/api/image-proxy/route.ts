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

    // 重试机制
    let lastError;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`图片请求尝试 ${attempt}/${maxRetries}:`, httpsUrl);
        
        // 请求图片
        const response = await fetch(httpsUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.xiaohongshu.com/',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Accept-Encoding': 'gzip, deflate, br'
          },
          // 设置超时
          signal: AbortSignal.timeout(10000) // 10秒超时
        });

        if (!response.ok) {
          console.error(`图片请求失败 (尝试${attempt}):`, response.status, response.statusText);
          lastError = `HTTP ${response.status}: ${response.statusText}`;
          
          // 如果是4xx错误，不需要重试
          if (response.status >= 400 && response.status < 500) {
            break;
          }
          
          // 继续重试
          continue;
        }

        const imageBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        console.log(`图片代理成功 (尝试${attempt})，大小:`, imageBuffer.byteLength, '字节');

        // 返回图片数据，设置长期缓存
        return new NextResponse(imageBuffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable', // 1年缓存
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
            'X-Image-Proxy': 'success',
            'X-Retry-Count': attempt.toString()
          }
        });

      } catch (fetchError) {
        console.error(`图片请求异常 (尝试${attempt}):`, fetchError);
        lastError = fetchError instanceof Error ? fetchError.message : '网络请求失败';
        
        // 如果还有重试机会，等待一段时间再重试
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // 递增延迟
        }
      }
    }

    // 所有重试都失败了
    console.error('图片代理最终失败:', lastError);
    return NextResponse.json(
      { 
        error: '图片代理失败',
        details: lastError,
        url: httpsUrl
      },
      { status: 502 }
    );

  } catch (error) {
    console.error('图片代理错误:', error);
    return NextResponse.json(
      { 
        error: '图片代理失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
} 