import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";


export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

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

    // create lineage
    const { data: lineage, error: lineageError } = await supabase
      .from("playlist_lineage")
      .insert({ user_id: user.id, original_prompt: prompt })
      .select()
      .single();

    if (lineageError) {
      console.error("Lineage insert error", lineageError);
      return new NextResponse("Failed to create lineage", { status: 500 });
    }

    const placeholderTitle = "Gerando...";

    const { data: playlist, error: plError } = await supabase
      .from("playlists")
      .insert({
        lineage_id: lineage.id,
        user_id: user.id,
        title: placeholderTitle,
        description: "Playlist em geração",
        prompt,
        status: "draft",
        sharing_permission: "private",
      })
      .select()
      .single();

    if (plError) {
      console.error("Playlist insert error", plError);
      return new NextResponse("Failed to create playlist", { status: 500 });
    }

    return NextResponse.json({ playlistId: playlist.id });
  } catch (err) {
    console.error("start playlist error", err);
    return new NextResponse("Internal error", { status: 500 });
  }
} 