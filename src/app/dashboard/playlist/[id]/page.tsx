import { Music, Clock, Calendar } from "lucide-react";
import createClient from "@/lib/supabase/server";
import { FavoriteButton } from "@/components/playlist/PlaylistActionButtons";
import { ExpandableDescription } from "@/components/playlist/ExpandableDescription";
import { PlaylistActionButtons } from "@/components/playlist/PlaylistPageClient";

interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  album_art_url?: string;
  duration: string;
  found_on_spotify: boolean;
  position: number;
}

interface Playlist {
  id: string;
  title: string;
  creator: string;
  description?: string;
  prompt?: string;
  gradient?: string;
  total_tracks: number;
  duration: string;
  spotify_playlist_id?: string;
  is_favorite?: boolean;
  created_at: string;
  viewed_at?: string;
  cover_art_url?: string;
  cover_art_description?: string;
  cover_art_metadata?: unknown;
  tracks: Track[];
  metadata?: {
    id: string;
    primary_genre?: string;
    subgenre?: string;
    mood?: string;
    years?: string[];
    energy_level?: string;
    tempo?: string;
    dominant_instruments?: string[];
    vocal_style?: string;
    themes?: string[];
    bpm_range?: string;
    key_signature?: string;
    language?: string;
    cultural_influence?: string;
  };
}

async function getPlaylist(id: string): Promise<Playlist | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  console.log('🔍 Debug getPlaylist:', { id, user: user?.id });

  if (!user) {
    console.log('❌ Usuário não autenticado');
    return null;
  }

  // Buscar playlist diretamente do Supabase em vez de usar API
  const { data: playlist, error: playlistError } = await supabase
    .from('playlists')
    .select(`
      id,
      title,
      description,
      prompt,
      status,
      total_tracks,
      total_duration_ms,
      spotify_playlist_id,
      created_at,
      updated_at,
      viewed_at,
      is_favorite,
      cover_art_url,
      cover_art_description,
      cover_art_metadata,
      users!inner (
        id,
        full_name,
        email
      ),
      playlist_metadata (
        id,
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
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  console.log('🔍 Playlist result:', { playlist: !!playlist, error: playlistError });

  if (playlistError || !playlist) {
    console.log('❌ Erro ao buscar playlist:', playlistError);
    return null;
  }

  // Buscar tracks da playlist
  const { data: tracks, error: tracksError } = await supabase
    .from('playlist_tracks')
    .select(`
      id,
      track_name,
      artist_name,
      album_name,
      album_art_url,
      duration_ms,
      preview_url,
      spotify_track_id,
      found_on_spotify,
      position
    `)
    .eq('playlist_id', id)
    .order('position', { ascending: true });

  if (tracksError) {
    console.log('❌ Erro ao buscar tracks:', tracksError);
  }

  // Formatar as tracks
  const formattedTracks: Track[] = (tracks || []).map(track => ({
    id: track.id,
    title: track.track_name,
    artist: track.artist_name,
    album: track.album_name || undefined,
    album_art_url: track.album_art_url || undefined,
    duration: formatDuration(track.duration_ms || 0),
    found_on_spotify: track.found_on_spotify || false,
    position: track.position || 0,
  }));

  // Formatar a playlist
  const formattedPlaylist: Playlist = {
    id: playlist.id,
    title: playlist.title,
    creator: playlist.users.full_name || playlist.users.email,
    description: playlist.description || undefined,
    prompt: playlist.prompt || undefined,
    gradient: generateGradient(playlist.id),
    total_tracks: playlist.total_tracks || 0,
    duration: formatPlaylistDuration(playlist.total_duration_ms || 0),
    spotify_playlist_id: playlist.spotify_playlist_id || undefined,
    is_favorite: playlist.is_favorite || false,
    created_at: playlist.created_at,
    viewed_at: playlist.viewed_at || undefined,
    cover_art_url: playlist.cover_art_url || undefined,
    cover_art_description: playlist.cover_art_description || undefined,
    cover_art_metadata: playlist.cover_art_metadata || undefined,
    tracks: formattedTracks,
    metadata: playlist.playlist_metadata ? {
      id: playlist.playlist_metadata.id,
      primary_genre: playlist.playlist_metadata.primary_genre || undefined,
      subgenre: playlist.playlist_metadata.subgenre || undefined,
      mood: playlist.playlist_metadata.mood || undefined,
      years: playlist.playlist_metadata.years || undefined,
      energy_level: playlist.playlist_metadata.energy_level || undefined,
      tempo: playlist.playlist_metadata.tempo || undefined,
      dominant_instruments: playlist.playlist_metadata.dominant_instruments || undefined,
      vocal_style: playlist.playlist_metadata.vocal_style || undefined,
      themes: playlist.playlist_metadata.themes || undefined,
      bpm_range: playlist.playlist_metadata.bpm_range || undefined,
      key_signature: playlist.playlist_metadata.key_signature || undefined,
      language: playlist.playlist_metadata.language || undefined,
      cultural_influence: playlist.playlist_metadata.cultural_influence || undefined,
    } : undefined,
  };

  return formattedPlaylist;
}

function formatDuration(ms: number): string {
  if (ms === 0) return '0:00';
  
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  
  if (hours > 0) {
    // For playlist duration (hours format)
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    // For track duration (minutes:seconds format)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  } else {
    // For very short tracks (seconds only)
    return `0:${seconds.toString().padStart(2, '0')}`;
  }
}

function formatPlaylistDuration(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function generateGradient(id: string): string {
  const gradients = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
    'from-teal-500 to-blue-500',
    'from-pink-500 to-rose-500',
    'from-yellow-500 to-orange-500',
  ];
  
  const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
  return gradients[index];
}

async function markPlaylistAsViewed(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await supabase
    .from('playlists')
    .update({ viewed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);
}

export default async function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Redirecionar para login se não estiver autenticado
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-gray-600 mb-6">Você precisa estar logado para acessar esta página.</p>
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

  const playlist = await getPlaylist(id);

  if (!playlist) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Playlist não encontrada</h1>
          <p className="text-gray-600 mb-6">A playlist que você está procurando não existe ou você não tem permissão para acessá-la.</p>
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

  // Mark as viewed
  await markPlaylistAsViewed(id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header - More compact */}
      <div className={`bg-gradient-to-r ${playlist.gradient} px-4 md:px-6 lg:px-8 xl:px-12 py-4 md:py-6`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
            {/* Artwork - Smaller size */}
            <div className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center shadow-2xl flex-shrink-0 overflow-hidden">
              {playlist.cover_art_url ? (
                <img
                  src={playlist.cover_art_url}
                  alt={playlist.cover_art_description || playlist.title}
                  className="w-full h-full object-cover rounded-lg md:rounded-xl"
                />
              ) : playlist.spotify_playlist_id ? (
                <img
                  src={`https://mosaic.scdn.co/300/ab67616d00001e02/${playlist.spotify_playlist_id}`}
                  alt={playlist.title}
                  className="w-full h-full object-cover rounded-lg md:rounded-xl"
                />
              ) : (
                <Music className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 text-white/60" />
              )}
            </div>

            {/* Playlist Info - More compact */}
            <div className="flex-1 min-w-0">
              <div className="text-xs md:text-sm text-white/80 mb-1 md:mb-2">Playlist</div>
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3 items-start sm:items-center mb-2 md:mb-3">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">
                  {playlist.title}
                </h1>
                <FavoriteButton
                  playlistId={playlist.id}
                  isFavorite={playlist.is_favorite}
                />
              </div>
              <p className="text-sm md:text-base lg:text-lg text-white/90 mb-2 md:mb-3">
                Criado por {playlist.creator}
              </p>
              {playlist.description && (
                <ExpandableDescription
                  description={playlist.description}
                  className="mb-2 md:mb-3"
                />
              )}
              {playlist.prompt && (
                <div className="mb-2 md:mb-3">
                  <span className="text-xs md:text-sm font-medium text-white/70">Prompt:</span>
                  <ExpandableDescription
                    description={playlist.prompt}
                    className="mt-1"
                  />
                </div>
              )}
              <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm text-white/80 mb-3 md:mb-4">
                <div className="flex items-center gap-1">
                  <Music className="w-3 h-3 md:w-4 md:h-4" />
                  {playlist.total_tracks} músicas
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 md:w-4 md:h-4" />
                  {playlist.duration}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                  {new Date(playlist.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>

              {/* Action Buttons - More compact */}
              <PlaylistActionButtons
                playlistId={playlist.id}
                spotifyPlaylistId={playlist.spotify_playlist_id}
                playlistName={playlist.title}
                playlistDescription={playlist.description || ""}
                songList={playlist.tracks.map(track => `${track.artist} - ${track.title}`).join('; ')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-6 lg:px-8 xl:px-12 py-6 md:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Metadata Section - Hidden on smaller screens */}
            {playlist.metadata && (
              <div className="xl:col-span-1 hidden xl:block">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold mb-6">Metadados</h2>
                  <div className="space-y-4">
                    {playlist.metadata.primary_genre && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Gênero:</span>
                        <p className="text-base text-gray-900 mt-1">{playlist.metadata.primary_genre}</p>
                      </div>
                    )}
                    {playlist.metadata.mood && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Humor:</span>
                        <p className="text-base text-gray-900 mt-1">{playlist.metadata.mood}</p>
                      </div>
                    )}
                    {playlist.metadata.energy_level && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Nível de Energia:</span>
                        <p className="text-base text-gray-900 mt-1">{playlist.metadata.energy_level}</p>
                      </div>
                    )}
                    {playlist.metadata.tempo && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Tempo:</span>
                        <p className="text-base text-gray-900 mt-1">{playlist.metadata.tempo}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tracks Section */}
            <div className={playlist.metadata ? "xl:col-span-3" : "xl:col-span-4"}>
              {playlist.tracks.length > 0 ? (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 w-16"></th>
                            <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Música</th>
                            <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Artista</th>
                            <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Álbum</th>
                            <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 text-right w-20">Duração</th>
                          </tr>
                        </thead>
                        <tbody>
                          {playlist.tracks.map((track) => (
                            <tr key={track.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-6">
                                {/* Album artwork only */}
                                <div className={`w-10 h-10 bg-gray-200 rounded flex items-center justify-center flex-shrink-0 overflow-hidden ${
                                  track.found_on_spotify ? 'ring-2 ring-green-500' : ''
                                }`}>
                                  {track.album_art_url ? (
                                    <img
                                      src={track.album_art_url}
                                      alt={track.album || track.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Music className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-6">
                                <div className="font-medium text-gray-900">{track.title}</div>
                              </td>
                              <td className="py-3 px-6">
                                <div className="text-gray-600">{track.artist}</div>
                              </td>
                              <td className="py-3 px-6">
                                <div className="text-gray-600">{track.album || '-'}</div>
                              </td>
                              <td className="py-3 px-6 text-right">
                                <div className="text-gray-500 text-sm">{track.duration}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden p-4 space-y-3">
                    {playlist.tracks.map((track) => (
                      <div key={track.id} className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                        {/* Album artwork for mobile */}
                        <div className={`w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ${
                          track.found_on_spotify ? 'ring-2 ring-green-500' : ''
                        }`}>
                          {track.album_art_url ? (
                            <img
                              src={track.album_art_url}
                              alt={track.album || track.title}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Music className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900 truncate">{track.title}</h3>
                          </div>
                          <p className="text-sm text-gray-600 truncate">{track.artist}</p>
                          {track.album && (
                            <p className="text-xs text-gray-500 truncate">{track.album}</p>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-500 flex-shrink-0">
                          {track.duration}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg p-12">
                  <div className="text-center">
                    <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhuma música encontrada nesta playlist.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 