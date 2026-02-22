import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      history: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          excerpt: string | null;
          content: string | null;
          type: string | null;
          category: string | null;
          image_url: string | null;
          sources: any;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          title?: string | null;
          excerpt?: string | null;
          content?: string | null;
          type?: string | null;
          category?: string | null;
          image_url?: string | null;
          sources?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          excerpt?: string | null;
          content?: string | null;
          type?: string | null;
          category?: string | null;
          image_url?: string | null;
          sources?: any;
          created_at?: string;
        };
      };
      feedback: {
        Row: {
          id: string;
          user_id: string;
          generation_id: string | null;
          rating: number | null;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          generation_id?: string | null;
          rating?: number | null;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          generation_id?: string | null;
          rating?: number | null;
          comment?: string | null;
          created_at?: string;
        };
      };
      usage: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          count?: number;
          created_at?: string;
        };
      };
    };
  };
};