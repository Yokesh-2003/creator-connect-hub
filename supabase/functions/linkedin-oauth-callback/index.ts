import { serve } from "https/deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { corsHeaders } from "../_shared/cors.ts";

const LINKEDIN_CLIENT_ID = Deno.env.get("LINKEDIN_CLIENT_ID")!;
const LINKEDIN_CLIENT_SECRET = Deno.env.get("LINKEDIN_CLIENT_SECRET")!;
const LINKEDIN_REDIRECT_URI = Deno.env.get("LINKEDIN_REDIRECT_URI")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code) {
      return new Response(JSON.stringify({ error: "No code provided" }), { status: 400 });
    }

    const decodedState = JSON.parse(atob(state));
    const userId = decodedState.user_id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Invalid state" }), { status: 400 });
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
      return new Response(JSON.stringify({ error: "Failed to fetch access token" }), { status: 500 });
    }

    const { access_token, expires_in, refresh_token, refresh_token_expires_in, scope } = tokenData;

    const userRes = await fetch("https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const userData = await userRes.json();
    const { id, localizedFirstName, localizedLastName, profilePicture } = userData;

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { error } = await supabase.from("social_accounts").upsert([
      {
        user_id: userId,
        platform: "linkedin",
        platform_user_id: id,
        username: `${localizedFirstName} ${localizedLastName}`,
        display_name: `${localizedFirstName} ${localizedLastName}`,
        avatar_url: profilePicture?.["displayImage~"]?.elements?.[0]?.identifiers?.[0]?.identifier,
        access_token: access_token,
        refresh_token: refresh_token,
        scopes: scope.split(","),
        expires_at: new Date(Date.now() + expires_in * 1000),
        refresh_token_expires_at: new Date(Date.now() + refresh_token_expires_in * 1000),
        is_connected: true,
      },
    ], { onConflict: "user_id, platform" });

    if (error) {
      console.error("Supabase error:", error);
      return new Response(JSON.stringify({ error: "Failed to save connection" }), { status: 500 });
    }

    return new Response("<script>window.close();</script>", { headers: { "Content-Type": "text/html" } });
  } catch (err) {
    console.error("linkedin-oauth-callback error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
