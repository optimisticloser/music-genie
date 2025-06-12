export interface PlaylistLineage {
  id: string;
  userId: string;
  createdAt: string; // ISO timestamp
}

export interface Playlist {
  id: string;
  lineageId: string;
  userId: string;
  prompt?: string;
  title: string;
  description?: string;
  version: number;
  createdAt: string; // ISO timestamp
}

export interface PlaylistTrack {
  playlistId: string;
  trackId: string;
  trackName: string;
  artistName: string;
  albumArtUrl: string;
  position: number;
  foundOnSpotify: boolean;
} 