import { supabase } from "@/integrations/supabase/client";

/**
 * Environment variables
 */
const TIKTOK_CLIENT_ID = import.meta.env.VITE_TIKTOK_CLIENT_ID;
const TIKTOK_REDIRECT_URI =
  import.meta.env.VITE_TIKTOK_REDIRECT_URI ||
  `${window.location.origin}/auth/tiktok/callback`;

/**
 * Start TikTok OAuth (Login Kit v2)
 */
export function initiateTikTokOAuth(): void {
  if (!TIKTOK_CLIENT_ID) {
    throw new Error("TikTok Client ID is not configured");
  }

  // CSRF protection
  const state = crypto.randomUUID();
  sessionStorage.setItem("tiktok_oauth_state", state);

  const authUrl = new URL("https://www.tiktok.com/v2/auth/authorize");

  authUrl.searchParams.set("client_key", TIKTOK_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", TIKTOK_REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");

  // ✅ ONLY allowed scope
  authUrl.searchParams.set("scope", "user.info.basic");

  authUrl.searchParams.set("state", state);

  console.log("TikTok OAuth URL:", authUrl.toString());

  window.location.href = authUrl.toString();
}

/**
 * Handle TikTok OAuth callback
 */
export async function handleTikTokCallback(
  code: string,
  state: string
): Promise<{ success: boolean; error?: string }> {
  const storedState = sessionStorage.getItem("tiktok_oauth_state");

  if (!storedState || storedState !== state) {
    return { success: false, error: "Invalid OAuth state" };
  }

  sessionStorage.removeItem("tiktok_oauth_state");

  try {
    // Ensure user is logged in
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return { success: false, error: "User not authenticated" };
    }

    // Exchange code → token via Supabase Edge Function
    const { data, error } = await supabase.functions.invoke(
      "tiktok-oauth-callback",
      {
        body: {
          code,
          redirect_uri: TIKTOK_REDIRECT_URI,
        },
      }
    );

    if (error) {
      return { success: false, error: error.message };
    }

    // Save TikTok connection
    const { error: saveError } = await supabase
      .from("social_accounts")
      .upsert(
        {
          user_id: session.user.id,
          platform: "tiktok",
          platform_user_id: data.user_id || "",
          username: data.username || "",
          display_name: data.display_name || "",
          profile_url: data.profile_url || "",
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          token_expires_at: data.expires_at
            ? new Date(data.expires_at * 1000).toISOString()
            : null,
          is_connected: true,
        },
        { onConflict: "user_id,platform" }
      );

    if (saveError) {
      return { success: false, error: saveError.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Disconnect TikTok
 */
export async function disconnectTikTok(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return { success: false, error: "User not authenticated" };
    }

    const { error } = await supabase
      .from("social_accounts")
      .update({
        is_connected: false,
        access_token: null,
        refresh_token: null,
      })
      .eq("user_id", session.user.id)
      .eq("platform", "tiktok");

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
