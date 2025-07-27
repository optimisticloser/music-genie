import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  playlistCoverArtGeneration,
  PlaylistCoverArtGenerationInput,
} from "@/lib/workflowai/agents";

export async function POST(req: NextRequest) {
  console.log("🎨 Starting playlist cover art generation...");
  
  try {
    // Get user session
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
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              console.error("Error setting cookies:", error);
            }
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("📦 Request body received:", body);

    const {
      playlist_name,
      playlist_description,
      song_list,
      style_preferences,
      color_preferences,
    } = body;

    if (!playlist_name) {
      return NextResponse.json(
        { error: "playlist_name is required" },
        { status: 400 }
      );
    }

    const input: PlaylistCoverArtGenerationInput = {
      playlist_name,
      playlist_description,
      song_list,
      style_preferences,
      color_preferences,
    };

    console.log("🎨 Generating cover art with input:", input);

    const {
      output,
      data: { duration_seconds, cost_usd, version },
    } = await playlistCoverArtGeneration(input);

    console.log("✅ Cover art generated successfully:", {
      hasCoverArt: !!output?.cover_art,
      designDescription: output?.design_description,
      model: version?.properties?.model,
      cost: cost_usd,
      latency: duration_seconds?.toFixed(2),
    });

    return NextResponse.json({
      success: true,
      cover_art: output?.cover_art,
      design_description: output?.design_description,
      metadata: {
        model: version?.properties?.model,
        cost_usd,
        duration_seconds,
      },
    });

  } catch (error) {
    console.error("❌ Cover art generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate cover art" },
      { status: 500 }
    );
  }
} 