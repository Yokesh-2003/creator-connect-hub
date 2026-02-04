import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Read auth header
    const authHeader =
      req.headers.get("authorization") ??
      req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing auth header" }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Create Supabase client with SERVICE ROLE
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Parse body
    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const { code } = body;

    if (!code) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing code" }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Validate logged-in user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid user" }),
        { status: 200, headers: corsHeaders }
      );
    }

    // 🔑 Exchange LinkedIn code → access token
    const tokenRes = await fetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: Deno.env.get("LINKEDIN_REDIRECT_URI")!,
          client_id: Deno.env.get("LINKEDIN_CLIENT_ID")!,
          client_secret: Deno.env.get("LINKEDIN_CLIENT_SECRET")!,
        }),
      }
    );

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "LinkedIn token exchange failed",
          tokenData,
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Save connection
    const { error: dbError } = await supabase
      .from("social_accounts")
      .upsert(
        {
          user_id: user.id,
          platform: "linkedin",
          username: "Connected",
          access_token: tokenData.access_token,
          is_connected: true,
        },
        { onConflict: "user_id,platform" }
      );

    if (dbError) {
      return new Response(
        JSON.stringify({ success: false, error: dbError.message }),
        { status: 200, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 200, headers: corsHeaders }
    );
  }
});
