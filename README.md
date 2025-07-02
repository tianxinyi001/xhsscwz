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

## 📋 环境配置

### 1. 获取 Coze API 配置

#### 🔑 获取 API Key
1. 访问 [Coze 官网](https://www.coze.cn) 或 [海外版](https://www.coze.com)
2. 注册并登录账号
3. 进入 **工作空间** > **API Keys**
4. 创建新的 API Key，复制保存

#### 🤖 获取 Bot ID
1. 在 Coze 平台创建您的 Bot
2. 配置 Bot 的功能和知识库
3. 从 Bot 页面的 URL 中获取 Bot ID
   ```
   例如：https://www.coze.cn/space/73428668341****/bot/7342866*****
   Bot ID 就是最后的数字部分：7342866*****
   ```

### 2. 配置环境变量

在项目根目录创建 `.env.local` 文件：

```bash
# ============= Coze API 基本配置 =============
# 必填：您的 Coze API Key
COZE_API_KEY=pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 必填：您的 Bot ID
NEXT_PUBLIC_COZE_BOT_ID=7342866xxxxx

# 可选：API 基础 URL（默认使用国内版）
# 国内版：https://api.coze.cn/v3/chat
# 海外版：https://api.coze.com/v3/chat
NEXT_PUBLIC_COZE_API_URL=https://api.coze.cn/v3/chat

# ============= 其他配置 =============
# 可选：应用基础 URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. 验证配置

配置完成后，可以通过以下方式验证：

1. **启动开发服务器**：
   ```bash
   npm run dev
   ```

2. **检查浏览器控制台**：
   - 应该看到 "Coze Client 初始化成功" 的日志
   - 如果有错误，会显示具体的配置问题

## 🚀 开发

首先安装依赖：

```bash
npm install
```

然后运行开发服务器：

```bash
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看结果。

## 📦 部署

### Vercel 部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/xhs-extractor)

部署时需要在 Vercel 控制台设置环境变量：
- `COZE_API_KEY`
- `NEXT_PUBLIC_COZE_BOT_ID`
- `NEXT_PUBLIC_COZE_API_URL`（可选）

### 其他平台

本项目可以部署到任何支持 Next.js 的平台，只需确保设置正确的环境变量。

## 📖 使用方法

1. 粘贴小红书链接到输入框
2. 点击"收藏笔记"按钮
3. 选择或创建标签
4. 确认收藏
5. 使用标签筛选查看收藏的笔记

## 🛠️ 常见问题

### Q: 提示 "Coze API 配置不完整" 错误
**A**: 请检查 `.env.local` 文件中的环境变量：
- 确保 `COZE_API_KEY` 已正确填入
- 确保 `NEXT_PUBLIC_COZE_BOT_ID` 已正确填入
- 重启开发服务器

### Q: API Key 无效或已过期
**A**: 
- 检查 API Key 是否正确复制（注意去除多余空格）
- 确认 API Key 未过期
- 在 Coze 平台重新生成 API Key

### Q: Bot ID 不存在
**A**:
- 确认 Bot 已发布到 API
- 检查 Bot ID 是否从正确的 URL 中提取
- 确认您有权限访问该 Bot

### Q: API 调用频率超限
**A**:
- 等待一段时间后重试
- 检查是否有重复请求
- 考虑升级 Coze 计划以获得更高限额

### Q: 图片无法正常显示
**A**:
- 项目内置了图片代理功能
- 如果仍有问题，检查网络连接
- 确认小红书链接有效

## 🔧 高级配置

### 多 Bot 配置

如果您有多个 Bot 用于不同场景，可以配置 Bot 切换：

```bash
# 在 .env.local 中添加
BOT_CONFIG={"default": "bot_id_1", "quick": "bot_id_2", "detailed": "bot_id_3"}
```

### API 性能调优

```bash
# 在 .env.local 中添加
API_TIMEOUT=30000
POLL_INTERVAL=2000
MAX_POLL_ATTEMPTS=30
```

## 📈 更新日志

### 最新更新
- ✅ 移除硬编码 API Key，提升安全性
- ✅ 完善环境变量管理
- ✅ 增强错误处理和诊断
- ✅ 添加配置验证功能
- ✅ 优化 API 调用逻辑

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## �� 许可证

MIT License 