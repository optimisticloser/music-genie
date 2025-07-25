// Database enums
export type PlaylistStatus = 'draft' | 'published' | 'private';
export type SharingPermission = 'public' | 'link_only' | 'private';

// User types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  spotify_user_id?: string;
  spotify_access_token?: string;
  spotify_refresh_token?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  user_id: string;
  default_sharing_permission: SharingPermission;
  email_notifications: boolean;
  theme: string;
  created_at: string;
  updated_at: string;
}

// Playlist types
export interface PlaylistLineage {
  id: string;
  user_id: string;
  original_prompt?: string;
  created_at: string;
}

export interface Playlist {
  id: string;
  lineage_id: string;
  user_id: string;
  title: string;
  description?: string;
  prompt?: string;
  version: number;
  status: PlaylistStatus;
  sharing_permission: SharingPermission;
  spotify_playlist_id?: string;
  cover_image_url?: string;
  total_tracks: number;
  total_duration_ms: number;
  created_at: string;
  updated_at: string;
}

export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  spotify_track_id: string;
  track_name: string;
  artist_name: string;
  album_name?: string;
  album_art_url?: string;
  duration_ms?: number;
  preview_url?: string;
  position: number;
  found_on_spotify: boolean;
  created_at: string;
}

export interface PlaylistShare {
  id: string;
  playlist_id: string;
  shared_by_user_id: string;
  share_token: string;
  expires_at?: string;
  view_count: number;
  created_at: string;
}

// Extended types with relations
export interface PlaylistWithTracks extends Playlist {
  tracks: PlaylistTrack[];
  user: Pick<User, 'id' | 'full_name' | 'avatar_url'>;
}

export interface PlaylistWithLineage extends Playlist {
  lineage: PlaylistLineage;
  tracks: PlaylistTrack[];
}

// Form types for playlist generation
export interface PlaylistGenerationRequest {
  prompt: string;
  guided_selections?: {
    genre?: string[];
    mood?: string[];
    era?: string[];
    instrumentation?: string[];
  };
  custom_text?: string;
}

export interface PlaylistGenerationResponse {
  title: string;
  description: string;
  queries: string[];
}

// Spotify API types
export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  duration_ms: number;
  preview_url?: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
    total: number;
  };
}

// Spotify OAuth types
export interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images?: Array<{ url: string; height: number; width: number }>;
  country?: string;
  product?: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// UI State types
export interface PlaylistGeneratorState {
  isGenerating: boolean;
  currentStep: 'input' | 'generating' | 'review' | 'saving';
  selectedGenres: string[];
  selectedMoods: string[];
  selectedEras: string[];
  customText: string;
  generatedPlaylist?: PlaylistWithTracks;
  error?: string;
} 