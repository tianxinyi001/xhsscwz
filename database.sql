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
  rating INTEGER DEFAULT 0,
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

-- 如果需要更严格的安全策略，可以使用以下策略替代上面的策略：
-- CREATE POLICY "Users can view all notes" ON notes FOR SELECT USING (true);
-- CREATE POLICY "Users can insert notes" ON notes FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Users can update notes" ON notes FOR UPDATE USING (true);
-- CREATE POLICY "Users can delete notes" ON notes FOR DELETE USING (true); 
