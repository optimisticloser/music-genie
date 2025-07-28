import {
  playlistCoverArtGeneration,
  PlaylistCoverArtGenerationInput,
} from "@/lib/workflowai/agents";

// Função para gerar capa de playlist de forma assíncrona
export async function generatePlaylistCover(
  playlistName: string,
  playlistDescription: string,
  songList: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  playlistId: string
) {
  try {
    console.log("🎨 Starting async cover art generation for playlist:", playlistId);
    
    const input: PlaylistCoverArtGenerationInput = {
      playlist_name: playlistName,
      playlist_description: playlistDescription,
      song_list: songList,
      style_preferences: "Bright, energetic, vibrant",
      color_preferences: "Vibrant yellows, energetic oranges, and bright magentas",
    };

    const {
      output,
      data: { duration_seconds, cost_usd, version },
    } = await playlistCoverArtGeneration(input);

    if (output?.cover_art) {
      console.log("✅ Cover art generated successfully:", {
        playlistId,
        coverArtUrl: output.cover_art.url,
        model: version?.properties?.model,
        cost: cost_usd,
        latency: duration_seconds?.toFixed(2),
      });

      // Atualizar a playlist com a URL da capa gerada
      const { error: updateError } = await supabase
        .from("playlists")
        .update({
          cover_art_url: output.cover_art.url,
          cover_art_description: output.design_description,
          cover_art_metadata: {
            model: version?.properties?.model,
            cost_usd: cost_usd,
            duration_seconds: duration_seconds,
            generated_at: new Date().toISOString(),
          },
        })
        .eq("id", playlistId);

      if (updateError) {
        console.error("❌ Error updating playlist with cover art:", updateError);
      } else {
        console.log("✅ Playlist updated with cover art URL");
      }
    }
  } catch (error) {
    console.error("❌ Error generating cover art:", error);
    // Não falha a geração da playlist se a capa falhar
  }
} 