import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const jwt = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: `Bearer ${jwt}` } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { platform, socialAccountId } = await req.json();
    if (!platform || !socialAccountId) {
      return new Response(
        JSON.stringify({ error: "platform and socialAccountId required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: account, error: accountError } = await supabase
      .from("social_accounts")
      .select("id, access_token, display_name, username, platform, user_id, platform_user_id")
      .eq("id", socialAccountId)
      .eq("user_id", user.id)
      .eq("is_connected", true)
      .single();

    if (accountError || !account?.access_token) {
      return new Response(
        JSON.stringify({ error: "Account not found or not connected" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const authorName = account.display_name || account.username || "Creator";

    if (platform === "tiktok") {
      // ... (existing tiktok logic)
    } else if (platform === "linkedin") {
      const res = await fetch(
        `https://api.linkedin.com/v2/shares?q=owners&owners=urn:li:person:${account.platform_user_id}&count=20`,
        {
          headers: {
            Authorization: `Bearer ${account.access_token}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
          },
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        return new Response(
          JSON.stringify({
            error: "Failed to fetch LinkedIn posts",
            details: errText,
          }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const json = await res.json();
      const posts = (json?.elements ?? []).map((p: any) => ({
        id: `li-${p.id}`,
        platform: "linkedin",
        type: "post",
        content: p.text?.text || "",
        thumbnail: p.content?.thumbnails?.[0]?.url,
        mediaUrl: `https://www.linkedin.com/feed/update/${p.id}`,
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0,
        createdAt: new Date(p.created?.time || Date.now()),
        author: { name: authorName, avatar: "" },
      }));

      return new Response(JSON.stringify({ posts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unsupported platform" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
