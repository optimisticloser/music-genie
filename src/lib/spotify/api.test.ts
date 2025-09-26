import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

const ORIGINAL_ENV = { ...process.env };

let cachedModule: typeof import('./api') | undefined;

const loadSpotifyApi = async () => {
  if (!cachedModule) {
    cachedModule = await import('./api');
  }

  return cachedModule;
};

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  process.env.SPOTIFY_CLIENT_ID = 'test-client-id';
  process.env.SPOTIFY_CLIENT_SECRET = 'test-client-secret';
  process.env.SPOTIFY_REDIRECT_URI = 'https://example.com/callback';
});

afterEach(() => {
  cachedModule = undefined;
  process.env = { ...ORIGINAL_ENV };
});

describe('getSpotifyAuthUrl', () => {
  it('gera URL com parâmetros obrigatórios e escopos padrão', async () => {
    const { getSpotifyAuthUrl, SPOTIFY_CONFIG } = await loadSpotifyApi();

    const url = new URL(getSpotifyAuthUrl());

    assert.equal(url.origin, 'https://accounts.spotify.com');
    assert.equal(url.pathname, '/authorize');

    const params = url.searchParams;
    assert.equal(params.get('client_id'), 'test-client-id');
    assert.equal(params.get('response_type'), 'code');
    assert.equal(params.get('redirect_uri'), 'https://example.com/callback');
    assert.equal(params.get('scope'), SPOTIFY_CONFIG.scopes);
    assert.equal(params.get('show_dialog'), 'true');
    assert.equal(params.has('state'), false);
  });

  it('anexa parâmetro state quando informado', async () => {
    const { getSpotifyAuthUrl } = await loadSpotifyApi();

    const url = new URL(getSpotifyAuthUrl('custom-state'));
    assert.equal(url.searchParams.get('state'), 'custom-state');
  });
});
