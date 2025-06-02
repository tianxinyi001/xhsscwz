'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TestResult {
  success: boolean;
  status?: number;
  statusText?: string;
  data?: any;
  error?: string;
}

export default function TestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const testCozeAPI = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      console.log('开始测试 API 连接...');

      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: 'https://www.xiaohongshu.com/discovery/item/674885ce000000000703671b' }),
      });

      const apiResult = await response.json();
      
      setResult({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: apiResult
      });
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Coze API 配置测试</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p><strong>API URL:</strong> https://api.coze.cn/v3/chat</p>
            <p><strong>Bot ID:</strong> 7511177632999342117</p>
            <p><strong>API Key:</strong> pat_9UE...（已隐藏）</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">✅ 已解决的问题：</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-green-600">
              <li>✅ Bot ID 错误问题已修复（从 workflow_id 更新为正确的 bot_id）</li>
              <li>✅ 异步对话处理已完善（添加了轮询机制获取最终结果）</li>
              <li>✅ API v3 兼容性问题已解决</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">🔄 新的处理流程：</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>1. 发送小红书链接到 Coze Bot</li>
              <li>2. 创建对话（状态：in_progress）</li>
              <li>3. 轮询等待对话完成（最多60秒）</li>
              <li>4. 获取AI的回复内容</li>
              <li>5. 解析并显示提取的信息</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">📝 支持的输入格式：</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>完整链接：https://www.xiaohongshu.com/discovery/item/xxx</li>
              <li>分享链接：https://www.xiaohongshu.com/explore/xxx?xsec_token=xxx</li>
              <li>分享码或笔记ID（智能体会自动清洗识别）</li>
              <li>任何包含小红书相关信息的文本</li>
            </ul>
          </div>

          <Button 
            onClick={testCozeAPI} 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? '测试中...' : '测试 API 连接'}
          </Button>

          {isLoading && (
            <div className="text-center text-sm text-muted-foreground">
              <p>正在测试 API 连接，可能需要等待AI处理...</p>
              <p>（如果是第一次调用，可能需要较长时间）</p>
            </div>
          )}

          {result && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className={result.success ? 'text-green-600' : 'text-red-600'}>
                  测试结果 {result.success ? '✅' : '❌'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>状态:</strong> {result.status} {result.statusText}</p>
                  {result.error && <p className="text-red-600"><strong>错误:</strong> {result.error}</p>}
                  {result.data && (
                    <div>
                      <p><strong>响应数据:</strong></p>
                      <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 