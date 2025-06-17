# Supabase 数据库设置指南

## 1. 创建数据库表

请在 Supabase 控制台的 SQL Editor 中运行以下 SQL 脚本（已保存在 `database.sql` 文件中）：

```sql
-- 创建笔记表
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  author_name TEXT DEFAULT '',
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  original_images TEXT[] DEFAULT NULL,
  local_images TEXT[] DEFAULT NULL,
  cached_images TEXT[] DEFAULT NULL,
  permanent_images TEXT[] DEFAULT NULL,
  filename TEXT DEFAULT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  url TEXT DEFAULT NULL,
  create_time TEXT NOT NULL,
  extracted_at TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notes_updated_at 
    BEFORE UPDATE ON notes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全策略 (RLS)
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许所有操作（因为这是个人使用的应用）
CREATE POLICY "Allow all operations" ON notes FOR ALL USING (true);
```

## 2. 确认 Storage Bucket

确保你已经在 Supabase Storage 中创建了名为 `covers` 的 bucket，并设置为公开访问。

## 3. 测试数据库连接

访问 `/test` 页面来测试数据库功能：

- 加载笔记：测试从数据库读取数据
- 添加测试笔记：测试向数据库写入数据
- 迁移本地数据：将 localStorage 中的数据迁移到数据库

## 4. 数据迁移

当你首次使用新的数据库功能时，系统会自动检测 localStorage 中的现有数据并提示迁移。你也可以手动触发迁移。

## 5. 主要变化

- **数据存储**：从 localStorage 迁移到 Supabase 数据库
- **图片存储**：继续使用 Supabase Storage
- **跨浏览器同步**：现在数据在不同浏览器间同步
- **数据持久性**：数据不会因为清除浏览器缓存而丢失

## 6. API 端点

- `GET /api/notes` - 获取所有笔记
- `POST /api/notes` - 创建新笔记
- `PUT /api/notes` - 更新笔记
- `DELETE /api/notes?id=xxx` - 删除笔记

## 7. 故障排除

如果遇到问题：

1. 检查 Supabase 项目 URL 和 API Key 是否正确
2. 确认数据库表已正确创建
3. 检查 RLS 策略是否正确设置
4. 查看浏览器控制台的错误信息
5. 访问 `/test` 页面进行调试 