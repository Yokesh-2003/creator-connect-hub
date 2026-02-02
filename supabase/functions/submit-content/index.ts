import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Create a Supabase client with the user's auth token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 2. Get the user from the token
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid JWT.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // 3. Get the payload from the request
    const {
        campaign_id,
        post_url,
        post_id,
        content_platform
    }: {
        campaign_id: string;
        post_url?: string;
        post_id?: string;
        content_platform?: 'tiktok' | 'linkedin';
    } = await req.json();

    // 4. Validate the payload
    if (!campaign_id) {
      return new Response(JSON.stringify({ error: '`campaign_id` is required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 5. Perform the insert using the user-authenticated client and the correct payload shape
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        campaign_id,
        post_url: post_url ?? null,
        post_id: post_id ?? null,
        content_platform: content_platform ?? null,
        platform: content_platform ?? null,
        submitter_name: user.email ?? user.id,
      })
      .select()
      .single();

    // 6. Handle potential errors
    if (error) {
      console.error('Database insert failed:', error);
      return new Response(JSON.stringify({ error: `Database error: ${error.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // 7. Return the successful response
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
