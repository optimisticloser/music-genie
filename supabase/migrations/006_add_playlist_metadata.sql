-- Add playlist metadata table to store categorization data
CREATE TABLE public.playlist_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
  
  -- Categorization data
  primary_genre TEXT,
  subgenre TEXT,
  mood TEXT,
  years TEXT[], -- Array of years/eras
  energy_level TEXT,
  tempo TEXT,
  dominant_instruments TEXT[], -- Array of instruments
  vocal_style TEXT,
  themes TEXT[], -- Array of themes
  
  -- Additional metadata
  bpm_range TEXT, -- e.g., "120-140"
  key_signature TEXT,
  language TEXT,
  cultural_influence TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure one metadata record per playlist
  UNIQUE(playlist_id)
);

-- Add indexes for better query performance
CREATE INDEX idx_playlist_metadata_primary_genre ON public.playlist_metadata(primary_genre);
CREATE INDEX idx_playlist_metadata_mood ON public.playlist_metadata(mood);
CREATE INDEX idx_playlist_metadata_energy_level ON public.playlist_metadata(energy_level);
CREATE INDEX idx_playlist_metadata_tempo ON public.playlist_metadata(tempo);
CREATE INDEX idx_playlist_metadata_years ON public.playlist_metadata USING GIN(years);
CREATE INDEX idx_playlist_metadata_dominant_instruments ON public.playlist_metadata USING GIN(dominant_instruments);
CREATE INDEX idx_playlist_metadata_themes ON public.playlist_metadata USING GIN(themes);

-- Enable Row Level Security
ALTER TABLE public.playlist_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies for playlist_metadata
CREATE POLICY "Users can view metadata of accessible playlists" ON public.playlist_metadata
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

CREATE POLICY "Users can manage metadata of own playlists" ON public.playlist_metadata
  FOR ALL USING (
    playlist_id IN (
      SELECT id FROM public.playlists WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at timestamp
CREATE TRIGGER update_playlist_metadata_updated_at
  BEFORE UPDATE ON public.playlist_metadata
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add some useful functions for querying metadata

-- Function to search playlists by metadata
CREATE OR REPLACE FUNCTION public.search_playlists_by_metadata(
  search_genre TEXT DEFAULT NULL,
  search_mood TEXT DEFAULT NULL,
  search_energy TEXT DEFAULT NULL,
  search_instruments TEXT[] DEFAULT NULL,
  search_themes TEXT[] DEFAULT NULL,
  user_id_param UUID DEFAULT NULL
)
RETURNS TABLE (
  playlist_id UUID,
  title TEXT,
  description TEXT,
  primary_genre TEXT,
  mood TEXT,
  energy_level TEXT,
  dominant_instruments TEXT[],
  themes TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    pm.primary_genre,
    pm.mood,
    pm.energy_level,
    pm.dominant_instruments,
    pm.themes
  FROM public.playlists p
  LEFT JOIN public.playlist_metadata pm ON p.id = pm.playlist_id
  WHERE p.status = 'published'
    AND (user_id_param IS NULL OR p.user_id = user_id_param)
    AND (search_genre IS NULL OR pm.primary_genre ILIKE '%' || search_genre || '%')
    AND (search_mood IS NULL OR pm.mood ILIKE '%' || search_mood || '%')
    AND (search_energy IS NULL OR pm.energy_level ILIKE '%' || search_energy || '%')
    AND (search_instruments IS NULL OR pm.dominant_instruments && search_instruments)
    AND (search_themes IS NULL OR pm.themes && search_themes)
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get playlist statistics by metadata
CREATE OR REPLACE FUNCTION public.get_playlist_metadata_stats(user_id_param UUID DEFAULT NULL)
RETURNS TABLE (
  category TEXT,
  value TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'genre'::TEXT, pm.primary_genre, COUNT(*)
  FROM public.playlists p
  LEFT JOIN public.playlist_metadata pm ON p.id = pm.playlist_id
  WHERE p.status = 'published'
    AND (user_id_param IS NULL OR p.user_id = user_id_param)
    AND pm.primary_genre IS NOT NULL
  GROUP BY pm.primary_genre
  
  UNION ALL
  
  SELECT 'mood'::TEXT, pm.mood, COUNT(*)
  FROM public.playlists p
  LEFT JOIN public.playlist_metadata pm ON p.id = pm.playlist_id
  WHERE p.status = 'published'
    AND (user_id_param IS NULL OR p.user_id = user_id_param)
    AND pm.mood IS NOT NULL
  GROUP BY pm.mood
  
  UNION ALL
  
  SELECT 'energy'::TEXT, pm.energy_level, COUNT(*)
  FROM public.playlists p
  LEFT JOIN public.playlist_metadata pm ON p.id = pm.playlist_id
  WHERE p.status = 'published'
    AND (user_id_param IS NULL OR p.user_id = user_id_param)
    AND pm.energy_level IS NOT NULL
  GROUP BY pm.energy_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 