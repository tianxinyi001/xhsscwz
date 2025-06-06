import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const startTime = Date.now();
    
    // 检查数据目录
    const dataDir = path.join(process.cwd(), 'data');
    const dataExists = fs.existsSync(dataDir);
    
    // 检查关键文件
    const usersFile = path.join(dataDir, 'users.json');
    const notesFile = path.join(dataDir, 'notes.json');
    
    const usersExists = fs.existsSync(usersFile);
    const notesExists = fs.existsSync(notesFile);
    
    // 读取文件大小
    let usersSize = 0;
    let notesSize = 0;
    let usersCount = 0;
    let notesCount = 0;
    
    if (usersExists) {
      const usersStats = fs.statSync(usersFile);
      usersSize = usersStats.size;
      try {
        const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
        usersCount = users.length;
      } catch (e) {
        console.error('读取用户文件失败:', e);
      }
    }
    
    if (notesExists) {
      const notesStats = fs.statSync(notesFile);
      notesSize = notesStats.size;
      try {
        const notes = JSON.parse(fs.readFileSync(notesFile, 'utf-8'));
        notesCount = notes.length;
      } catch (e) {
        console.error('读取笔记文件失败:', e);
      }
    }
    
    const responseTime = Date.now() - startTime;
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      version: process.env.npm_package_version || '1.0.0',
      node: process.version,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      storage: {
        dataDirectory: dataExists,
        usersFile: {
          exists: usersExists,
          size: `${Math.round(usersSize / 1024)}KB`,
          count: usersCount
        },
        notesFile: {
          exists: notesExists,
          size: `${Math.round(notesSize / 1024)}KB`,
          count: notesCount
        }
      }
    };
    
    return NextResponse.json(health);
    
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 