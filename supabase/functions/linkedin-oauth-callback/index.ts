import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { corsHeaders } from "../_shared/cors.ts";

const LINKEDIN_CLIENT_ID = Deno.env.get("LINKEDIN_CLIENT_ID")!;
const LINKEDIN_CLIENT_SECRET = Deno.env.get("LINKEDIN_CLIENT_SECRET")!;
const LINKEDIN_REDIRECT_URI = Deno.env.get("LINKEDIN_REDIRECT_URI")!;

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

    const tokenUrl = "https://www.linkedin.com/oauth/v2/accessToken";
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", LINKEDIN_REDIRECT_URI);
    params.append("client_id", LINKEDIN_CLIENT_ID);
    params.append("client_secret", LINKEDIN_CLIENT_SECRET);

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

    const { access_token, expires_in, refresh_token } = tokenData;

    const userRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const userData = await userRes.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!, 
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase.from("social_accounts").upsert([
      {
        user_id: userId,
        platform: "linkedin",
        platform_user_id: userData.sub,
        username: userData.name,
        display_name: userData.name,
        profile_url: `https://www.linkedin.com/in/${userData.sub}`,
        access_token: access_token,
        refresh_token: refresh_token || null,
        token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
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
    console.error("linkedin-oauth-callback error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
