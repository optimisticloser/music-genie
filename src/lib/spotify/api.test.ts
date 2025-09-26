import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const spotifyApiModulePath = './api';

// Utility to load the module fresh for each test so environment variables are applied
async function loadSpotifyApi() {
  vi.resetModules();
  return import(spotifyApiModulePath);
}

describe('getSpotifyAuthUrl', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? 'test-client-id';
    process.env.SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET ?? 'test-client-secret';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  it('falls back to the default redirect URI when SPOTIFY_REDIRECT_URI is not set', async () => {
    delete process.env.SPOTIFY_REDIRECT_URI;

    const { getSpotifyAuthUrl } = await loadSpotifyApi();
    const url = getSpotifyAuthUrl();
    const parsedUrl = new URL(url);

    expect(parsedUrl.origin + parsedUrl.pathname).toBe('https://accounts.spotify.com/authorize');
    expect(parsedUrl.searchParams.get('redirect_uri')).toBe('http://localhost:3000/api/auth/spotify/callback');
  });
});
