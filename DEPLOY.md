# 红书对标库 - 部署指南

## 完整代码结构

确保您的项目包含以下所有文件：

### 1. 根目录文件
- `package.json` - 依赖配置
- `next.config.js` - Next.js 配置
- `tailwind.config.ts` - Tailwind CSS 配置
- `tsconfig.json` - TypeScript 配置
- `postcss.config.js` - PostCSS 配置
- `README.md` - 项目说明

### 2. App 目录 (`app/`)
```
app/
├── api/
│   └── permanent-images/
│       └── route.ts          # 图片存储API
├── globals.css               # 全局样式
├── layout.tsx               # 根布局
└── page.tsx                 # 首页
```

### 3. 组件目录 (`components/`)
```
components/
├── ui/
│   ├── button.tsx           # 按钮组件
│   ├── input.tsx            # 输入框组件
│   └── card.tsx             # 卡片组件
└── xhs-extractor-clean.tsx  # 主要功能组件
```

### 4. 工具库 (`lib/`)
```
lib/
├── coze-client.ts           # AI API客户端
├── image-cache.ts           # 图片缓存管理
├── storage.ts               # 本地存储管理
├── supabase.ts              # Supabase客户端
├── types.ts                 # 类型定义
└── utils.ts                 # 工具函数
```

## 环境变量配置

创建 `.env.local` 文件：

```env
# Coze API 配置（必需）
NEXT_PUBLIC_COZE_API_URL=https://api.coze.cn/v3/chat
NEXT_PUBLIC_COZE_BOT_ID=你的Bot ID
COZE_API_KEY=你的API密钥

# Supabase 配置（在代码中已硬编码，可选）
NEXT_PUBLIC_SUPABASE_URL=https://gfwbgnzzvhsmmpwuytjr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 本地开发

1. **安装依赖**
```bash
npm install
```

2. **启动开发服务器**
```bash
npm run dev
```

3. **打开浏览器**
访问 http://localhost:3000

## Vercel 部署

### 1. 准备工作
- 确保代码已推送到 GitHub
- 确保所有文件都已正确创建
- 确保 Supabase 存储桶已配置

### 2. 部署步骤
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 从 GitHub 导入你的仓库
4. 配置环境变量：
   - `COZE_API_KEY`
   - `NEXT_PUBLIC_COZE_BOT_ID`
   - （可选）Supabase 相关变量
5. 点击 "Deploy"

### 3. 环境变量设置
在 Vercel 项目设置中添加：
```
COZE_API_KEY=你的Coze API密钥
NEXT_PUBLIC_COZE_BOT_ID=你的Bot ID
```

## Supabase 存储配置

### 1. 创建存储桶
```sql
-- 在 Supabase SQL 编辑器中执行
INSERT INTO storage.buckets (id, name, public) 
VALUES ('covers', 'covers', true);
```

### 2. 设置 RLS 策略
```sql
-- 允许匿名用户上传和读取
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT TO anon WITH CHECK (bucket_id = 'covers');

CREATE POLICY "Allow public reads" ON storage.objects
FOR SELECT TO anon USING (bucket_id = 'covers');

CREATE POLICY "Allow public deletes" ON storage.objects
FOR DELETE TO anon USING (bucket_id = 'covers');
```

## 核心功能验证

部署后测试以下功能：

### 1. 智能提取
- 粘贴小红书链接
- 验证 AI 提取是否正常
- 检查封面图片加载

### 2. 图片存储
- 确认图片保存到 Supabase
- 验证永久链接可访问
- 测试删除同步

### 3. 标签管理
- 创建新标签
- 编辑现有标签
- 标签筛选功能

## 故障排除

### 1. API 错误
- 检查 Coze API 密钥
- 验证 Bot ID 正确性
- 查看浏览器开发者工具

### 2. 图片加载问题
- 检查 Supabase 配置
- 验证存储桶权限
- 查看网络请求状态

### 3. 部署失败
- 检查环境变量配置
- 查看 Vercel 构建日志
- 确认所有文件已提交

## 性能优化

### 1. 图片优化
- 使用 WebP 格式
- 启用延迟加载
- 压缩图片尺寸

### 2. 缓存策略
- 利用浏览器缓存
- Supabase CDN 加速
- API 响应缓存

### 3. 代码分割
- 动态导入组件
- 减少包体积
- 优化首屏加载

## 监控和维护

### 1. 错误监控
- 设置 Sentry 错误追踪
- 监控 API 调用成功率
- 关注用户反馈

### 2. 定期维护
- 更新依赖包
- 清理过期数据
- 优化数据库查询

### 3. 备份策略
- 定期导出用户数据
- 备份 Supabase 数据
- 代码版本管理

## 支持

如果遇到问题，请：
1. 查看项目 README
2. 检查 GitHub Issues
3. 提交新的 Issue 报告问题 