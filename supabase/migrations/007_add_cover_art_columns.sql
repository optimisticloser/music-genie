-- Add cover art columns for AI-generated covers
ALTER TABLE public.playlists 
ADD COLUMN IF NOT EXISTS cover_art_url TEXT,
ADD COLUMN IF NOT EXISTS cover_art_description TEXT,
ADD COLUMN IF NOT EXISTS cover_art_metadata JSONB;

-- Add index for cover art URL
CREATE INDEX IF NOT EXISTS idx_playlists_cover_art_url ON public.playlists(cover_art_url) WHERE cover_art_url IS NOT NULL; 