import { NextRequest, NextResponse } from "next/server";
import createClient from "@/lib/supabase/server";
import { SpotifyService } from "@/lib/services/spotify";
import { searchTracks } from "@/lib/spotify/api";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has Spotify connected
    const isSpotifyConnected = await SpotifyService.isSpotifyConnected(user.id);
    if (!isSpotifyConnected) {
      return NextResponse.json({ error: "Spotify not connected" }, { status: 400 });
    }

    const accessToken = await SpotifyService.getValidAccessToken(user.id);
    if (!accessToken) {
      return NextResponse.json({ error: "No access token available" }, { status: 400 });
    }

    // Get all tracks without preview URLs
    const { data: tracks, error: tracksError } = await supabase
      .from('playlist_tracks')
      .select(`
        id,
        playlist_id,
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
      .eq('user_id', user.id)
      .or('preview_url.is.null,spotify_track_id.like.not_found%')
      .order('created_at', { ascending: false });

    if (tracksError) {
      console.error("Error fetching tracks:", tracksError);
      return NextResponse.json({ error: "Failed to fetch tracks" }, { status: 500 });
    }

    if (!tracks || tracks.length === 0) {
      return NextResponse.json({ 
        message: "No tracks found that need preview URL updates",
        updatedCount: 0 
      });
    }

    console.log(`🔄 Found ${tracks.length} tracks to update with preview URLs`);

    let updatedCount = 0;
    const updatePromises = tracks.map(async (track) => {
      try {
        // Skip tracks that already have preview URLs
        if (track.preview_url) {
          console.log(`⏭️ Skipping ${track.track_name} - already has preview URL`);
          return;
        }

        // Try to find the track on Spotify if we don't have a valid Spotify ID
        let spotifyTrackId = track.spotify_track_id;
        
        if (spotifyTrackId.startsWith('not_found')) {
          console.log(`🔍 Searching for ${track.track_name} by ${track.artist_name} on Spotify`);
          
          try {
            const searchQuery = `track:"${track.track_name}" artist:"${track.artist_name}"`;
            const searchResults = await searchTracks(searchQuery, accessToken, 3);
            
            if (searchResults.length > 0) {
              const bestMatch = searchResults[0];
              spotifyTrackId = bestMatch.id;
              console.log(`✅ Found Spotify ID for ${track.track_name}: ${spotifyTrackId}`);
            } else {
              console.log(`❌ No Spotify match found for ${track.track_name}`);
              return;
            }
          } catch (searchError) {
            console.error(`❌ Error searching for ${track.track_name}:`, searchError);
            return;
          }
        }

        // Fetch track details from Spotify
        const response = await fetch(`https://api.spotify.com/v1/tracks/${spotifyTrackId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.log(`❌ Failed to fetch track ${track.track_name} from Spotify: ${response.status}`);
          return;
        }

        const spotifyTrack = await response.json();
        
        // Update track with new data
        const updateData: any = {};
        
        if (!track.album_art_url && spotifyTrack.album?.images?.[0]?.url) {
          updateData.album_art_url = spotifyTrack.album.images[0].url;
        }
        
        if (!track.preview_url && spotifyTrack.preview_url) {
          updateData.preview_url = spotifyTrack.preview_url;
          console.log(`🎵 Updated preview URL for ${track.track_name}: ${spotifyTrack.preview_url}`);
        }
        
        if (!track.duration_ms && spotifyTrack.duration_ms) {
          updateData.duration_ms = spotifyTrack.duration_ms;
        }

        if (spotifyTrackId !== track.spotify_track_id) {
          updateData.spotify_track_id = spotifyTrackId;
          updateData.found_on_spotify = true;
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

    return NextResponse.json({
      message: `Updated ${updatedCount} tracks with preview URLs`,
      totalTracks: tracks.length,
      updatedCount,
      success: true
    });

  } catch (error) {
    console.error("Update all previews error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 