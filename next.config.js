/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // 在构建时忽略 TypeScript 错误
    ignoreBuildErrors: false,
  },
  eslint: {
    // 在构建时忽略 ESLint 错误
    ignoreDuringBuilds: false,
  },
  // 优化图片处理
  images: {
    domains: ['supabase.co', 'xhscdn.com', 'xiaohongshu.com'],
    unoptimized: true
  },
  // 环境变量
  env: {
    CUSTOM_KEY: 'my-value',
  },
}

module.exports = nextConfig 