# 旧版 API 提取流程（Coze）

本文档整理旧版“通过 API 提取小红书笔记信息”的实现流程，便于和即将替换的本地解析逻辑做对照。

## 整体流程
1. 前端提交 URL 到 `/api/extract`，默认使用 `quickPreview: true`，只取标题和封面。
2. 服务端调用 `CozeClient`，向 Coze API 发起对话请求。
3. 若对话状态为 `in_progress`，轮询获取最终结果。
4. 对返回内容进行解析与清洗，生成统一的数据结构。
5. 前端保存笔记，并将封面下载到本地永久存储。

## 关键入口
- 前端入口：`components/xhs-extractor.tsx`
  - `handleConfirmSave()` 调用 `/api/extract`。
  - 仅请求 `quickPreview`（标题 + 封面），减少耗时。
  - 返回的封面会进一步保存到永久存储（`/api/permanent-images`）。

- 服务端入口：`app/api/extract/route.ts`
  - 读取请求参数：`{ url, quickPreview }`。
  - 调用 `CozeClient.extractXHSInfo()` 获取原始响应。
  - 调用 `CozeClient.parseXHSResponse()` 解析结构化数据。
  - 根据 `quickPreview` 返回简化数据或完整数据。

## CozeClient 核心逻辑
文件：`lib/coze-client.ts`

- 请求：
  - `POST ${NEXT_PUBLIC_COZE_API_URL}`
  - Header 携带 `COZE_API_KEY`
  - `additional_messages` 中携带用户输入（URL 或 quickPreview 指令）

- 轮询：
  - 若返回 `status = in_progress`，轮询：
    - `GET /v3/chat/retrieve`
    - `GET /v3/chat/message/list`

- 解析策略：
  - 优先读取 `tool_response` 中的 JSON `output`。
  - 若无结构化数据，回退到 `assistant` 的 `answer` 文本。
  - 尝试从文本中提取 JSON，再做字段归一化。

## 数据归一化
文件：`app/api/extract/route.ts`

- 标题与正文：`cleanText()` 清理零宽字符和空白。
- 封面 URL：
  - `http://` 转为 `https://`。
  - 若域名为 `xhscdn.com`，转成 `/api/image-proxy?url=...`。
- 图片列表：同样处理为 `https://` 并走代理。
- `quickPreview` 仅返回：`{ title, cover, noteId, url }`。

## 环境变量
旧版 API 依赖以下环境变量：
```
COZE_API_KEY=
NEXT_PUBLIC_COZE_BOT_ID=
NEXT_PUBLIC_COZE_API_URL=
```

## 错误处理
- `401`：API Key 无效
- `403`：权限不足
- `404`：Bot ID 不存在
- `429`：频率限制

## 已知限制
- 强依赖 Coze API 和 Bot 输出格式，结构变动会导致解析失败。
- 受第三方接口延迟影响，提取速度不稳定。
- 前端只获取快速预览，完整内容依赖 bot 的输出质量。
