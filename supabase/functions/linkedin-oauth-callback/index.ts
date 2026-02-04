import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // ✅ CORS preflight (MANDATORY)
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // ✅ Robust auth header read
    const authHeader =
      req.headers.get("authorization") ??
      req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing auth header" }),
        { status: 200, headers: corsHeaders } // ✅ FORCE 2xx
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // ✅ Safe JSON parse
    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const { code } = body;

    if (!code) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing code" }),
        { status: 200, headers: corsHeaders } // ✅ FORCE 2xx
      );
    }

    // ✅ Validate user from token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid user" }),
        { status: 200, headers: corsHeaders } // ✅ FORCE 2xx
      );
    }

    // ✅ Save LinkedIn connection
    const { error: dbError } = await supabase
      .from("social_accounts")
      .upsert(
        {
          user_id: user.id,
          platform: "linkedin",
          username: "Connected",
          is_connected: true,
        },
        { onConflict: "user_id,platform" }
      );

    if (dbError) {
      return new Response(
        JSON.stringify({ success: false, error: dbError.message }),
        { status: 200, headers: corsHeaders } // ✅ FORCE 2xx
      );
    }

    // ✅ SUCCESS (ONLY TRUE SUCCESS)
    return new Response(
      JSON.stringify({ success: true, username: "Connected" }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 200, headers: corsHeaders } // ✅ FORCE 2xx
    );
  }
});