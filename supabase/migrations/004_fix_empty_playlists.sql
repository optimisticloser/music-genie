-- Fix playlists that have total_tracks > 0 but no actual tracks
-- This migration will update the total_tracks count to match the actual number of tracks

UPDATE playlists 
SET total_tracks = (
  SELECT COUNT(*) 
  FROM playlist_tracks 
  WHERE playlist_tracks.playlist_id = playlists.id
)
WHERE total_tracks > 0 
AND id NOT IN (
  SELECT DISTINCT playlist_id 
  FROM playlist_tracks
);

-- Add a comment to track this migration
COMMENT ON TABLE playlists IS 'Updated total_tracks to match actual track count for playlists that were missing tracks'; 