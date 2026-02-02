import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.ts'

// Define the shape of the incoming request body for validation.
interface SubmissionPayload {
  campaign_id: string;
  social_account_id?: string;
  post_url?: string;
  post_id?: string;
  content_platform?: 'tiktok' | 'linkedin';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Initialize the Admin client to safely verify the user and perform the insert.
    // This securely bypasses RLS for the write operation, but we will embed the
    // user's ID to enable RLS for future reads and updates by the user.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Authenticate the user by verifying the JWT from the Authorization header.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Parse and validate the incoming payload.
    const payload: SubmissionPayload = await req.json()
    const { campaign_id, post_url, post_id, social_account_id, content_platform } = payload;

    if (!campaign_id) {
      return new Response(JSON.stringify({ error: '`campaign_id` is a required field.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }
    if (!post_url && !post_id) {
      return new Response(JSON.stringify({ error: 'Either `post_url` or `post_id` must be provided.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }

    // 4. Construct the final data object for insertion into the clean schema.
    const submissionData = {
      campaign_id,
      creator_id: user.id, // CRITICAL: Attribute the submission to the authenticated user.
      post_url: post_url ?? null,
      post_id: post_id ?? null,
      social_account_id: social_account_id ?? null,
      content_platform: content_platform ?? null,
      status: 'pending' // Default status
    };

    // 5. Perform the insert using the admin client.
    const { data, error: insertError } = await supabaseAdmin
      .from('submissions')
      .insert(submissionData)
      .select()
      .single()

    if (insertError) {
      // This will now provide a meaningful database error instead of silent failure.
      console.error('Database Insert Error:', insertError);
      return new Response(JSON.stringify({ error: `Database error: ${insertError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 6. Return the newly created submission record.
    return new Response(JSON.stringify(data), {
      status: 201, // 201 Created
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})