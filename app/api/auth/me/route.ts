import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    console.log('获取用户信息，token:', token);
    
    if (!token || !token.startsWith('test-token-')) {
      return NextResponse.json({
        success: false,
        error: '未登录'
      }, { status: 401 });
    }

    // 从token中解析用户ID
    const userId = token.replace('test-token-', '');
    
    const testUser = {
      id: parseInt(userId),
      username: 'testuser',
      email: 'testuser@test.com',
      createdAt: new Date().toISOString()
    };

    console.log('返回用户信息:', testUser);

    return NextResponse.json({
      success: true,
      user: testUser
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    return NextResponse.json({
      success: false,
      error: '服务器错误: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
} 