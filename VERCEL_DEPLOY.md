# Vercel 部署指南

## 🚀 快速部署

### 1. 环境变量配置

在 Vercel 项目设置中添加以下环境变量：

```
COZE_API_KEY=你的Coze API密钥
NEXT_PUBLIC_COZE_BOT_ID=你的Bot ID
NEXT_PUBLIC_COZE_API_URL=https://api.coze.cn/v3/chat
```

### 2. 部署步骤

1. 将代码推送到 GitHub
2. 在 Vercel Dashboard 中导入项目
3. 配置环境变量
4. 点击 Deploy

### 3. 验证部署

- 构建应该成功完成
- 首页可以正常访问
- 智能提取功能正常工作

## 📋 检查清单

- [x] package.json 包含所有依赖
- [x] autoprefixer 已添加到 devDependencies
- [x] postcss.config.js 已配置
- [x] next.config.js 已优化
- [x] TypeScript 编译通过
- [x] 构建成功无错误

## 🔧 故障排除

### 构建失败
- 检查 Node.js 版本 (推荐 18.x)
- 确认所有依赖已安装
- 查看构建日志详细错误

### 字体加载问题
- 使用 next/font/google 导入字体
- 确保字体配置正确

### API 调用失败
- 检查环境变量配置
- 验证 API 密钥有效性

## 📊 当前项目状态

✅ **本地构建成功**  
✅ **TypeScript 无错误**  
✅ **依赖完整**  
✅ **准备部署**  

## 🔗 相关链接

- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Vercel 环境变量](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase 配置](https://supabase.com/docs) 