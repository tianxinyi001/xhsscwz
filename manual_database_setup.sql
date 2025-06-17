-- 🔧 小红书收藏应用数据库设置
-- 请在Supabase控制台的SQL编辑器中执行以下SQL

-- 1. 删除现有表（如果存在）
DROP TABLE IF EXISTS notes CASCADE;

-- 2. 创建笔记表
CREATE TABLE notes (
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

-- 3. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title);

-- 4. 创建更新时间触发器
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

-- 5. 启用行级安全策略 (RLS)
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- 6. 创建策略：允许所有操作（因为这是个人使用的应用）
DROP POLICY IF EXISTS "Allow all operations" ON notes;
CREATE POLICY "Allow all operations" ON notes FOR ALL USING (true);

-- 7. 验证表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notes' 
ORDER BY ordinal_position;

-- 8. 测试插入一条记录
INSERT INTO notes (
  id, 
  title, 
  content, 
  author_name, 
  images, 
  tags, 
  url, 
  create_time, 
  extracted_at
) VALUES (
  'test-note-001',
  '测试笔记',
  '这是一个测试笔记',
  '测试用户',
  ARRAY['https://example.com/image.jpg'],
  ARRAY['测试', '笔记'],
  'https://example.com/note',
  NOW()::TEXT,
  NOW()::TEXT
);

-- 9. 查询测试记录
SELECT * FROM notes WHERE id = 'test-note-001';

-- 10. 删除测试记录
DELETE FROM notes WHERE id = 'test-note-001';

-- 完成！现在你可以使用小红书收藏应用了。 