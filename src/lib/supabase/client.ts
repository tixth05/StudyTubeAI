import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

// Browser client for client components
export const supabaseBrowser = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// Server client with service role (for admin operations)
export const supabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Database types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          phone: string | null;
          monthly_credits: number;
          credits_used: number;
          reset_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          phone?: string | null;
          monthly_credits?: number;
          credits_used?: number;
          reset_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          phone?: string | null;
          monthly_credits?: number;
          credits_used?: number;
          reset_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      videos: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          input_text: string;
          summary: string | null;
          video_url: string | null;
          quiz_json: any;
          credits_cost: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          input_text: string;
          summary?: string | null;
          video_url?: string | null;
          quiz_json?: any;
          credits_cost?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          input_text?: string;
          summary?: string | null;
          video_url?: string | null;
          quiz_json?: any;
          credits_cost?: number;
          created_at?: string;
        };
      };
    };
  };
};
