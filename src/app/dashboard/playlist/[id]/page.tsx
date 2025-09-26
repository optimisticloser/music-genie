import createClient from "@/lib/supabase/server";
import { PlaylistLiveView } from "@/components/playlist/PlaylistLiveView";

interface RouteParams {
  id: string;
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

interface InitialTrack {
  title?: string | null;
  artist?: string | null;
  album?: string | null;
  album_art_url?: string | null;
  duration_ms?: number | null;
  found_on_spotify?: boolean | null;
  position?: number | null;
}

interface InitialMetadata {
  primary_genre?: string | null;
  subgenre?: string | null;
  mood?: string | null;
  years?: string[] | null;
  energy_level?: string | null;
  tempo?: string | null;
  dominant_instruments?: string[] | null;
  vocal_style?: string | null;
  themes?: string[] | null;
  bpm_range?: string | null;
  key_signature?: string | null;
  language?: string | null;
  cultural_influence?: string | null;
}

interface InitialPlaylist {
  id: string;
  title?: string | null;
  description?: string | null;
  prompt?: string | null;
  creator?: string | null;
  total_tracks?: number | null;
  total_duration_ms?: number | null;
  spotify_playlist_id?: string | null;
  is_favorite?: boolean | null;
  created_at?: string | null;
  cover_art_url?: string | null;
  cover_art_description?: string | null;
  cover_art_metadata?: Record<string, unknown> | null;
  gradient?: string | null;
  status?: string | null;
  tracks: InitialTrack[];
  metadata?: InitialMetadata | null;
}

function generateGradient(id: string): string {
  const gradients = [
    "from-purple-500 to-pink-500",
    "from-blue-500 to-cyan-500",
    "from-green-500 to-emerald-500",
    "from-orange-500 to-red-500",
    "from-indigo-500 to-purple-500",
    "from-teal-500 to-blue-500",
    "from-pink-500 to-rose-500",
    "from-yellow-500 to-orange-500",
  ];

  const index = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
  return gradients[index];
}

async function markPlaylistAsViewed(
  supabase: SupabaseClient,
  playlistId: string,
  userId: string
) {
  await supabase
    .from("playlists")
    .update({ viewed_at: new Date().toISOString() })
    .eq("id", playlistId)
    .eq("user_id", userId);
}

async function fetchInitialPlaylist(
  supabase: SupabaseClient,
  playlistId: string,
  userId: string
): Promise<InitialPlaylist | null> {
  const { data: playlist, error } = await supabase
    .from("playlists")
    .select(
      `
        id,
        title,
        description,
        prompt,
        status,
        total_tracks,
        total_duration_ms,
        spotify_playlist_id,
        is_favorite,
        created_at,
        cover_art_url,
        cover_art_description,
        cover_art_metadata,
        users!inner (
          full_name,
          email
        ),
        playlist_metadata (
          primary_genre,
          subgenre,
          mood,
          years,
          energy_level,
          tempo,
          dominant_instruments,
          vocal_style,
          themes,
          bpm_range,
          key_signature,
          language,
          cultural_influence
        )
      `
    )
    .eq("id", playlistId)
    .eq("user_id", userId)
    .single();

  if (error || !playlist) {
    console.error("Failed to fetch playlist", error);
    return null;
  }

  const { data: tracksData, error: tracksError } = await supabase
    .from("playlist_tracks")
    .select(
      `
        track_name,
        artist_name,
        album_name,
        album_art_url,
        duration_ms,
        found_on_spotify,
        position
      `
    )
    .eq("playlist_id", playlistId)
    .order("position", { ascending: true });

  if (tracksError) {
    console.error("Failed to fetch tracks", tracksError);
  }

  const tracks: InitialTrack[] = (tracksData || []).map((track) => ({
    title: track.track_name,
    artist: track.artist_name,
    album: track.album_name,
    album_art_url: track.album_art_url,
    duration_ms: track.duration_ms,
    found_on_spotify: track.found_on_spotify,
    position: track.position,
  }));

  const creator = playlist.users?.full_name || playlist.users?.email || "Você";

  return {
    id: playlist.id,
    title: playlist.title,
    description: playlist.description,
    prompt: playlist.prompt,
    creator,
    total_tracks: playlist.total_tracks,
    total_duration_ms: playlist.total_duration_ms,
    spotify_playlist_id: playlist.spotify_playlist_id,
    is_favorite: playlist.is_favorite,
    created_at: playlist.created_at,
    cover_art_url: playlist.cover_art_url,
    cover_art_description: playlist.cover_art_description,
    cover_art_metadata: playlist.cover_art_metadata,
    gradient: generateGradient(playlist.id),
    status: playlist.status,
    tracks,
    metadata: playlist.playlist_metadata,
  };
}

export default async function PlaylistPage({ params }: { params: Promise<RouteParams> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-gray-600 mb-6">
            Você precisa estar logado para acessar esta página.
          </p>
          <a
            href="/login"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Fazer Login
          </a>
        </div>
      </div>
    );
  }

  const initialPlaylist = await fetchInitialPlaylist(supabase, id, user.id);

  if (!initialPlaylist) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Playlist não encontrada</h1>
          <p className="text-gray-600 mb-6">
            A playlist que você está procurando não existe ou você não tem permissão para acessá-la.
          </p>
          <a
            href="/dashboard"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar ao Dashboard
          </a>
        </div>
      </div>
    );
  }

  await markPlaylistAsViewed(supabase, id, user.id);

  return (
    <PlaylistLiveView
      playlistId={initialPlaylist.id}
      prompt={initialPlaylist.prompt || ""}
      initial={initialPlaylist}
      autoGenerate={(initialPlaylist.status ?? "draft") !== "published"}
    />
  );
}
