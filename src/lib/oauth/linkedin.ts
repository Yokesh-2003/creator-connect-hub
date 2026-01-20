import { supabase } from "@/integrations/supabase/client";

const CLIENT_ID = import.meta.env.VITE_LINKEDIN_CLIENT_ID!;
const REDIRECT_URI = import.meta.env.VITE_LINKEDIN_REDIRECT_URI!;

/**
 * Start LinkedIn OAuth
 */
export function initiateLinkedInOAuth() {
  // ✅ Browser-safe UUID (fixes Vercel build)
  const state = window.crypto.randomUUID();
  sessionStorage.setItem("linkedin_oauth_state", state);

  const authUrl =
    "https://www.linkedin.com/oauth/v2/authorization" +
    "?response_type=code" +
    "&client_id=" + CLIENT_ID +
    "&redirect_uri=" + encodeURIComponent(REDIRECT_URI) +
    "&state=" + state +
    "&scope=" + encodeURIComponent("openid profile email");

  window.location.assign(authUrl);
}

/**
 * Handle LinkedIn OAuth callback
 */
export async function handleLinkedInCallback(
  code: string,
  state: string
): Promise<{ success: boolean; error?: string }> {
  console.log(" LinkedIn callback started");

  const storedState = sessionStorage.getItem("linkedin_oauth_state");
  if (!storedState || storedState !== state) {
    console.error("❌ Invalid OAuth state");
    return { success: false, error: "Invalid OAuth state" };
  }

  sessionStorage.removeItem("linkedin_oauth_state");

  // ✅ Get session ONCE
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    console.error("❌ User not authenticated");
    return { success: false, error: "User not authenticated" };
  }

  console.log("✅ User authenticated:", session.user.id);

  // ✅ Call Edge Function (auth handled there)
  const { data, error } = await supabase.functions.invoke(
    "linkedin-oauth-callback",
    {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: { code },
    }
  );

  // ❌ Supabase throws error ONLY if non-2xx
  if (error) {
    console.error("❌ Edge Function error:", error);
    return { success: false, error: error.message };
  }

  // ❌ Business error returned from backend
  if (!data?.success) {
    console.error("❌ LinkedIn connect failed:", data?.error);
    return { success: false, error: data?.error || "Connection failed" };
  }

  console.log("✅ LinkedIn connected successfully");
  return { success: true };
}

/**
 * Disconnect LinkedIn
 */
export async function disconnectLinkedIn() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("social_accounts")
    .update({ is_connected: false })
    .eq("user_id", session.user.id)
    .eq("platform", "linkedin");

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
