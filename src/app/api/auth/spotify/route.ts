import { NextResponse } from 'next/server';
import { getSpotifyAuthUrl } from '@/lib/spotify/api';

export async function GET() {
  try {
    // Generate a random state for security
    const state = Math.random().toString(36).substring(2, 15);
    
    // Get the Spotify OAuth URL
    const authUrl = getSpotifyAuthUrl(state);
    
    console.log('🎵 Redirecting to Spotify OAuth:', authUrl);
    
    // Redirect to Spotify OAuth
    return NextResponse.redirect(authUrl);
    
  } catch (error) {
    console.error('❌ Error initiating Spotify OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Spotify OAuth' },
      { status: 500 }
    );
  }
} 