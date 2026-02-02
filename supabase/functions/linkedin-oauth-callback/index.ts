// supabase/functions/linkedin-oauth-callback/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Missing auth");

    const { code } = await req.json();
    if (!code) throw new Error("Missing code");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const tokenRes = await fetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: Deno.env.get("LINKEDIN_CLIENT_ID")!,
          client_secret: Deno.env.get("LINKEDIN_CLIENT_SECRET")!,
          redirect_uri: Deno.env.get("LINKEDIN_REDIRECT_URI")!,
        }),
      }
    );

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(JSON.stringify(tokenData));

    await supabase.from("social_accounts").upsert(
      {
        user_id: user.id,
        platform: "linkedin",
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        is_connected: true,
      },
      { onConflict: "user_id,platform" }
    );

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
});
