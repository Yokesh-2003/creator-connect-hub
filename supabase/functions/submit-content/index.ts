
// supabase/functions/submit-content/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// The payload now matches the fields sent from the frontend
interface SubmissionPayload {
  campaign_id: string;
  content_url: string;
  platform: 'tiktok' | 'linkedin';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log("submit-content POST invoked", {
    hasAuthHeader: !!req.headers.get("authorization"),
  });

  try {
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: {
            authorization: req.headers.get("authorization")!,
          },
        },
      }
    );

    const { data: { user }, error: userError } =
      await supabaseUser.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: SubmissionPayload = await req.json();
    const { campaign_id, content_url, platform } = payload;

    if (!campaign_id || !content_url || !platform) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const dataToInsert = {
      campaign_id,
      user_id: user.id,
      content_url,
      content_platform: platform,
    };
    
    console.log("Submitting content", {
      campaign_id,
      user_id: user.id,
      content_url,
      platform
    });

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data, error } = await supabaseAdmin
      .from('submissions')
      .insert(dataToInsert)
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (e) {
    console.error('An unexpected error occurred:', e);
    const errorMessage = e instanceof Error ? e.message : 'An internal server error occurred.';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
