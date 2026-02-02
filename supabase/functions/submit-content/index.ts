
// supabase/functions/submit-content/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface ManualSubmission {
  campaign_id: string;
  post_url: string;
}

interface OAuthSubmission {
  campaign_id: string;
  post_id: string;
  social_account_id: string;
  content_platform: 'tiktok' | 'linkedin';
}

type SubmissionPayload = ManualSubmission | OAuthSubmission;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize the Supabase client with the SERVICE_ROLE_KEY
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the user from the session
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      console.error('Auth Error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid or missing token.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload: SubmissionPayload = await req.json()
    console.log('Edge Function `submit-content` received payload:', JSON.stringify(payload, null, 2));

    const { campaign_id } = payload;
    if (!campaign_id) {
      return new Response(JSON.stringify({ error: '`campaign_id` is a required field.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }

    let post_url: string | null = null;
    let post_id: string | null = null;
    let social_account_id: string | null = null;
    let content_platform: 'tiktok' | 'linkedin' | null = null;

    if ('post_url' in payload && typeof payload.post_url === 'string') {
      post_url = payload.post_url;
      // Basic URL validation
      try {
        const url = new URL(post_url);
        if (url.protocol !== 'https' && url.protocol !== 'http:') {
          throw new Error('Invalid protocol');
        }
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid post_url format.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    if (
      'post_id' in payload &&
      'social_account_id' in payload &&
      'content_platform' in payload
    ) {
      post_id = payload.post_id;
      social_account_id = payload.social_account_id;
      content_platform = payload.content_platform;
    }

    if (!post_url && !post_id) {
      return new Response(JSON.stringify({
        error: 'Invalid payload. Provide either a valid post_url or the required fields for an OAuth submission.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const dataToInsert = {
      campaign_id,
      creator_id: user.id,
      post_url,
      post_id,
      social_account_id,
      content_platform,
      status: 'pending',
    };

    console.log('Attempting to insert normalized payload:', dataToInsert);

    const { data, error: insertError } = await supabaseClient
      .from('submissions')
      .insert(dataToInsert)
      .select()
      .single()

    if (insertError) {
      console.error('Supabase Insert Error:', insertError);
      return new Response(JSON.stringify({ error: `Database error: ${insertError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Successfully inserted:', data);

    return new Response(JSON.stringify(data), {
      status: 201, // Use 201 for resource creation
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (e) {
    console.error('An unexpected error occurred:', e);
    // Sanitize the error message for the client
    const errorMessage = e instanceof Error ? e.message : 'An internal server error occurred.';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
