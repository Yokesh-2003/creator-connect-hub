// Supabase Edge Function for TikTok OAuth callback
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TIKTOK_CLIENT_ID = Deno.env.get('TIKTOK_CLIENT_ID') || '';
const TIKTOK_CLIENT_SECRET = Deno.env.get('TIKTOK_CLIENT_SECRET') || '';
const TIKTOK_REDIRECT_URI = Deno.env.get('TIKTOK_REDIRECT_URI') || '';

serve(async (req) => {
  try {
    const { code, redirect_uri, code_verifier } = await req.json();

    if (!code) {
      return new Response(JSON.stringify({ error: 'Missing authorization code' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Prepare token exchange parameters
    const tokenParams: Record<string, string> = {
      client_key: TIKTOK_CLIENT_ID,
      client_secret: TIKTOK_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirect_uri || TIKTOK_REDIRECT_URI,
    };

    // Add code_verifier for PKCE if provided
    if (code_verifier) {
      tokenParams.code_verifier = code_verifier;
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenParams),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      return new Response(JSON.stringify({ error: 'Failed to exchange token', details: errorData }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const tokenData = await tokenResponse.json();

    // Get user info
    const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    let userData = { user_id: '', username: '', display_name: '', profile_url: '' };
    if (userResponse.ok) {
      const userInfo = await userResponse.json();
      userData = {
        user_id: userInfo.data?.user?.open_id || '',
        username: userInfo.data?.user?.open_id || '',
        display_name: userInfo.data?.user?.display_name || '',
        profile_url: userInfo.data?.user?.avatar_url || '',
      };
    }

    return new Response(
      JSON.stringify({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_in ? Date.now() / 1000 + tokenData.expires_in : null,
        ...userData,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
