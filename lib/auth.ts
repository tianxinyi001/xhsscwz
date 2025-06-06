import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { UserData } from './database';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'xhs-app-secret-key-change-in-production'
);

export interface User {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

// 密码加密
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// 密码验证
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// 生成JWT token
export async function generateToken(userId: number): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

// 验证JWT token
export async function verifyToken(token: string): Promise<{ userId: number } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { userId: payload.userId as number };
  } catch {
    return null;
  }
}

// 获取当前用户
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return null;
    }

    const user = UserData.findById(payload.userId);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt
    };
  } catch {
    return null;
  }
}

// 用户注册
export async function registerUser(username: string, email: string, password: string): Promise<AuthResult> {
  try {
    // 检查用户名和邮箱是否已存在
    if (UserData.existsByUsernameOrEmail(username, email)) {
      return { success: false, error: '用户名或邮箱已存在' };
    }

    // 密码长度验证
    if (password.length < 6) {
      return { success: false, error: '密码长度不能少于6位' };
    }

    const passwordHash = await hashPassword(password);
    
    const user = UserData.create({
      username,
      email,
      passwordHash
    });

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt
      }
    };
  } catch (error) {
    console.error('注册失败:', error);
    return { success: false, error: '注册失败，请稍后重试' };
  }
}

// 用户登录
export async function loginUser(username: string, password: string): Promise<AuthResult> {
  try {
    const user = UserData.findByUsername(username);

    if (!user) {
      return { success: false, error: '用户名或密码错误' };
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return { success: false, error: '用户名或密码错误' };
    }

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt
      }
    };
  } catch (error) {
    console.error('登录失败:', error);
    return { success: false, error: '登录失败，请稍后重试' };
  }
} 