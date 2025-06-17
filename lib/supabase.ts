import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gfwbgnzzvhsmmpwuytjr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmd2Jnbnp6dmhzbW1wd3V5dGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNTU1OTgsImV4cCI6MjA2NTYzMTU5OH0.OKSKkIki_BUYcAvgXUiB0AB__dcBtdDBOZOl_EsnrEw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 数据库表结构类型
export interface DatabaseNote {
  id: string;
  title: string;
  content: string;
  author_name: string;
  images: string[];
  original_images?: string[];
  local_images?: string[];
  cached_images?: string[];
  permanent_images?: string[];
  filename?: string;
  tags: string[];
  url?: string;
  create_time: string;
  extracted_at: string;
  created_at?: string;
  updated_at?: string;
} 