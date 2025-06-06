import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password } = body;
    
    console.log('注册请求:', { username, email, password: '***' });
    
    // 基本验证
    if (!username || !email || !password) {
      return NextResponse.json({
        success: false,
        error: '请填写所有必填字段'
      }, { status: 400 });
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json({
        success: false,
        error: '用户名长度应在3-20个字符之间'
      }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        error: '密码长度不能少于6位'
      }, { status: 400 });
    }

    // 临时简单的用户创建（测试用）
    const testUser = {
      id: Date.now(),
      username,
      email,
      createdAt: new Date().toISOString()
    };

    console.log('创建测试用户:', testUser);

    // 设置简单的认证token
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
    console.error('注册API错误:', error);
    return NextResponse.json({
      success: false,
      error: '服务器错误: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
} 