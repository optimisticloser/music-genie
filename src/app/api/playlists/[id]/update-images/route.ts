import { NextRequest, NextResponse } from "next/server";
import createClient from "@/lib/supabase/server";
import { SpotifyService } from "@/lib/services/spotify";

interface TrackUpdateData {
  album_art_url?: string;
  preview_url?: string;
  duration_ms?: number;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const playlistId = resolvedParams.id;

    // Get playlist tracks that don't have album_art_url
    const { data: tracks, error: tracksError } = await supabase
      .from('playlist_tracks')
      .select(`
        id,
        spotify_track_id,
        track_name,
        artist_name,
        album_name,
        album_art_url,
        duration_ms,
        preview_url,
        position,
        found_on_spotify
      `)
      .eq('playlist_id', playlistId)
      .or('album_art_url.is.null,preview_url.is.null')
      .order('position', { ascending: true });

    if (tracksError) {
      console.error("Error fetching tracks:", tracksError);
      return NextResponse.json({ error: "Failed to fetch tracks" }, { status: 500 });
    }

    if (!tracks || tracks.length === 0) {
      return NextResponse.json({ 
        message: "All tracks already have images and preview URLs",
        updatedCount: 0 
      });
    }

    console.log(`🔄 Found ${tracks.length} tracks to update for playlist ${playlistId}`);

    // Get Spotify access token
    const spotifyToken = await SpotifyService.getValidAccessToken(user.id);
    if (!spotifyToken) {
      return NextResponse.json({ error: "Spotify not connected" }, { status: 400 });
    }

    let updatedCount = 0;
    const updatePromises = tracks.map(async (track) => {
      if (!track.spotify_track_id || track.spotify_track_id === 'not_found') {
        console.log(`⏭️ Skipping track ${track.track_name} - no Spotify ID`);
        return;
      }

      try {
        // Fetch track details from Spotify
        const response = await fetch(`https://api.spotify.com/v1/tracks/${track.spotify_track_id}`, {
          headers: {
            'Authorization': `Bearer ${spotifyToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.log(`❌ Failed to fetch track ${track.track_name} from Spotify: ${response.status}`);
          return;
        }

        const spotifyTrack = await response.json();
        
        // Update track with new data
        const updateData: TrackUpdateData = {};
        
        if (!track.album_art_url && spotifyTrack.album?.images?.[0]?.url) {
          updateData.album_art_url = spotifyTrack.album.images[0].url;
          console.log(`🖼️ Updated album art for ${track.track_name}`);
        }
        
        if (!track.preview_url && spotifyTrack.preview_url) {
          updateData.preview_url = spotifyTrack.preview_url;
          console.log(`🎵 Updated preview URL for ${track.track_name}`);
        }
        
        if (!track.duration_ms && spotifyTrack.duration_ms) {
          updateData.duration_ms = spotifyTrack.duration_ms;
        }

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('playlist_tracks')
            .update(updateData)
            .eq('id', track.id);

          if (updateError) {
            console.error(`❌ Failed to update track ${track.track_name}:`, updateError);
          } else {
            updatedCount++;
            console.log(`✅ Updated track ${track.track_name}`);
          }
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error updating track ${track.track_name}:`, error);
      }
    });

    await Promise.all(updatePromises);

    console.log(`🎉 Updated ${updatedCount} tracks for playlist ${playlistId}`);

    return NextResponse.json({ 
      message: `Updated ${updatedCount} tracks`,
      updatedCount,
      totalTracks: tracks.length
    });

  } catch (error) {
    console.error("Update images error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 