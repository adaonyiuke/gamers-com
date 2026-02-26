export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      games: {
        Row: {
          created_at: string
          group_id: string
          icon: string | null
          id: string
          max_players: number | null
          min_players: number | null
          name: string
          scoring_type: string
        }
        Insert: {
          created_at?: string
          group_id: string
          icon?: string | null
          id?: string
          max_players?: number | null
          min_players?: number | null
          name: string
          scoring_type?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          icon?: string | null
          id?: string
          max_players?: number | null
          min_players?: number | null
          name?: string
          scoring_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          avatar_url: string | null
          bio: string | null
          display_name: string
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          display_name: string
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          display_name?: string
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_settings: {
        Row: {
          allow_edit_finalized: boolean | null
          auto_include_all_members: boolean | null
          confetti_intensity: string | null
          created_at: string | null
          default_meetup_name_format: string | null
          default_meetup_status: string | null
          group_id: string
          guest_allow_recurring: boolean | null
          guest_include_in_stats: boolean | null
          id: string
          leaderboard_default_sort: string | null
          leaderboard_include_guests: boolean | null
          lock_sessions_after_complete: boolean | null
          reduced_motion: boolean | null
          show_fun_stats: boolean | null
          show_most_improved: boolean | null
          show_rivalry_stats: boolean | null
          streak_include_guests: boolean | null
          streak_window: number | null
          updated_at: string | null
          winner_animation: boolean | null
        }
        Insert: {
          allow_edit_finalized?: boolean | null
          auto_include_all_members?: boolean | null
          confetti_intensity?: string | null
          created_at?: string | null
          default_meetup_name_format?: string | null
          default_meetup_status?: string | null
          group_id: string
          guest_allow_recurring?: boolean | null
          guest_include_in_stats?: boolean | null
          id?: string
          leaderboard_default_sort?: string | null
          leaderboard_include_guests?: boolean | null
          lock_sessions_after_complete?: boolean | null
          reduced_motion?: boolean | null
          show_fun_stats?: boolean | null
          show_most_improved?: boolean | null
          show_rivalry_stats?: boolean | null
          streak_include_guests?: boolean | null
          streak_window?: number | null
          updated_at?: string | null
          winner_animation?: boolean | null
        }
        Update: {
          allow_edit_finalized?: boolean | null
          auto_include_all_members?: boolean | null
          confetti_intensity?: string | null
          created_at?: string | null
          default_meetup_name_format?: string | null
          default_meetup_status?: string | null
          group_id?: string
          guest_allow_recurring?: boolean | null
          guest_include_in_stats?: boolean | null
          id?: string
          leaderboard_default_sort?: string | null
          leaderboard_include_guests?: boolean | null
          lock_sessions_after_complete?: boolean | null
          reduced_motion?: boolean | null
          show_fun_stats?: boolean | null
          show_most_improved?: boolean | null
          show_rivalry_stats?: boolean | null
          streak_include_guests?: boolean | null
          streak_window?: number | null
          updated_at?: string | null
          winner_animation?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "group_settings_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: true
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          invite_code: string | null
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          invite_code?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          invite_code?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      guests: {
        Row: {
          avatar_url: string | null
          created_at: string
          group_id: string
          guest_type: string
          id: string
          invited_by: string | null
          name: string
          promoted_to_user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          group_id: string
          guest_type?: string
          id?: string
          invited_by?: string | null
          name: string
          promoted_to_user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          group_id?: string
          guest_type?: string
          id?: string
          invited_by?: string | null
          name?: string
          promoted_to_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guests_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "game_leaderboard"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "guests_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guests_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["member_id"]
          },
        ]
      }
      meetup_participants: {
        Row: {
          guest_id: string | null
          id: string
          joined_at: string
          meetup_id: string
          member_id: string | null
        }
        Insert: {
          guest_id?: string | null
          id?: string
          joined_at?: string
          meetup_id: string
          member_id?: string | null
        }
        Update: {
          guest_id?: string | null
          id?: string
          joined_at?: string
          meetup_id?: string
          member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetup_participants_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetup_participants_meetup_id_fkey"
            columns: ["meetup_id"]
            isOneToOne: false
            referencedRelation: "meetups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetup_participants_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "game_leaderboard"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "meetup_participants_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetup_participants_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["member_id"]
          },
        ]
      }
      meetups: {
        Row: {
          created_at: string
          created_by: string
          date: string
          group_id: string
          id: string
          location: string | null
          notes: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          date: string
          group_id: string
          id?: string
          location?: string | null
          notes?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          date?: string
          group_id?: string
          id?: string
          location?: string | null
          notes?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      score_entries: {
        Row: {
          id: string
          is_winner: boolean
          participant_id: string
          score: number | null
          session_id: string
        }
        Insert: {
          id?: string
          is_winner?: boolean
          participant_id: string
          score?: number | null
          session_id: string
        }
        Update: {
          id?: string
          is_winner?: boolean
          participant_id?: string
          score?: number | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "score_entries_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "meetup_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_entries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          finalized_at: string | null
          game_id: string
          id: string
          meetup_id: string
          played_at: string
          status: string
          winner_participant_id: string | null
        }
        Insert: {
          finalized_at?: string | null
          game_id: string
          id?: string
          meetup_id: string
          played_at?: string
          status?: string
          winner_participant_id?: string | null
        }
        Update: {
          finalized_at?: string | null
          game_id?: string
          id?: string
          meetup_id?: string
          played_at?: string
          status?: string
          winner_participant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "game_leaderboard"
            referencedColumns: ["game_id"]
          },
          {
            foreignKeyName: "sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_meetup_id_fkey"
            columns: ["meetup_id"]
            isOneToOne: false
            referencedRelation: "meetups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_winner_participant_id_fkey"
            columns: ["winner_participant_id"]
            isOneToOne: false
            referencedRelation: "meetup_participants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      game_leaderboard: {
        Row: {
          display_name: string | null
          game_id: string | null
          game_name: string | null
          group_id: string | null
          member_avatar_url: string | null
          member_id: string | null
          times_played: number | null
          wins: number | null
        }
        Relationships: [
          {
            foreignKeyName: "games_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      member_stats: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          group_id: string | null
          member_id: string | null
          total_meetups: number | null
          total_sessions: number | null
          total_wins: number | null
          user_id: string | null
          win_rate: number | null
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
