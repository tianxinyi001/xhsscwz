import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🔍 测试数据库连接...');
    
    // 1. 测试基本连接
    const { data: connectionTest, error: connectionError } = await supabase
      .from('notes')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ 数据库连接失败:', connectionError);
      return NextResponse.json({
        success: false,
        error: connectionError.message,
        step: 'connection_test',
        suggestion: '请检查Supabase配置或确保数据库表已创建'
      }, { status: 500 });
    }

    // 2. 测试表结构
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'notes' 
          ORDER BY ordinal_position;
        `
      });

    // 3. 测试插入和删除
    const testId = 'test-' + Date.now();
    const { data: insertResult, error: insertError } = await supabase
      .from('notes')
      .insert([{
        id: testId,
        title: '数据库测试',
        content: '这是一个测试笔记',
        author_name: '测试用户',
        images: ['https://example.com/test.jpg'],
        tags: ['测试'],
        url: 'https://example.com/test',
        create_time: new Date().toISOString(),
        extracted_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (insertError) {
      console.error('❌ 插入测试失败:', insertError);
      return NextResponse.json({
        success: false,
        error: insertError.message,
        step: 'insert_test',
        tableInfo: tableInfo?.data || null
      }, { status: 500 });
    }

    // 4. 删除测试数据
    const { error: deleteError } = await supabase
      .from('notes')
      .delete()
      .eq('id', testId);

    if (deleteError) {
      console.warn('⚠️ 删除测试数据失败:', deleteError);
    }

    console.log('✅ 数据库测试成功！');
    
    return NextResponse.json({
      success: true,
      message: '数据库连接和操作测试成功',
      tableInfo: tableInfo?.data || null,
      testResult: {
        connection: '✅ 连接成功',
        insert: '✅ 插入成功',
        delete: deleteError ? '⚠️ 删除失败' : '✅ 删除成功'
      }
    });

  } catch (error) {
    console.error('❌ 数据库测试异常:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      step: 'exception'
    }, { status: 500 });
  }
} 