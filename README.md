# 红书对标库

一个智能的小红书笔记收藏和管理工具，帮助您发现爆款内容，收藏专属灵感。

## 功能特色

- 🤖 **智能提取**: 使用 AI 自动解析小红书链接，提取标题、封面等信息
- 🏷️ **标签管理**: 支持自定义标签分类，方便内容组织
- 💾 **永久存储**: 图片自动保存到 Supabase 云端，防止链接失效
- 📱 **响应式设计**: 完美适配手机、平板、桌面设备
- 🎨 **精美界面**: 仿小红书风格的现代化UI设计

## 技术栈

- **框架**: Next.js 14 + React 18
- **样式**: Tailwind CSS + Shadcn UI
- **数据存储**: LocalStorage + Supabase Storage
- **AI 服务**: Coze API
- **图标**: Lucide React
- **语言**: TypeScript

## 核心功能

### 智能提取
只需粘贴小红书链接，系统自动：
- 提取笔记标题和内容
- 获取封面图片
- 解析作者信息
- 识别相关标签

### 图片永久化
- 自动下载封面图片到 Supabase Storage
- 生成永久访问链接
- 删除笔记时同步删除云端图片

### 标签系统
- 支持创建自定义标签
- 智能标签推荐
- 标签筛选浏览

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

创建 `.env.local` 文件：

```env
# Coze API 配置
NEXT_PUBLIC_COZE_API_URL=https://api.coze.cn/v3/chat
NEXT_PUBLIC_COZE_BOT_ID=你的Bot ID
COZE_API_KEY=你的API密钥

# Supabase 配置（在代码中已配置）
NEXT_PUBLIC_SUPABASE_URL=https://gfwbgnzzvhsmmpwuytjr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的匿名密钥
```

### 3. 启动开发服务器

```bash
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
├── app/                    # Next.js 应用目录
│   ├── api/               # API 路由
│   │   └── permanent-images/ # 图片永久存储API
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx          # 首页
├── components/            # React 组件
│   ├── ui/               # 基础UI组件
│   └── xhs-extractor-clean.tsx # 主要功能组件
├── lib/                  # 工具库
│   ├── coze-client.ts    # AI API客户端
│   ├── image-cache.ts    # 图片缓存管理
│   ├── storage.ts        # 本地存储管理
│   ├── supabase.ts       # Supabase客户端
│   ├── types.ts          # 类型定义
│   └── utils.ts          # 工具函数
└── public/               # 静态资源
```

## 主要组件说明

### XHSExtractor
主要的功能组件，包含：
- 链接输入和提取逻辑
- 笔记展示网格
- 标签选择和管理
- 删除确认等交互

### 存储架构
1. **LocalStorage**: 存储笔记元数据和标签
2. **Supabase Storage**: 存储封面图片文件
3. **图片优先级**: 永久存储 > 本地缓存 > 代理URL

## API 接口

### POST /api/permanent-images
保存图片到 Supabase Storage

**请求参数**:
```json
{
  "imageUrl": "图片URL",
  "noteId": "笔记ID"
}
```

**响应格式**:
```json
{
  "success": true,
  "imageUrl": "永久访问URL",
  "filename": "文件名"
}
```

## 数据类型

### StoredNote
```typescript
interface StoredNote {
  id: string;
  title: string;
  content: string;
  author: { name: string };
  images: string[];
  originalImages?: string[];
  permanentImages?: string[];
  filename?: string;
  tags: string[];
  url?: string;
  createTime: string;
  extractedAt: string;
}
```

## 部署说明

### Vercel 部署
1. 推送代码到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 自动部署完成

### 环境变量
确保在生产环境中配置所有必要的环境变量：
- `COZE_API_KEY`
- `NEXT_PUBLIC_COZE_BOT_ID`
- Supabase 相关配置

## 开发指南

### 添加新功能
1. 在 `lib/` 中添加工具函数
2. 在 `components/` 中创建UI组件
3. 更新类型定义 `lib/types.ts`
4. 添加API路由（如需要）

### 样式规范
- 使用 Tailwind CSS 类名
- 遵循 mobile-first 响应式设计
- 保持小红书风格的红色主题

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！ 