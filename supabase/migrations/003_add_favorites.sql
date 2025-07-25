-- Add favorites column to playlists table
ALTER TABLE public.playlists 
ADD COLUMN is_favorite BOOLEAN DEFAULT false NOT NULL;

-- Add index for favorites
CREATE INDEX idx_playlists_favorites ON public.playlists(user_id, is_favorite);

-- Add RLS policy for favorites
CREATE POLICY "Users can view their own playlists" ON public.playlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own playlists" ON public.playlists
  FOR UPDATE USING (auth.uid() = user_id); 