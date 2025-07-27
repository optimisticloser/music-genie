import { NextRequest, NextResponse } from "next/server";
import createClient from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const playlistId = searchParams.get('playlist_id');

    if (!playlistId) {
      return NextResponse.json({ error: "Playlist ID is required" }, { status: 400 });
    }

    // Get playlist tracks with preview URLs
    const { data: tracks, error } = await supabase
      .from('playlist_tracks')
      .select(`
        id,
        track_name,
        artist_name,
        spotify_track_id,
        preview_url,
        found_on_spotify,
        position
      `)
      .eq('playlist_id', playlistId)
      .order('position', { ascending: true });

    if (error) {
      console.error("Error fetching tracks:", error);
      return NextResponse.json({ error: "Failed to fetch tracks" }, { status: 500 });
    }

    // Test preview URLs
    const tracksWithPreviewTest = await Promise.all(
      tracks?.map(async (track) => {
        let previewTest = {
          hasPreviewUrl: !!track.preview_url,
          urlValid: false,
          status: null as number | null,
          error: null as string | null
        };

        if (track.preview_url) {
          try {
            const response = await fetch(track.preview_url, { 
              method: 'HEAD',
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; MusicGenie/1.0)'
              }
            });
            
            previewTest.urlValid = response.ok;
            previewTest.status = response.status;
          } catch (error) {
            previewTest.error = error instanceof Error ? error.message : 'Unknown error';
          }
        }

        return {
          ...track,
          previewTest
        };
      }) || []
    );

    return NextResponse.json({
      playlist_id: playlistId,
      total_tracks: tracks?.length || 0,
      tracks_with_preview: tracksWithPreviewTest.filter(t => t.previewTest.hasPreviewUrl).length,
      tracks_without_preview: tracksWithPreviewTest.filter(t => !t.previewTest.hasPreviewUrl).length,
      tracks_with_valid_preview: tracksWithPreviewTest.filter(t => t.previewTest.urlValid).length,
      tracks: tracksWithPreviewTest
    });

  } catch (error) {
    console.error("Debug preview error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 