import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
