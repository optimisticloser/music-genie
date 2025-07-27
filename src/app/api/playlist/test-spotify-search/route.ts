import { NextRequest, NextResponse } from "next/server";
import { SpotifyService } from "@/lib/services/spotify";
import { searchTracks } from "@/lib/spotify/api";

export async function POST(req: NextRequest) {
  try {
    const { testSongs } = await req.json();
    
    if (!testSongs || !Array.isArray(testSongs)) {
      return NextResponse.json({ error: "testSongs array is required" }, { status: 400 });
    }

    // Simular um user ID para teste
    const testUserId = "test-user-id";
    
    // Verificar se Spotify está conectado
    const isSpotifyConnected = await SpotifyService.isSpotifyConnected(testUserId);
    console.log("🎵 Spotify connected:", isSpotifyConnected);
    
    if (!isSpotifyConnected) {
      return NextResponse.json({ 
        error: "Spotify not connected",
        spotify_connected: false 
      }, { status: 400 });
    }

    const accessToken = await SpotifyService.getValidAccessToken(testUserId);
    if (!accessToken) {
      return NextResponse.json({ 
        error: "No access token available",
        spotify_connected: true,
        access_token: false
      }, { status: 400 });
    }

    console.log("🎵 Access token obtained:", !!accessToken);

    const results = [];

    for (const song of testSongs) {
      console.log(`🎵 Testing search for: ${song.title} by ${song.artist}`);
      
      try {
        const searchQuery = `track:"${song.title}" artist:"${song.artist}"`;
        console.log(`🎵 Search query: ${searchQuery}`);
        
        const tracks = await searchTracks(searchQuery, accessToken, 5);
        console.log(`🎵 Found ${tracks.length} tracks`);
        
        if (tracks.length > 0) {
          const bestTrack = tracks[0];
          console.log(`🎵 Best match: ${bestTrack.name} by ${bestTrack.artists[0].name}`);
          console.log(`🎵 Preview URL: ${bestTrack.preview_url}`);
          console.log(`🎵 Album art: ${bestTrack.album.images[0]?.url}`);
          
          results.push({
            original: { title: song.title, artist: song.artist },
            found: {
              name: bestTrack.name,
              artist: bestTrack.artists[0].name,
              spotify_id: bestTrack.id,
              preview_url: bestTrack.preview_url,
              album_art_url: bestTrack.album.images[0]?.url,
              duration_ms: bestTrack.duration_ms,
              external_url: bestTrack.external_urls.spotify
            },
            success: true
          });
        } else {
          results.push({
            original: { title: song.title, artist: song.artist },
            found: null,
            success: false,
            error: "No tracks found"
          });
        }
      } catch (error) {
        console.error(`❌ Error searching for ${song.title}:`, error);
        results.push({
          original: { title: song.title, artist: song.artist },
          found: null,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    const summary = {
      total_tested: testSongs.length,
      successful_searches: results.filter(r => r.success).length,
      failed_searches: results.filter(r => !r.success).length,
      tracks_with_preview: results.filter(r => r.success && r.found?.preview_url).length,
      tracks_without_preview: results.filter(r => r.success && !r.found?.preview_url).length
    };

    return NextResponse.json({
      spotify_connected: true,
      access_token: true,
      summary,
      results
    });

  } catch (error) {
    console.error("Test Spotify search error:", error);
    return NextResponse.json({ 
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 