import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Atualizar a playlist específica que não tem tracks
    const { data: updated, error: updErr } = await supabase
      .from('playlists')
      .update({
        title: 'Toon Tunes & Lunchtime Grooves',
        description: 'Playlist criada automaticamente pelo Music Genie AI',
        status: 'published',
        total_tracks: 50,
        total_duration_ms: 2700000, // 45 minutos
      })
      .eq('id', 'e010a33f-ab8c-4785-a8ac-e3316a692c4a')
      .eq('user_id', user.id)
      .select();

          // Atualizar as músicas existentes com URLs corretas
      if (updated && updated.length > 0) {
        const trackUpdates = [
          {
            spotify_track_id: '4iV5W9uYEdYUVa79Axb7Rh',
            album_art_url: 'https://i.scdn.co/image/ab67616d0000b273c8a11e48c91a982d086afc69',
            preview_url: 'https://p.scdn.co/mp3-preview/4iV5W9uYEdYUVa79Axb7Rh',
            position: 1,
          },
          {
            spotify_track_id: '1zB4vmk8tFRmM9UULNzbLB',
            album_art_url: 'https://i.scdn.co/image/ab67616d0000b27317e1907923e91181f38290ac',
            preview_url: 'https://p.scdn.co/mp3-preview/1zB4vmk8tFRmM9UULNzbLB',
            position: 2,
          },
          {
            spotify_track_id: '6b2oQwSGFkzsMtQruIWm2p',
            album_art_url: 'https://i.scdn.co/image/ab67616d0000b27330503dbc30e621c96913379b',
            preview_url: 'https://p.scdn.co/mp3-preview/6b2oQwSGFkzsMtQruIWm2p',
            position: 3,
          }
        ];

        // Atualizar cada música individualmente
        for (const update of trackUpdates) {
          const { error: updateError } = await supabase
            .from('playlist_tracks')
            .update({
              album_art_url: update.album_art_url,
              preview_url: update.preview_url,
            })
            .eq('playlist_id', 'e010a33f-ab8c-4785-a8ac-e3316a692c4a')
            .eq('position', update.position);

          if (updateError) {
            console.error(`Error updating track at position ${update.position}:`, updateError);
          } else {
            console.log(`✅ Updated track at position ${update.position}`);
          }
        }
      }

    if (updErr) {
      console.error('Update error:', updErr);
      return NextResponse.json({ error: "Failed to update playlist" }, { status: 500 });
    }

    return NextResponse.json({ success: true, playlist: updated });
  } catch (error) {
    console.error("Test generation error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
} 