import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0?target=deno";
import { corsHeaders } from "../_shared/cors.ts";

const TIKTOK_CLIENT_ID = Deno.env.get("TIKTOK_CLIENT_ID")!;
const TIKTOK_CLIENT_SECRET = Deno.env.get("TIKTOK_CLIENT_SECRET")!;
const TIKTOK_REDIRECT_URI = Deno.env.get("TIKTOK_REDIRECT_URI")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code) {
      return new Response(JSON.stringify({ error: "No code provided" }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const decodedState = JSON.parse(atob(state || ""));
    const userId = decodedState.user_id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Invalid state" }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const tokenUrl = `https://open.tiktokapis.com/v2/oauth/token/`;
    const params = new URLSearchParams();
    params.append("client_key", TIKTOK_CLIENT_ID);
    params.append("client_secret", TIKTOK_CLIENT_SECRET);
    params.append("code", code);
    params.append("grant_type", "authorization_code");
    params.append("redirect_uri", TIKTOK_REDIRECT_URI);

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("Token error:", tokenData);
      return new Response(JSON.stringify({ error: "Failed to fetch access token" }), { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { access_token, open_id, refresh_token, expires_in } = tokenData;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!, 
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase.from("social_accounts").upsert([
      {
        user_id: userId,
        platform: "tiktok",
        platform_user_id: open_id,
        username: "",
        display_name: "",
        profile_url: `https://www.tiktok.com/@${open_id}`,
        access_token: access_token,
        refresh_token: refresh_token || null,
        token_expires_at: expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null,
        is_connected: true,
      },
    ], { onConflict: "user_id,platform" });

    if (error) {
      console.error("Supabase error:", error);
      return new Response(JSON.stringify({ error: "Failed to save connection" }), { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response("<script>window.close();</script>", { 
      headers: { "Content-Type": "text/html" } 
    });
  } catch (err) {
    console.error("tiktok-oauth-callback error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
