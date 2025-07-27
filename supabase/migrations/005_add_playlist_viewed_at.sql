-- Add viewed_at column to track when user first views a playlist
ALTER TABLE public.playlists 
ADD COLUMN viewed_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for performance when querying unviewed playlists
CREATE INDEX idx_playlists_viewed_at ON public.playlists(viewed_at);

-- Add comment to document the new field
COMMENT ON COLUMN public.playlists.viewed_at IS 'Timestamp when user first viewed the playlist. NULL means never viewed (shows "New" badge)'; 