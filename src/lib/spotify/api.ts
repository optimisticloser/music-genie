import { SpotifyTrack, SpotifySearchResponse, SpotifyTokens, SpotifyUser } from '@/types';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_ACCOUNTS_BASE = 'https://accounts.spotify.com';

// Spotify OAuth Configuration
export const SPOTIFY_CONFIG = {
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/auth/spotify/callback',
  scopes: [
    'user-read-email',
    'user-read-private',
    'playlist-read-private',
    'playlist-modify-public',
    'playlist-modify-private',
    'user-library-read',
    'user-library-modify'
  ].join(' ')
};

// Generate Spotify OAuth URL
export function getSpotifyAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: SPOTIFY_CONFIG.clientId,
    response_type: 'code',
    redirect_uri: SPOTIFY_CONFIG.redirectUri,
    scope: SPOTIFY_CONFIG.scopes,
    show_dialog: 'true'
  });

  if (state) {
    params.append('state', state);
  }

  return `${SPOTIFY_ACCOUNTS_BASE}/authorize?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string): Promise<SpotifyTokens> {
  const response = await fetch(`${SPOTIFY_ACCOUNTS_BASE}/api/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CONFIG.clientId}:${SPOTIFY_CONFIG.clientSecret}`).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: SPOTIFY_CONFIG.redirectUri
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for tokens: ${error}`);
  }

  return response.json();
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<SpotifyTokens> {
  const response = await fetch(`${SPOTIFY_ACCOUNTS_BASE}/api/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CONFIG.clientId}:${SPOTIFY_CONFIG.clientSecret}`).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  return response.json();
}

// Get current user profile
export async function getCurrentUser(accessToken: string): Promise<SpotifyUser> {
  const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get user profile: ${response.statusText}`);
  }

  return response.json();
}

// Search for tracks
export async function searchTracks(query: string, accessToken: string, limit: number = 20): Promise<SpotifyTrack[]> {
  const params = new URLSearchParams({
    q: query,
    type: 'track',
    limit: limit.toString(),
    market: 'BR' // Default to Brazil, can be made configurable
  });

  const response = await fetch(`${SPOTIFY_API_BASE}/search?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to search tracks: ${response.statusText}`);
  }

  const data: SpotifySearchResponse = await response.json();
  return data.tracks.items;
}

// Create a new playlist
export async function createPlaylist(
  userId: string,
  name: string,
  description: string,
  accessToken: string,
  isPublic: boolean = false
): Promise<{ id: string; uri: string; external_url: string }> {
  // Sanitize inputs
  const sanitizedName = name.substring(0, 100); // Spotify limit is 100 chars
  const sanitizedDescription = description.substring(0, 300); // Spotify limit is 300 chars
  
  console.log("🎵 Creating Spotify playlist with:");
  console.log("🎵 User ID:", userId);
  console.log("🎵 Name:", sanitizedName);
  console.log("🎵 Description:", sanitizedDescription);
  console.log("🎵 Public:", isPublic);
  
  const requestBody = {
    name: sanitizedName,
    description: sanitizedDescription,
    public: isPublic
  };
  
  console.log("🎵 Request body:", JSON.stringify(requestBody));
  
  const response = await fetch(`${SPOTIFY_API_BASE}/users/${userId}/playlists`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  console.log("🎵 Spotify API response status:", response.status);
  console.log("🎵 Spotify API response status text:", response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("🎵 Spotify API error response:", errorText);
    throw new Error(`Failed to create playlist: ${response.statusText} - ${errorText}`);
  }

  const playlist = await response.json();
  console.log("🎵 Spotify playlist created successfully:", playlist.id);
  
  return {
    id: playlist.id,
    uri: playlist.uri,
    external_url: playlist.external_urls.spotify
  };
}

// Add tracks to a playlist
export async function addTracksToPlaylist(
  playlistId: string,
  trackUris: string[],
  accessToken: string
): Promise<void> {
  const response = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      uris: trackUris
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to add tracks to playlist: ${response.statusText}`);
  }
}

// Get playlist details
export async function getPlaylist(playlistId: string, accessToken: string) {
  const response = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get playlist: ${response.statusText}`);
  }

  return response.json();
}

// Utility function to check if token is expired
export function isTokenExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt;
}

// Utility function to get track URIs from track IDs
export function getTrackUris(trackIds: string[]): string[] {
  return trackIds.map(id => `spotify:track:${id}`);
} 