import { createClient } from '@supabase/supabase-js';
import type { Database as RawDatabase, Json } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

type AddRelationships<T> = {
  [K in keyof T]: T[K] extends { Row: infer R; Insert: infer I; Update: infer U }
    ? { Row: R; Insert: I; Update: U; Relationships: [] }
    : T[K];
};

type BaseTables = AddRelationships<RawDatabase['public']['Tables']>;

export type Database = {
  public: {
    Tables: Omit<
      BaseTables,
      | 'profiles'
      | 'quizzes'
      | 'user_badges'
      | 'user_titles'
      | 'friendships'
      | 'chat_messages'
      | 'duels'
      | 'duel_invitations'
      | 'quiz_score_challenges'
      | 'game_sessions'
    > & {
      profiles: {
        Row: BaseTables['profiles']['Row'] & {
          language?: string | null;
          show_all_languages?: boolean;
          is_banned?: boolean | null;
        };
        Insert: BaseTables['profiles']['Insert'] & {
          language?: string | null;
          show_all_languages?: boolean;
          is_banned?: boolean | null;
        };
        Update: BaseTables['profiles']['Update'] & {
          language?: string | null;
          show_all_languages?: boolean;
          is_banned?: boolean | null;
        };
        Relationships: [];
      };
      quizzes: {
        Row: BaseTables['quizzes']['Row'];
        Insert: BaseTables['quizzes']['Insert'];
        Update: BaseTables['quizzes']['Update'];
        Relationships: [
          {
            foreignKeyName: 'quizzes_quiz_type_id_fkey';
            columns: ['quiz_type_id'];
            isOneToOne: false;
            referencedRelation: 'quiz_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'quizzes_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      user_badges: {
        Row: BaseTables['user_badges']['Row'];
        Insert: BaseTables['user_badges']['Insert'];
        Update: BaseTables['user_badges']['Update'];
        Relationships: [
          {
            foreignKeyName: 'user_badges_badge_id_fkey';
            columns: ['badge_id'];
            isOneToOne: false;
            referencedRelation: 'badges';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_badges_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      user_titles: {
        Row: BaseTables['user_titles']['Row'];
        Insert: BaseTables['user_titles']['Insert'];
        Update: BaseTables['user_titles']['Update'];
        Relationships: [
          {
            foreignKeyName: 'user_titles_title_id_fkey';
            columns: ['title_id'];
            isOneToOne: false;
            referencedRelation: 'titles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_titles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      friendships: {
        Row: BaseTables['friendships']['Row'];
        Insert: BaseTables['friendships']['Insert'];
        Update: BaseTables['friendships']['Update'];
        Relationships: [
          {
            foreignKeyName: 'friendships_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'friendships_friend_id_fkey';
            columns: ['friend_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      chat_messages: {
        Row: BaseTables['chat_messages']['Row'];
        Insert: BaseTables['chat_messages']['Insert'];
        Update: BaseTables['chat_messages']['Update'];
        Relationships: [
          {
            foreignKeyName: 'chat_messages_from_user_id_fkey';
            columns: ['from_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chat_messages_to_user_id_fkey';
            columns: ['to_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      duels: {
        Row: BaseTables['duels']['Row'];
        Insert: BaseTables['duels']['Insert'];
        Update: BaseTables['duels']['Update'];
        Relationships: [
          {
            foreignKeyName: 'duels_quiz_id_fkey';
            columns: ['quiz_id'];
            isOneToOne: false;
            referencedRelation: 'quizzes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'duels_player1_id_fkey';
            columns: ['player1_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'duels_player2_id_fkey';
            columns: ['player2_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      duel_invitations: {
        Row: BaseTables['duel_invitations']['Row'];
        Insert: BaseTables['duel_invitations']['Insert'];
        Update: BaseTables['duel_invitations']['Update'];
        Relationships: [
          {
            foreignKeyName: 'duel_invitations_from_user_id_fkey';
            columns: ['from_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'duel_invitations_to_user_id_fkey';
            columns: ['to_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'duel_invitations_quiz_id_fkey';
            columns: ['quiz_id'];
            isOneToOne: false;
            referencedRelation: 'quizzes';
            referencedColumns: ['id'];
          }
        ];
      };
      quiz_score_challenges: {
        Row: BaseTables['quiz_score_challenges']['Row'];
        Insert: BaseTables['quiz_score_challenges']['Insert'];
        Update: BaseTables['quiz_score_challenges']['Update'];
        Relationships: [
          {
            foreignKeyName: 'quiz_score_challenges_from_user_id_fkey';
            columns: ['from_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'quiz_score_challenges_to_user_id_fkey';
            columns: ['to_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'quiz_score_challenges_quiz_id_fkey';
            columns: ['quiz_id'];
            isOneToOne: false;
            referencedRelation: 'quizzes';
            referencedColumns: ['id'];
          }
        ];
      };
      game_sessions: {
        Row: BaseTables['game_sessions']['Row'] & {
          correct_answers?: number | null;
          total_questions?: number | null;
        };
        Insert: BaseTables['game_sessions']['Insert'] & {
          correct_answers?: number | null;
          total_questions?: number | null;
        };
        Update: BaseTables['game_sessions']['Update'] & {
          correct_answers?: number | null;
          total_questions?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'game_sessions_quiz_id_fkey';
            columns: ['quiz_id'];
            isOneToOne: false;
            referencedRelation: 'quizzes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'game_sessions_player_id_fkey';
            columns: ['player_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      categories: {
        Row: { id: string; name: string; label: string };
        Insert: { id?: string; name: string; label: string };
        Update: { id?: string; name?: string; label?: string };
        Relationships: [];
      };
      difficulties: {
        Row: {
          id: string;
          name: string;
          label: string;
          multiplier?: number;
          color: string;
          level?: number;
        };
        Insert: {
          id?: string;
          name: string;
          label: string;
          multiplier?: number;
          color?: string;
          level?: number;
        };
        Update: {
          id?: string;
          name?: string;
          label?: string;
          multiplier?: number;
          color?: string;
          level?: number;
        };
        Relationships: [];
      };
      shared_quizzes: {
        Row: {
          id: string;
          quiz_id: string;
          shared_by_user_id: string;
          shared_with_user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          shared_by_user_id: string;
          shared_with_user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          shared_by_user_id?: string;
          shared_with_user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      warnings: {
        Row: {
          id: string;
          reported_user_id: string;
          reporter_user_id: string;
          reason: string;
          status: string;
          admin_notes?: string | null;
          action_taken?: string | null;
          created_at: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          temp_ban_until?: string | null;
        };
        Insert: {
          id?: string;
          reported_user_id: string;
          reporter_user_id: string;
          reason: string;
          status?: string;
          admin_notes?: string | null;
          action_taken?: string | null;
          created_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          temp_ban_until?: string | null;
        };
        Update: {
          id?: string;
          reported_user_id?: string;
          reporter_user_id?: string;
          reason?: string;
          status?: string;
          admin_notes?: string | null;
          action_taken?: string | null;
          created_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          temp_ban_until?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'warnings_reported_user_id_fkey';
            columns: ['reported_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'warnings_reporter_user_id_fkey';
            columns: ['reporter_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          message: string;
          related_id?: string | null;
          is_read?: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          message: string;
          related_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          message?: string;
          related_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      monthly_rankings_history: {
        Row: {
          id: string;
          user_id: string;
          period?: string | null;
          rank?: number | null;
          score?: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          period?: string | null;
          rank?: number | null;
          score?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          period?: string | null;
          rank?: number | null;
          score?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      quiz_validations: {
        Row: {
          id: string;
          quiz_id: string;
          validated_by?: string | null;
          validated_at: string;
          status: 'pending' | 'approved' | 'rejected';
          rejection_reason?: string | null;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          validated_by?: string | null;
          validated_at?: string;
          status?: 'pending' | 'approved' | 'rejected';
          rejection_reason?: string | null;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          validated_by?: string | null;
          validated_at?: string;
          status?: 'pending' | 'approved' | 'rejected';
          rejection_reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'quiz_validations_quiz_id_fkey';
            columns: ['quiz_id'];
            isOneToOne: false;
            referencedRelation: 'quizzes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'quiz_validations_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: RawDatabase['public']['Functions'] & {
      complete_game_session: {
        Args: {
          p_session_id: string;
          p_score: number;
          p_accuracy: number;
          p_time_taken_seconds: number;
          p_correct_answers: number;
          p_total_questions: number;
        };
        Returns: Json;
      };
      complete_game_session_and_progress: {
        Args: {
          p_session_id: string;
          p_score: number;
          p_accuracy: number;
          p_time_taken_seconds: number;
          p_correct_answers: number;
          p_total_questions: number;
        };
        Returns: Json;
      };
      complete_duel: {
        Args: {
          p_duel_id: string;
          p_session_id: string;
        };
        Returns: Json;
      };
      link_duel_session_and_finalize: {
        Args: {
          p_duel_id: string;
          p_session_id: string;
        };
        Returns: Json;
      };
      delete_user_account: {
        Args: {
          user_id?: string;
        };
        Returns: void;
      };
      get_public_landing_stats: {
        Args: Record<string, never>;
        Returns: Json;
      };
      create_or_match_random_duel: {
        Args: Record<string, unknown>;
        Returns: Json;
      };
      cancel_random_duel_search: {
        Args: Record<string, unknown>;
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
