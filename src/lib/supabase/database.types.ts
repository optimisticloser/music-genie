export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      demo_prompts: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_active: boolean | null
          popularity_score: number | null
          prompt: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          popularity_score?: number | null
          prompt: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          popularity_score?: number | null
          prompt?: string
        }
        Relationships: []
      }
      playlist_lineage: {
        Row: {
          created_at: string
          id: string
          original_prompt: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          original_prompt?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          original_prompt?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_lineage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_metadata: {
        Row: {
          bpm_range: string | null
          created_at: string
          cultural_influence: string | null
          dominant_instruments: string[] | null
          energy_level: string | null
          id: string
          key_signature: string | null
          language: string | null
          mood: string | null
          playlist_id: string
          primary_genre: string | null
          subgenre: string | null
          tempo: string | null
          themes: string[] | null
          updated_at: string
          vocal_style: string | null
          years: string[] | null
        }
        Insert: {
          bpm_range?: string | null
          created_at?: string
          cultural_influence?: string | null
          dominant_instruments?: string[] | null
          energy_level?: string | null
          id?: string
          key_signature?: string | null
          language?: string | null
          mood?: string | null
          playlist_id: string
          primary_genre?: string | null
          subgenre?: string | null
          tempo?: string | null
          themes?: string[] | null
          updated_at?: string
          vocal_style?: string | null
          years?: string[] | null
        }
        Update: {
          bpm_range?: string | null
          created_at?: string
          cultural_influence?: string | null
          dominant_instruments?: string[] | null
          energy_level?: string | null
          id?: string
          key_signature?: string | null
          language?: string | null
          mood?: string | null
          playlist_id?: string
          primary_genre?: string | null
          subgenre?: string | null
          tempo?: string | null
          themes?: string[] | null
          updated_at?: string
          vocal_style?: string | null
          years?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "playlist_metadata_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: true
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_shares: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          playlist_id: string
          share_token: string
          shared_by_user_id: string
          view_count: number | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          playlist_id: string
          share_token?: string
          shared_by_user_id: string
          view_count?: number | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          playlist_id?: string
          share_token?: string
          shared_by_user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "playlist_shares_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_shares_shared_by_user_id_fkey"
            columns: ["shared_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_tracks: {
        Row: {
          album_art_url: string | null
          album_name: string | null
          artist_name: string
          created_at: string
          duration_ms: number | null
          found_on_spotify: boolean
          id: string
          playlist_id: string
          position: number
          preview_url: string | null
          spotify_track_id: string
          track_name: string
        }
        Insert: {
          album_art_url?: string | null
          album_name?: string | null
          artist_name: string
          created_at?: string
          duration_ms?: number | null
          found_on_spotify?: boolean
          id?: string
          playlist_id: string
          position: number
          preview_url?: string | null
          spotify_track_id: string
          track_name: string
        }
        Update: {
          album_art_url?: string | null
          album_name?: string | null
          artist_name?: string
          created_at?: string
          duration_ms?: number | null
          found_on_spotify?: boolean
          id?: string
          playlist_id?: string
          position?: number
          preview_url?: string | null
          spotify_track_id?: string
          track_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          cover_art_description: string | null
          cover_art_metadata: Json | null
          cover_art_url: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          is_favorite: boolean
          lineage_id: string
          prompt: string | null
          sharing_permission: Database["public"]["Enums"]["sharing_permission"]
          spotify_playlist_id: string | null
          status: Database["public"]["Enums"]["playlist_status"]
          title: string
          total_duration_ms: number | null
          total_tracks: number | null
          updated_at: string
          user_id: string
          version: number
          viewed_at: string | null
        }
        Insert: {
          cover_art_description?: string | null
          cover_art_metadata?: Json | null
          cover_art_url?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_favorite?: boolean
          lineage_id: string
          prompt?: string | null
          sharing_permission?: Database["public"]["Enums"]["sharing_permission"]
          spotify_playlist_id?: string | null
          status?: Database["public"]["Enums"]["playlist_status"]
          title: string
          total_duration_ms?: number | null
          total_tracks?: number | null
          updated_at?: string
          user_id: string
          version?: number
          viewed_at?: string | null
        }
        Update: {
          cover_art_description?: string | null
          cover_art_metadata?: Json | null
          cover_art_url?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_favorite?: boolean
          lineage_id?: string
          prompt?: string | null
          sharing_permission?: Database["public"]["Enums"]["sharing_permission"]
          spotify_playlist_id?: string | null
          status?: Database["public"]["Enums"]["playlist_status"]
          title?: string
          total_duration_ms?: number | null
          total_tracks?: number | null
          updated_at?: string
          user_id?: string
          version?: number
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playlists_lineage_id_fkey"
            columns: ["lineage_id"]
            isOneToOne: false
            referencedRelation: "playlist_lineage"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          default_sharing_permission:
            | Database["public"]["Enums"]["sharing_permission"]
            | null
          email_notifications: boolean | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_sharing_permission?:
            | Database["public"]["Enums"]["sharing_permission"]
            | null
          email_notifications?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_sharing_permission?:
            | Database["public"]["Enums"]["sharing_permission"]
            | null
          email_notifications?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          spotify_access_token: string | null
          spotify_refresh_token: string | null
          spotify_user_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          spotify_access_token?: string | null
          spotify_refresh_token?: string | null
          spotify_user_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          spotify_access_token?: string | null
          spotify_refresh_token?: string | null
          spotify_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_playlist_metadata_stats: {
        Args: { user_id_param?: string }
        Returns: {
          category: string
          value: string
          count: number
        }[]
      }
      search_playlists_by_metadata: {
        Args: {
          search_genre?: string
          search_mood?: string
          search_energy?: string
          search_instruments?: string[]
          search_themes?: string[]
          user_id_param?: string
        }
        Returns: {
          playlist_id: string
          title: string
          description: string
          primary_genre: string
          mood: string
          energy_level: string
          dominant_instruments: string[]
          themes: string[]
        }[]
      }
    }
    Enums: {
      playlist_status: "draft" | "published" | "private"
      sharing_permission: "public" | "link_only" | "private"
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
    Enums: {
      playlist_status: ["draft", "published", "private"],
      sharing_permission: ["public", "link_only", "private"],
    },
  },
} as const
