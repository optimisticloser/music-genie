export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          spotify_user_id: string | null
          spotify_access_token: string | null
          spotify_refresh_token: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          spotify_user_id?: string | null
          spotify_access_token?: string | null
          spotify_refresh_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          spotify_user_id?: string | null
          spotify_access_token?: string | null
          spotify_refresh_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      playlist_lineage: {
        Row: {
          id: string
          user_id: string
          original_prompt: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          original_prompt?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          original_prompt?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_lineage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      playlists: {
        Row: {
          id: string
          lineage_id: string
          user_id: string
          title: string
          description: string | null
          prompt: string | null
          version: number
          status: Database["public"]["Enums"]["playlist_status"]
          sharing_permission: Database["public"]["Enums"]["sharing_permission"]
          spotify_playlist_id: string | null
          cover_image_url: string | null
          total_tracks: number
          total_duration_ms: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lineage_id: string
          user_id: string
          title: string
          description?: string | null
          prompt?: string | null
          version?: number
          status?: Database["public"]["Enums"]["playlist_status"]
          sharing_permission?: Database["public"]["Enums"]["sharing_permission"]
          spotify_playlist_id?: string | null
          cover_image_url?: string | null
          total_tracks?: number
          total_duration_ms?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lineage_id?: string
          user_id?: string
          title?: string
          description?: string | null
          prompt?: string | null
          version?: number
          status?: Database["public"]["Enums"]["playlist_status"]
          sharing_permission?: Database["public"]["Enums"]["sharing_permission"]
          spotify_playlist_id?: string | null
          cover_image_url?: string | null
          total_tracks?: number
          total_duration_ms?: number
          created_at?: string
          updated_at?: string
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
          }
        ]
      }
      playlist_tracks: {
        Row: {
          id: string
          playlist_id: string
          spotify_track_id: string
          track_name: string
          artist_name: string
          album_name: string | null
          album_art_url: string | null
          duration_ms: number | null
          preview_url: string | null
          position: number
          found_on_spotify: boolean
          created_at: string
        }
        Insert: {
          id?: string
          playlist_id: string
          spotify_track_id: string
          track_name: string
          artist_name: string
          album_name?: string | null
          album_art_url?: string | null
          duration_ms?: number | null
          preview_url?: string | null
          position: number
          found_on_spotify?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          playlist_id?: string
          spotify_track_id?: string
          track_name?: string
          artist_name?: string
          album_name?: string | null
          album_art_url?: string | null
          duration_ms?: number | null
          preview_url?: string | null
          position?: number
          found_on_spotify?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          }
        ]
      }
      playlist_shares: {
        Row: {
          id: string
          playlist_id: string
          shared_by_user_id: string
          share_token: string
          expires_at: string | null
          view_count: number
          created_at: string
        }
        Insert: {
          id?: string
          playlist_id: string
          shared_by_user_id: string
          share_token?: string
          expires_at?: string | null
          view_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          playlist_id?: string
          shared_by_user_id?: string
          share_token?: string
          expires_at?: string | null
          view_count?: number
          created_at?: string
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
          }
        ]
      }
      user_preferences: {
        Row: {
          user_id: string
          default_sharing_permission: Database["public"]["Enums"]["sharing_permission"]
          email_notifications: boolean
          theme: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          default_sharing_permission?: Database["public"]["Enums"]["sharing_permission"]
          email_notifications?: boolean
          theme?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          default_sharing_permission?: Database["public"]["Enums"]["sharing_permission"]
          email_notifications?: boolean
          theme?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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