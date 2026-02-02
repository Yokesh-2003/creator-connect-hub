import { serve } from "https/deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const TIKTOK_CLIENT_ID = Deno.env.get("TIKTOK_CLIENT_ID")!;
const TIKTOK_CLIENT_SECRET = Deno.env.get("TIKTOK_CLIENT_SECRET")!;
const TIKTOK_REDIRECT_URI = Deno.env.get("TIKTOK_REDIRECT_URI")!;

serve(async (req) => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response(JSON.stringify({ error: "No code provided" }), { status: 400 });
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
    body: params,
  });
  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    return new Response(JSON.stringify({ error: "Failed to fetch access token" }), { status: 500 });
  }

  const { access_token, open_id, refresh_token, scope } = tokenData;

  const { data: { user } } = await supabase.auth.getUser(req.headers.get("Authorization"));

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { error } = await supabase.from("oauth_connections").upsert([
    {
      user_id: user.id,
      provider: "tiktok",
      provider_user_id: open_id,
      access_token: access_token,
      refresh_token: refresh_token,
      scopes: scope.split(","),
    },
  ]);

  if (error) {
    return new Response(JSON.stringify({ error: "Failed to save connection" }), { status: 500 });
  }

  return new Response("<script>window.close();</script>", { headers: { "Content-Type": "text/html" } });
});
