-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE playlist_status AS ENUM ('draft', 'published', 'private');
CREATE TYPE sharing_permission AS ENUM ('public', 'link_only', 'private');

-- Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  spotify_user_id TEXT,
  spotify_access_token TEXT,
  spotify_refresh_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Playlist lineage table (for versioning)
CREATE TABLE public.playlist_lineage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  original_prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Playlists table (specific versions)
CREATE TABLE public.playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lineage_id UUID REFERENCES public.playlist_lineage(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  prompt TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  status playlist_status DEFAULT 'draft' NOT NULL,
  sharing_permission sharing_permission DEFAULT 'private' NOT NULL,
  spotify_playlist_id TEXT,
  cover_image_url TEXT,
  total_tracks INTEGER DEFAULT 0,
  total_duration_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(lineage_id, version)
);

-- Playlist tracks table
CREATE TABLE public.playlist_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
  spotify_track_id TEXT NOT NULL,
  track_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  album_name TEXT,
  album_art_url TEXT,
  duration_ms INTEGER,
  preview_url TEXT,
  position INTEGER NOT NULL,
  found_on_spotify BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(playlist_id, position)
);

-- Playlist shares table (for tracking shared playlists)
CREATE TABLE public.playlist_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
  shared_by_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64url'),
  expires_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User preferences table
CREATE TABLE public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  default_sharing_permission sharing_permission DEFAULT 'private',
  email_notifications BOOLEAN DEFAULT true,
  theme TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_playlists_user_id ON public.playlists(user_id);
CREATE INDEX idx_playlists_lineage_id ON public.playlists(lineage_id);
CREATE INDEX idx_playlists_status ON public.playlists(status);
CREATE INDEX idx_playlists_sharing ON public.playlists(sharing_permission);
CREATE INDEX idx_playlist_tracks_playlist_id ON public.playlist_tracks(playlist_id);
CREATE INDEX idx_playlist_tracks_position ON public.playlist_tracks(playlist_id, position);
CREATE INDEX idx_playlist_shares_token ON public.playlist_shares(share_token);
CREATE INDEX idx_users_spotify_id ON public.users(spotify_user_id);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_lineage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for playlist_lineage
CREATE POLICY "Users can view own playlist lineage" ON public.playlist_lineage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create playlist lineage" ON public.playlist_lineage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own playlist lineage" ON public.playlist_lineage
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own playlist lineage" ON public.playlist_lineage
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for playlists
CREATE POLICY "Users can view own playlists" ON public.playlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public playlists" ON public.playlists
  FOR SELECT USING (sharing_permission = 'public');

CREATE POLICY "Users can view shared playlists" ON public.playlists
  FOR SELECT USING (
    sharing_permission = 'link_only' AND 
    id IN (
      SELECT playlist_id FROM public.playlist_shares 
      WHERE expires_at IS NULL OR expires_at > NOW()
    )
  );

CREATE POLICY "Users can create playlists" ON public.playlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own playlists" ON public.playlists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own playlists" ON public.playlists
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for playlist_tracks
CREATE POLICY "Users can view tracks of accessible playlists" ON public.playlist_tracks
  FOR SELECT USING (
    playlist_id IN (
      SELECT id FROM public.playlists 
      WHERE user_id = auth.uid() 
         OR sharing_permission = 'public'
         OR (sharing_permission = 'link_only' AND id IN (
           SELECT playlist_id FROM public.playlist_shares 
           WHERE expires_at IS NULL OR expires_at > NOW()
         ))
    )
  );

CREATE POLICY "Users can manage tracks of own playlists" ON public.playlist_tracks
  FOR ALL USING (
    playlist_id IN (
      SELECT id FROM public.playlists WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for playlist_shares
CREATE POLICY "Users can view own playlist shares" ON public.playlist_shares
  FOR SELECT USING (auth.uid() = shared_by_user_id);

CREATE POLICY "Users can create shares for own playlists" ON public.playlist_shares
  FOR INSERT WITH CHECK (
    auth.uid() = shared_by_user_id AND
    playlist_id IN (SELECT id FROM public.playlists WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own playlist shares" ON public.playlist_shares
  FOR UPDATE USING (auth.uid() = shared_by_user_id);

CREATE POLICY "Users can delete own playlist shares" ON public.playlist_shares
  FOR DELETE USING (auth.uid() = shared_by_user_id);

-- RLS Policies for user_preferences
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Functions and Triggers

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update playlist track count
CREATE OR REPLACE FUNCTION public.update_playlist_track_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.playlists 
    SET total_tracks = total_tracks + 1,
        updated_at = NOW()
    WHERE id = NEW.playlist_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.playlists 
    SET total_tracks = total_tracks - 1,
        updated_at = NOW()
    WHERE id = OLD.playlist_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for track count updates
CREATE TRIGGER update_playlist_track_count_insert
  AFTER INSERT ON public.playlist_tracks
  FOR EACH ROW EXECUTE FUNCTION public.update_playlist_track_count();

CREATE TRIGGER update_playlist_track_count_delete
  AFTER DELETE ON public.playlist_tracks
  FOR EACH ROW EXECUTE FUNCTION public.update_playlist_track_count();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at timestamps
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_playlists_updated_at
  BEFORE UPDATE ON public.playlists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); 