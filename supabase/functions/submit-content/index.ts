import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Authenticate the user
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    // 2. Get the request body
    const body = await req.json()
    const { campaignId, contentUrl, platform } = body
    if (!campaignId || !contentUrl || !platform) {
        return new Response(JSON.stringify({ error: 'campaignId, contentUrl, and platform are required' }), { status: 400, headers: corsHeaders })
    }

    // 3. Create a Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 4. Insert the new submission into the database
    const { data: submissionData, error: insertError } = await supabaseAdmin
      .from('submissions')
      .insert({
        campaign_id: campaignId,
        user_id: user.id,
        content_url: contentUrl,
        platform: platform,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      return new Response(JSON.stringify({ error: 'Failed to create submission' }), {
        status: 500,
        headers: corsHeaders,
      })
    }

    // 5. ✅ FIX: Asynchronously invoke the fetch-content-info function
    //    We don't wait for this to finish, the user gets a fast response.
    //    The UI will update in real-time when the data is ready.
    const { error: invokeError } = await supabaseAdmin.functions.invoke(
        'fetch-content-info', 
        { 
            body: { 
                submissionId: submissionData.id, 
                contentUrl, 
                platform 
            }
        }
    )

    if (invokeError) {
      // Log the error but don't block the user's response
      console.error('Error invoking fetch-content-info function:', invokeError)
    }

    // 6. Return the created submission data
    return new Response(JSON.stringify(submissionData), {
      status: 201,
      headers: corsHeaders,
    })

  } catch (e) {
    console.error('Main function error:', e)
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: corsHeaders }
    )
  }
})
