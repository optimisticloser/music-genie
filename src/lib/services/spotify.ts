import createClient from '@/lib/supabase/server';
import { refreshAccessToken, isTokenExpired } from '@/lib/spotify/api';
import { SpotifyTokens } from '@/types';

export class SpotifyService {
  private static async getSupabaseClient() {
    return await createClient();
  }

  // Get user's Spotify tokens from database
  static async getUserTokens(userId: string): Promise<SpotifyTokens | null> {
    const supabase = await this.getSupabaseClient();
    
    const { data: user, error } = await supabase
      .from('users')
      .select('spotify_access_token, spotify_refresh_token')
      .eq('id', userId)
      .single();

    if (error || !user) {
      console.error('Error fetching user Spotify tokens:', error);
      return null;
    }

    if (!user.spotify_access_token || !user.spotify_refresh_token) {
      return null;
    }

    return {
      access_token: user.spotify_access_token,
      refresh_token: user.spotify_refresh_token,
      expires_in: 3600, // Default expiry time
      token_type: 'Bearer',
      scope: ''
    };
  }

  // Get valid access token (refresh if needed)
  static async getValidAccessToken(userId: string): Promise<string | null> {
    const tokens = await this.getUserTokens(userId);
    
    if (!tokens) {
      return null;
    }

    // For now, we'll assume tokens are valid
    // In a production app, you'd store and check expiry times
    return tokens.access_token;
  }

  // Refresh user's Spotify tokens
  static async refreshUserTokens(userId: string): Promise<boolean> {
    const tokens = await this.getUserTokens(userId);
    
    if (!tokens) {
      return false;
    }

    try {
      const newTokens = await refreshAccessToken(tokens.refresh_token);
      
      const supabase = await this.getSupabaseClient();
      
      const { error } = await supabase
        .from('users')
        .update({
          spotify_access_token: newTokens.access_token,
          spotify_refresh_token: newTokens.refresh_token || tokens.refresh_token,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating refreshed tokens:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error refreshing Spotify tokens:', error);
      return false;
    }
  }

  // Check if user has Spotify connected
  static async isSpotifyConnected(userId: string): Promise<boolean> {
    const tokens = await this.getUserTokens(userId);
    return tokens !== null;
  }

  // Disconnect Spotify (remove tokens)
  static async disconnectSpotify(userId: string): Promise<boolean> {
    const supabase = await this.getSupabaseClient();
    
    const { error } = await supabase
      .from('users')
      .update({
        spotify_user_id: null,
        spotify_access_token: null,
        spotify_refresh_token: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error disconnecting Spotify:', error);
      return false;
    }

    return true;
  }
} 