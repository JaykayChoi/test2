// Supabase Configuration
// 환경 변수로 설정하는 것이 좋지만, 데모용으로 직접 설정합니다.
// 실제 프로덕션에서는 .env 파일을 사용하세요.

const SUPABASE_URL = 'https://lldwzyirjrmlqglnthrj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsZHd6eWlyanJtbHFnbG50aHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMzM3MzYsImV4cCI6MjA4NjcwOTczNn0.kp8X9vt9ZpeKqC1I-T3C_FfTORZFqPrJ9Vur-IRKE_Y';

// Supabase 클라이언트 초기화
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

module.exports = {
  supabase,
  SUPABASE_URL,
  SUPABASE_ANON_KEY
};