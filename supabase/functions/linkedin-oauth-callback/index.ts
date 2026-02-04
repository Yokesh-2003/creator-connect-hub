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

    // 🔑 Create admin client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 🔑 Extract user from JWT manually
    const jwt = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: jwtError,
    } = await supabase.auth.getUser(jwt);

    if (jwtError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid user token" }),
        { headers: corsHeaders }
      );
    }

    console.log("LinkedIn user:", user.id);

    // ✅ UPSERT social account
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
      console.error("DB error:", dbError.message);
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
    console.error(err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { headers: corsHeaders }
    );
  }
});
