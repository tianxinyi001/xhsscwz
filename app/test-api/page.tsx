'use client';

import { useState } from 'react';

export default function TestAPI() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAPI = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://www.xiaohongshu.com/discovery/item/64c8f2c5000000001203b8b9',
          quickPreview: true
        }),
      });

      const data = await response.json();
      setResult(data);
      
      if (!response.ok) {
        setError(`HTTP ${response.status}: ${data.error || '请求失败'}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">API 测试页面</h1>
      
      <button
        onClick={testAPI}
        disabled={loading}
        className="bg-blue-500 text-white px-6 py-2 rounded disabled:opacity-50"
      >
        {loading ? '测试中...' : '测试 Extract API'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 rounded">
          <h3 className="font-bold text-red-800">错误信息:</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-gray-100 border rounded">
          <h3 className="font-bold mb-2">API 响应:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-bold text-yellow-800 mb-2">环境变量检查:</h3>
        <p className="text-sm text-yellow-700">
          检查浏览器开发者工具的 Console 标签页查看服务器日志
        </p>
      </div>
    </div>
  );
} 