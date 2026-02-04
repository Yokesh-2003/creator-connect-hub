import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader =
      req.headers.get("authorization") ??
      req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing auth header" }),
        { headers: corsHeaders }
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

    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const { code } = body;

    if (!code) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing code" }),
        { headers: corsHeaders }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid user" }),
        { headers: corsHeaders }
      );
    }

    const { error: dbError } = await supabase
      .from("social_accounts")
      .upsert(
        {
          user_id: user.id,
          platform: "linkedin",
          is_connected: true,
          username: "LinkedIn",
        },
        { onConflict: "user_id,platform" }
      );

    if (dbError) {
      return new Response(
        JSON.stringify({ success: false, error: dbError.message }),
        { headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { headers: corsHeaders }
    );
  }
});
