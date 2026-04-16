export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          is_placeholder: boolean;
          created_by_group_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          is_placeholder?: boolean;
          created_by_group_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          is_placeholder?: boolean;
          created_by_group_id?: string | null;
          created_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          invite_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          invite_code?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string;
          invite_code?: string;
          created_at?: string;
        };
      };
      memberships: {
        Row: {
          id: string;
          user_id: string;
          group_id: string;
          role: "owner" | "admin" | "member";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          group_id: string;
          role?: "owner" | "admin" | "member";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          group_id?: string;
          role?: "owner" | "admin" | "member";
          created_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          group_id: string;
          created_by: string;
          date: string;
          status: "draft" | "reconciling" | "finalized";
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          created_by: string;
          date?: string;
          status?: "draft" | "reconciling" | "finalized";
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          created_by?: string;
          date?: string;
          status?: "draft" | "reconciling" | "finalized";
          notes?: string | null;
          created_at?: string;
        };
      };
      session_players: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          is_active?: boolean;
        };
      };
      entries: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          total_buy_in: number;
          cash_out: number;
          net: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          total_buy_in?: number;
          cash_out?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          total_buy_in?: number;
          cash_out?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      leaderboard: {
        Row: {
          user_id: string;
          group_id: string;
          display_name: string | null;
          avatar_url: string | null;
          total_net: number;
          sessions_played: number;
          avg_net: number;
          best_session: number;
          worst_session: number;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
