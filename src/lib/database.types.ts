export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          pseudo: string
          email_newsletter: boolean
          level: number
          experience_points: number
          role: 'user' | 'admin'
          published_quiz_count: number
          created_at: string
          updated_at: string
          terms_accepted_at: string | null
          privacy_accepted_at: string | null
          language?: string | null
          show_all_languages?: boolean | null
          is_banned?: boolean | null
          ban_until?: string | null
          ban_reason?: string | null
          force_username_change?: boolean | null
          duel_rating?: number
          duel_ranked_games?: number
          duel_ranked_wins?: number
          monthly_score?: number | null
          monthly_games_played?: number | null
          top_10_count?: number | null
          last_reset_month?: string | null
          current_streak?: number | null
          longest_streak?: number | null
        }
        Insert: {
          id: string
          pseudo: string
          email_newsletter?: boolean
          level?: number
          experience_points?: number
          role?: 'user' | 'admin'
          published_quiz_count?: number
          created_at?: string
          updated_at?: string
          terms_accepted_at?: string | null
          privacy_accepted_at?: string | null
          duel_rating?: number
          duel_ranked_games?: number
          duel_ranked_wins?: number
          monthly_score?: number | null
          monthly_games_played?: number | null
          top_10_count?: number | null
          last_reset_month?: string | null
          current_streak?: number | null
          longest_streak?: number | null
        }
        Update: {
          id?: string
          pseudo?: string
          email_newsletter?: boolean
          level?: number
          experience_points?: number
          role?: 'user' | 'admin'
          published_quiz_count?: number
          created_at?: string
          updated_at?: string
          terms_accepted_at?: string | null
          privacy_accepted_at?: string | null
          duel_rating?: number
          duel_ranked_games?: number
          duel_ranked_wins?: number
          monthly_score?: number | null
          monthly_games_played?: number | null
          top_10_count?: number | null
          last_reset_month?: string | null
          current_streak?: number | null
          longest_streak?: number | null
        }
      }
      badges: {
        Row: {
          id: string
          name: string
          description: string
          icon: string
          requirement_type: string
          requirement_value: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          icon?: string
          requirement_type: string
          requirement_value: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon?: string
          requirement_type?: string
          requirement_value?: number
          created_at?: string
        }
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_id: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_id: string
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          badge_id?: string
          earned_at?: string
        }
      }
      titles: {
        Row: {
          id: string
          name: string
          description: string
          requirement_type: string
          requirement_value: number
          is_special: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          requirement_type: string
          requirement_value: number
          is_special?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          requirement_type?: string
          requirement_value?: number
          is_special?: boolean
          created_at?: string
        }
      }
      user_titles: {
        Row: {
          id: string
          user_id: string
          title_id: string
          is_active: boolean
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title_id: string
          is_active?: boolean
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title_id?: string
          is_active?: boolean
          earned_at?: string
        }
      }
      quizzes: {
        Row: {
          id: string
          creator_id: string
          title: string
          description: string | null
          category: 'flags' | 'capitals' | 'maps' | 'borders' | 'regions' | 'mixed'
          is_public: boolean
          is_global: boolean
          difficulty: 'easy' | 'medium' | 'hard'
          time_limit_seconds: number | null
          total_plays: number
          average_score: number
          created_at: string
          published_at: string | null
          is_reported: boolean
          report_count: number
          cover_image_url: string | null
          validation_status: 'pending' | 'approved' | 'rejected' | null
          pending_validation: boolean | null
          randomize_questions: boolean | null
          randomize_answers: boolean | null
          language: string | null
          quiz_type_id: string | null
          tags: string[] | null
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          description?: string | null
          category: 'flags' | 'capitals' | 'maps' | 'borders' | 'regions' | 'mixed'
          is_public?: boolean
          is_global?: boolean
          difficulty?: 'easy' | 'medium' | 'hard'
          time_limit_seconds?: number | null
          total_plays?: number
          average_score?: number
          created_at?: string
          published_at?: string | null
          is_reported?: boolean
          report_count?: number
          cover_image_url?: string | null
          validation_status?: 'pending' | 'approved' | 'rejected' | null
          pending_validation?: boolean | null
          randomize_questions?: boolean | null
          randomize_answers?: boolean | null
          language?: string | null
          quiz_type_id?: string | null
          tags?: string[] | null
        }
        Update: {
          id?: string
          creator_id?: string
          title?: string
          description?: string | null
          category?: 'flags' | 'capitals' | 'maps' | 'borders' | 'regions' | 'mixed'
          is_public?: boolean
          is_global?: boolean
          difficulty?: 'easy' | 'medium' | 'hard'
          time_limit_seconds?: number | null
          total_plays?: number
          average_score?: number
          created_at?: string
          published_at?: string | null
          is_reported?: boolean
          report_count?: number
          cover_image_url?: string | null
          validation_status?: 'pending' | 'approved' | 'rejected' | null
          pending_validation?: boolean | null
          randomize_questions?: boolean | null
          randomize_answers?: boolean | null
          language?: string | null
          quiz_type_id?: string | null
          tags?: string[] | null
        }
      }
      questions: {
        Row: {
          id: string
          quiz_id: string
          question_text: string
          question_type:
            | 'mcq'
            | 'single_answer'
            | 'map_click'
            | 'text_free'
            | 'true_false'
            | 'puzzle_map'
            | 'top10_order'
            | 'country_multi'
          correct_answer: string
          correct_answers: string[] | null
          options: Json | null
          map_data: Json | null
          image_url: string | null
          option_images: Json | null
          randomize_options: boolean | null
          points: number
          order_index: number
          created_at: string
          complement_if_wrong: string | null
        }
        Insert: {
          id?: string
          quiz_id: string
          question_text: string
          question_type:
            | 'mcq'
            | 'single_answer'
            | 'map_click'
            | 'text_free'
            | 'true_false'
            | 'puzzle_map'
            | 'top10_order'
            | 'country_multi'
          correct_answer: string
          correct_answers?: string[] | null
          options?: Json | null
          map_data?: Json | null
          image_url?: string | null
          option_images?: Json | null
          randomize_options?: boolean | null
          points?: number
          order_index: number
          created_at?: string
          complement_if_wrong?: string | null
        }
        Update: {
          id?: string
          quiz_id?: string
          question_text?: string
          question_type?:
            | 'mcq'
            | 'single_answer'
            | 'map_click'
            | 'text_free'
            | 'true_false'
            | 'puzzle_map'
            | 'top10_order'
            | 'country_multi'
          correct_answer?: string
          correct_answers?: string[] | null
          options?: Json | null
          map_data?: Json | null
          image_url?: string | null
          option_images?: Json | null
          randomize_options?: boolean | null
          points?: number
          order_index?: number
          created_at?: string
          complement_if_wrong?: string | null
        }
      }
      quiz_types: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string
          created_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string
          created_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string
          created_at?: string
          is_active?: boolean
        }
      }
      countries_reference: {
        Row: {
          iso3: string
          name: string
          continent: string
          lat: number | null
          lng: number | null
          population: number | null
          area_km2: number | null
          created_at: string
        }
        Insert: {
          iso3: string
          name: string
          continent: string
          lat?: number | null
          lng?: number | null
          population?: number | null
          area_km2?: number | null
          created_at?: string
        }
        Update: {
          iso3?: string
          name?: string
          continent?: string
          lat?: number | null
          lng?: number | null
          population?: number | null
          area_km2?: number | null
          created_at?: string
        }
      }
      top10_rules: {
        Row: {
          id: string
          code: string
          label: string
          metric: 'population' | 'area_km2'
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          label: string
          metric: 'population' | 'area_km2'
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          label?: string
          metric?: 'population' | 'area_km2'
          is_active?: boolean
          created_at?: string
        }
      }
      game_sessions: {
        Row: {
          id: string
          quiz_id: string
          player_id: string
          mode: 'solo' | 'duel'
          score: number
          accuracy_percentage: number
          time_taken_seconds: number
          completed: boolean
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          quiz_id: string
          player_id: string
          mode?: 'solo' | 'duel'
          score?: number
          accuracy_percentage?: number
          time_taken_seconds?: number
          completed?: boolean
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          quiz_id?: string
          player_id?: string
          mode?: 'solo' | 'duel'
          score?: number
          accuracy_percentage?: number
          time_taken_seconds?: number
          completed?: boolean
          started_at?: string
          completed_at?: string | null
        }
      }
      geojson_custom_maps: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          storage_path: string
          public_url: string
          file_size_bytes: number
          feature_count: number
          bbox: number[] | null
          preset: Json
          status: 'pending' | 'approved' | 'rejected'
          created_by: string
          created_at: string
          updated_at: string
          reviewed_by: string | null
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          storage_path: string
          public_url: string
          file_size_bytes?: number
          feature_count?: number
          bbox?: number[] | null
          preset?: Json
          status?: 'pending' | 'approved' | 'rejected'
          created_by: string
          created_at?: string
          updated_at?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          storage_path?: string
          public_url?: string
          file_size_bytes?: number
          feature_count?: number
          bbox?: number[] | null
          preset?: Json
          status?: 'pending' | 'approved' | 'rejected'
          created_by?: string
          created_at?: string
          updated_at?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
        }
      }
      game_answers: {
        Row: {
          id: string
          session_id: string
          question_id: string
          user_answer: string
          is_correct: boolean
          time_taken_seconds: number
          points_earned: number
          answered_at: string
        }
        Insert: {
          id?: string
          session_id: string
          question_id: string
          user_answer: string
          is_correct: boolean
          time_taken_seconds: number
          points_earned?: number
          answered_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          question_id?: string
          user_answer?: string
          is_correct?: boolean
          time_taken_seconds?: number
          points_earned?: number
          answered_at?: string
        }
      }
      duels: {
        Row: {
          id: string
          quiz_id: string
          player1_id: string
          player2_id: string
          player1_session_id: string | null
          player2_session_id: string | null
          winner_id: string | null
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          match_type?: 'casual' | 'ranked'
          ranking_processed?: boolean
          player1_rating_delta?: number
          player2_rating_delta?: number
          queue_mode?: 'targeted' | 'random_bonus'
          random_bonus_enabled?: boolean
          bonus_xp?: number
          bonus_awarded?: boolean
          created_at: string
          started_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          quiz_id: string
          player1_id: string
          player2_id: string
          player1_session_id?: string | null
          player2_session_id?: string | null
          winner_id?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          match_type?: 'casual' | 'ranked'
          ranking_processed?: boolean
          player1_rating_delta?: number
          player2_rating_delta?: number
          queue_mode?: 'targeted' | 'random_bonus'
          random_bonus_enabled?: boolean
          bonus_xp?: number
          bonus_awarded?: boolean
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          quiz_id?: string
          player1_id?: string
          player2_id?: string
          player1_session_id?: string | null
          player2_session_id?: string | null
          winner_id?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          match_type?: 'casual' | 'ranked'
          ranking_processed?: boolean
          player1_rating_delta?: number
          player2_rating_delta?: number
          queue_mode?: 'targeted' | 'random_bonus'
          random_bonus_enabled?: boolean
          bonus_xp?: number
          bonus_awarded?: boolean
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
      }
      duel_matchmaking_queue: {
        Row: {
          id: string
          user_id: string
          preferred_quiz_id: string | null
          preferred_quiz_ids: string[] | null
          preferred_difficulty: 'easy' | 'medium' | 'hard' | null
          match_type: 'casual' | 'ranked'
          queue_mode: 'targeted' | 'random_bonus'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preferred_quiz_id?: string | null
          preferred_quiz_ids?: string[] | null
          preferred_difficulty?: 'easy' | 'medium' | 'hard' | null
          match_type?: 'casual' | 'ranked'
          queue_mode?: 'targeted' | 'random_bonus'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          preferred_quiz_id?: string | null
          preferred_quiz_ids?: string[] | null
          preferred_difficulty?: 'easy' | 'medium' | 'hard' | null
          match_type?: 'casual' | 'ranked'
          queue_mode?: 'targeted' | 'random_bonus'
          created_at?: string
        }
      }
      duel_feature_flags: {
        Row: {
          feature_key: string
          enabled: boolean
          updated_at: string
        }
        Insert: {
          feature_key: string
          enabled?: boolean
          updated_at?: string
        }
        Update: {
          feature_key?: string
          enabled?: boolean
          updated_at?: string
        }
      }
      admin_activity_logs: {
        Row: {
          id: string
          actor_id: string
          action: string
          entity_type: string | null
          entity_id: string | null
          details: Json
          created_at: string
        }
        Insert: {
          id?: string
          actor_id: string
          action: string
          entity_type?: string | null
          entity_id?: string | null
          details?: Json
          created_at?: string
        }
        Update: {
          id?: string
          actor_id?: string
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          details?: Json
          created_at?: string
        }
      }
      friendships: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          accepted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          accepted_at?: string | null
        }
      }
      duel_invitations: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          quiz_id: string
          status: 'pending' | 'accepted' | 'declined' | 'expired'
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          quiz_id: string
          status?: 'pending' | 'accepted' | 'declined' | 'expired'
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          quiz_id?: string
          status?: 'pending' | 'accepted' | 'declined' | 'expired'
          created_at?: string
          expires_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          message?: string
          is_read?: boolean
          created_at?: string
        }
      }
      quiz_shares: {
        Row: {
          id: string
          quiz_id: string
          shared_by_user_id: string
          shared_with_user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          shared_by_user_id: string
          shared_with_user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          shared_by_user_id?: string
          shared_with_user_id?: string
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          quiz_id: string | null
          message_id: string | null
          reason: string
          description: string | null
          status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          reviewed_by: string | null
          created_at: string
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          reporter_id: string
          quiz_id?: string | null
          message_id?: string | null
          reason: string
          description?: string | null
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          reviewed_by?: string | null
          created_at?: string
          reviewed_at?: string | null
        }
        Update: {
          id?: string
          reporter_id?: string
          quiz_id?: string | null
          message_id?: string | null
          reason?: string
          description?: string | null
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          reviewed_by?: string | null
          created_at?: string
          reviewed_at?: string | null
        }
      }
      password_reset_tokens: {
        Row: {
          id: string
          user_id: string
          token: string
          expires_at: string
          used: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          expires_at: string
          used?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token?: string
          expires_at?: string
          used?: boolean
          created_at?: string
        }
      }
    }
    Functions: {
      log_admin_event: {
        Args: {
          p_action: string
          p_entity_type?: string | null
          p_entity_id?: string | null
          p_details?: Json
        }
        Returns: undefined
      }
    }
  }
}
