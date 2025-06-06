import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    console.log('登录请求:', { username, password: '***' });

    if (!username || !password) {
      return NextResponse.json({
        success: false,
        error: '请输入用户名和密码'
      }, { status: 400 });
    }

    // 临时测试用户验证
    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        error: '密码长度不能少于6位'
      }, { status: 400 });
    }

    // 创建测试用户
    const testUser = {
      id: Date.now(),
      username,
      email: username + '@test.com',
      createdAt: new Date().toISOString()
    };

    console.log('登录成功，用户:', testUser);

    // 设置cookie
    const response = NextResponse.json({
      success: true,
      user: testUser
    });

    response.cookies.set('auth-token', 'test-token-' + testUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (error) {
    console.error('登录API错误:', error);
    return NextResponse.json({
      success: false,
      error: '服务器错误: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
} 