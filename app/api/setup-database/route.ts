import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 开始创建数据库表...');
    
    // 直接使用supabase客户端执行SQL
    // 1. 删除现有表（如果存在）
    console.log('🗑️ 删除现有表...');
    try {
      await supabase.rpc('exec_sql', {
        sql: 'DROP TABLE IF EXISTS notes CASCADE;'
      });
    } catch (error) {
      console.log('删除表操作:', error);
    }

    // 2. 创建新表 - 使用分步骤的方式
    console.log('📋 创建新表...');
    
    // 先检查表是否存在
    const { data: existingTables } = await supabase.rpc('exec_sql', {
      sql: "SELECT table_name FROM information_schema.tables WHERE table_name = 'notes';"
    });
    
    console.log('现有表检查:', existingTables);

    // 创建表的SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT DEFAULT '',
        author_name TEXT DEFAULT '',
        images TEXT[] DEFAULT ARRAY[]::TEXT[],
        original_images TEXT[] DEFAULT NULL,
        local_images TEXT[] DEFAULT NULL,
        cached_images TEXT[] DEFAULT NULL,
        permanent_images TEXT[] DEFAULT NULL,
        filename TEXT DEFAULT NULL,
        tags TEXT[] DEFAULT ARRAY[]::TEXT[],
        url TEXT DEFAULT NULL,
        create_time TEXT NOT NULL,
        extracted_at TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const createResult = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });
    
    console.log('创建表结果:', createResult);
    
    if (createResult.error) {
      console.error('❌ 创建表失败:', createResult.error);
      // 如果rpc不可用，尝试直接使用Supabase管理API
      return NextResponse.json({ 
        success: false, 
        error: '创建表失败，请在Supabase控制台手动执行SQL: ' + createResult.error.message,
        sql: createTableSQL
      }, { status: 500 });
    }

    // 3. 测试表是否创建成功
    console.log('✅ 测试表访问...');
    const testResult = await supabase
      .from('notes')
      .select('id')
      .limit(1);
    
    console.log('表访问测试结果:', testResult);

    if (testResult.error) {
      return NextResponse.json({ 
        success: false, 
        error: '表创建后无法访问: ' + testResult.error.message,
        suggestion: '请在Supabase控制台SQL编辑器中手动执行以下SQL',
        sql: createTableSQL
      }, { status: 500 });
    }

    // 4. 验证表结构
    console.log('🔍 验证表结构...');
    const { data: columns } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'notes' 
        ORDER BY ordinal_position;
      `
    });
    
    console.log('📋 表结构:', columns);

    console.log('🎉 数据库表创建完成！');
    
    return NextResponse.json({ 
      success: true, 
      message: '数据库表创建成功',
      tableStructure: columns,
      testQuery: testResult.data
    });
    
  } catch (error) {
    console.error('❌ 创建数据库表异常:', error);
    
    // 返回手动创建的SQL
    const manualSQL = `
-- 请在Supabase控制台的SQL编辑器中执行以下SQL:

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  author_name TEXT DEFAULT '',
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  original_images TEXT[] DEFAULT NULL,
  local_images TEXT[] DEFAULT NULL,
  cached_images TEXT[] DEFAULT NULL,
  permanent_images TEXT[] DEFAULT NULL,
  filename TEXT DEFAULT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  url TEXT DEFAULT NULL,
  create_time TEXT NOT NULL,
  extracted_at TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title);

-- 创建触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notes_updated_at 
    BEFORE UPDATE ON notes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 启用RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON notes;
CREATE POLICY "Allow all operations" ON notes FOR ALL USING (true);
    `;
    
    return NextResponse.json({ 
      success: false, 
      error: '自动创建失败: ' + (error instanceof Error ? error.message : String(error)),
      manualSQL: manualSQL
    }, { status: 500 });
  }
} 