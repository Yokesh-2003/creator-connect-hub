/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  try {
    const url = new URL(req.url);

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    const FRONTEND_URL = Deno.env.get("FRONTEND_URL");

    if (!FRONTEND_URL) {
      return new Response(
        JSON.stringify({ error: "FRONTEND_URL not set" }),
        { status: 500 }
      );
    }

    console.log("TikTok OAuth Callback");
    console.log("Code:", code);
    console.log("State:", state);
    console.log("Error:", error);

    // ❌ User denied or TikTok error
    if (error) {
      return Response.redirect(
        `${FRONTEND_URL}/dashboard?connected=tiktok&state=${encodeURIComponent(state ?? "")}`,
        302
      );

    }

    // ❌ Missing required params
    if (!code || !state) {
      return Response.redirect(
        `${FRONTEND_URL}/dashboard?error=missing_code_or_state`,
        302
      );
    }

    /**
     * ✅ IMPORTANT:
     * State is already validated on frontend (localStorage).
     * Backend only forwards success.
     */

     return Response.redirect(
    `${FRONTEND_URL}/dashboard?connected=tiktok&state=${state}`,
    302
  );

  } catch (err) {
    console.error("TikTok OAuth Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
});
