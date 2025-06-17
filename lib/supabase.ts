import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gfwbgnzzvhsmmpwuytjr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmd2Jnbnp6dmhzbW1wd3V5dGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNTU1OTgsImV4cCI6MjA2NTYzMTU5OH0.OKSKkIki_BUYcAvgXUiB0AB__dcBtdDBOZOl_EsnrEw'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function deleteSupabaseImage(filename: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('covers')
      .remove([filename])
    
    if (error) {
      console.error('删除 Supabase 图片失败:', error.message)
      return false
    }
    
    console.log('成功删除 Supabase 图片:', filename)
    return true
  } catch (error) {
    console.error('删除 Supabase 图片异常:', error)
    return false
  }
} 