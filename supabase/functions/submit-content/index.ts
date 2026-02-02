import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid JWT.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const payload: {
        campaign_id: string;
        post_url?: string;
        post_id?: string;
        social_account_id?: string;
        content_platform?: 'tiktok' | 'linkedin';
    } = await req.json();

    if (!payload.campaign_id) {
      return new Response(JSON.stringify({ error: '`campaign_id` is required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    let insertData;
    
    // Manual URL Submission Flow
    if (payload.post_url) {
      insertData = {
        campaign_id: payload.campaign_id,
        creator_id: user.id,
        post_url: payload.post_url,
        status: 'pending',
      };
    } 
    // OAuth Picker Submission Flow
    else if (payload.post_id && payload.social_account_id && payload.content_platform) {
      insertData = {
        campaign_id: payload.campaign_id,
        creator_id: user.id,
        post_id: payload.post_id,
        social_account_id: payload.social_account_id,
        content_platform: payload.content_platform,
        status: 'pending',
      };
    } 
    // Invalid Payload
    else {
      return new Response(JSON.stringify({ error: 'Invalid payload. Provide either `post_url` or the set `post_id`, `social_account_id`, and `content_platform`.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data, error } = await supabaseAdmin
      .from('submissions')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: `Database error: ${error.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: `Server error: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
