import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

export type CoverGenerationStatus =
  | {
      stage: "started";
    }
  | {
      stage: "success";
      coverArtUrl: string;
      coverArtDescription?: string | null;
      metadata: {
        model?: string | null;
        cost_usd?: number | null;
        duration_seconds?: number | null;
      };
    }
  | {
    stage: "error";
    message: string;
  };

interface GeneratePlaylistCoverOptions {
  onStatus?: (status: CoverGenerationStatus) => void;
}

// Função alternativa usando Google GenAI diretamente
export async function generatePlaylistCoverWithGoogleGenAI(
  playlistName: string,
  playlistDescription: string,
  songList: string,
  supabase: any,
  playlistId: string,
  options: GeneratePlaylistCoverOptions = {}
) {
  try {
    console.log("🎨 Starting cover art generation with Google GenAI for playlist:", playlistId);
    options.onStatus?.({ stage: "started" });

    const ai = new GoogleGenAI({});
    
    const prompt = `Create a vibrant, energetic album cover for a music playlist called "${playlistName}". 
    
    Description: ${playlistDescription}
    
    Style: Bright, energetic, vibrant with vibrant yellows, energetic oranges, and bright magentas.
    
    The cover should be visually appealing and represent the musical energy of the playlist.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: prompt,
    });

    let imageData: string | null = null;
    let imageDescription = "AI-generated playlist cover art";

    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        imageDescription = part.text;
      } else if (part.inlineData) {
        imageData = part.inlineData.data;
      }
    }

    if (!imageData) {
      throw new Error("No image data received from Google GenAI");
    }

    // Converter base64 para URL de dados
    const imageUrl = `data:image/png;base64,${imageData}`;

    // Salvar no Supabase Storage
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const fileName = `covers/${playlistId}-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('playlist-covers')
      .upload(fileName, Buffer.from(imageData, 'base64'), {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error("Error uploading cover to Supabase Storage:", uploadError);
      // Usar URL de dados como fallback
      const finalUrl = imageUrl;
    } else {
      const { data: { publicUrl } } = supabaseClient.storage
        .from('playlist-covers')
        .getPublicUrl(fileName);
      
      const finalUrl = publicUrl;
    }

    // Atualizar a playlist com a URL da capa gerada
    const { error: updateError } = await supabase
      .from("playlists")
      .update({
        cover_art_url: finalUrl,
        cover_art_description: imageDescription,
        cover_art_metadata: {
          model: "gemini-2.5-flash-image-preview",
          generated_at: new Date().toISOString(),
        },
      })
      .eq("id", playlistId);

    if (updateError) {
      console.error("❌ Error updating playlist with cover art:", updateError);
    } else {
      console.log("✅ Playlist updated with cover art URL");
    }

    options.onStatus?.({
      stage: "success",
      coverArtUrl: finalUrl,
      coverArtDescription: imageDescription,
      metadata: {
        model: "gemini-2.5-flash-image-preview",
      },
    });

  } catch (error) {
    console.error("❌ Error generating cover art with Google GenAI:", error);
    options.onStatus?.({
      stage: "error",
      message: error instanceof Error ? error.message : "Failed to generate cover art"
    });
  }
}
