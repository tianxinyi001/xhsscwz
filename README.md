# 小红书笔记收藏工具

一个基于 Next.js 的小红书笔记收藏管理工具，支持快速提取小红书链接的标题、封面，并进行标签分类管理。

## 功能特性

- 🔗 **智能链接解析**: 支持各种格式的小红书链接
- 🏷️ **标签管理**: 自定义标签分类，支持筛选
- 📱 **响应式设计**: 完美适配桌面和移动设备
- 💾 **本地存储**: 数据保存在浏览器本地
- 🔊 **音效提示**: 收藏成功时播放提示音
- ✏️ **标签编辑**: 支持对已收藏笔记进行标签修改

## 技术栈

- **前端框架**: Next.js 14
- **UI 组件**: Shadcn UI + Radix UI
- **样式方案**: Tailwind CSS
- **开发语言**: TypeScript
- **图标库**: Lucide React

## 开发

首先安装依赖：

```bash
npm install
```

然后运行开发服务器：

```bash
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看结果。

## 部署

本项目可以轻松部署到 Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/xhs-extractor)

## 使用方法

1. 粘贴小红书链接到输入框
2. 点击"收藏笔记"按钮
3. 选择或创建标签
4. 确认收藏
5. 使用标签筛选查看收藏的笔记

## 环境变量

请在项目根目录创建 `.env.local` 文件并配置：

```
# Coze API 配置
COZE_API_KEY=your_coze_api_key
COZE_BOT_ID=your_coze_bot_id
``` 