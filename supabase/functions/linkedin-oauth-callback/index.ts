import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function getUserIdFromJwt(authHeader: string): string | null {
  try {
    const token = authHeader.replace("Bearer ", "");
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader =
      req.headers.get("authorization") ??
      req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing auth header" }),
        { status: 200, headers: corsHeaders }
      );
    }

    const userId = getUserIdFromJwt(authHeader);

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JWT" }),
        { status: 200, headers: corsHeaders }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    if (!body.code) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing code" }),
        { status: 200, headers: corsHeaders }
      );
    }

    const { error } = await supabase
      .from("social_accounts")
      .upsert(
        {
          user_id: userId,
          platform: "linkedin",
          username: "Connected",
          is_connected: true,
        },
        { onConflict: "user_id,platform" }
      );

    if (error) {
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
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
//