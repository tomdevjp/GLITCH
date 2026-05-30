import { createClient } from '@supabase/supabase-js';

// デプロイ環境のビルド時に環境変数が未設定でも、createClientがクラッシュしてビルド（デプロイ）が失敗するのを防ぐため、
// フォールバック用のダミーURLとキーを設定します。
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase URL or Anon Key is missing. Please check your environment variables.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
