import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { exchangeCodeForTokens, getCurrentUser } from '@/lib/spotify/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  console.log('🎵 Spotify OAuth callback:', { code: !!code, error, state });

  if (error) {
    console.error('❌ Spotify OAuth error:', error);
    return NextResponse.redirect(new URL('/auth/auth-code-error?error=spotify_oauth&description=' + error, request.url));
  }

  if (!code) {
    console.error('❌ No code provided in Spotify callback');
    return NextResponse.redirect(new URL('/auth/auth-code-error?error=no_code', request.url));
  }

  try {
    const cookieStore = await cookies();
    
    const supabaseClient = createServerClient(
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
              console.error('Error setting cookies:', error);
            }
          },
        },
      }
    );

    // Get current user session
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ No authenticated user found');
      return NextResponse.redirect(new URL('/login?error=no_user', request.url));
    }

    console.log('✅ User authenticated:', user.email);

    // Exchange code for Spotify tokens
    const spotifyTokens = await exchangeCodeForTokens(code);
    console.log('✅ Spotify tokens obtained');

    // Get Spotify user profile
    const spotifyUser = await getCurrentUser(spotifyTokens.access_token);
    console.log('✅ Spotify user profile obtained:', spotifyUser.display_name);

    // Update user record with Spotify information
    const { error: updateError } = await supabaseClient
      .from('users')
      .update({
        spotify_user_id: spotifyUser.id,
        spotify_access_token: spotifyTokens.access_token,
        spotify_refresh_token: spotifyTokens.refresh_token,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Error updating user with Spotify data:', updateError);
      return NextResponse.redirect(new URL('/auth/auth-code-error?error=update_failed', request.url));
    }

    console.log('✅ User updated with Spotify data');

    // Redirect to dashboard with success
    return NextResponse.redirect(new URL('/dashboard?spotify_connected=true', request.url));

  } catch (error) {
    console.error('❌ Unexpected error in Spotify callback:', error);
    return NextResponse.redirect(new URL('/auth/auth-code-error?error=unexpected', request.url));
  }
} 