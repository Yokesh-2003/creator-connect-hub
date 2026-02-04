import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 })
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    )

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const body = await req.json()

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data, error } = await supabaseAdmin
      .from('submissions')
      .insert({
        campaign_id: body.campaign_id,
        user_id: user.id,          // ✅ FIX
        content_url: body.content_url,
        platform: body.platform,
      })
      .select()
      .single()

    if (error) {
      return new Response(JSON.stringify(error), {
        status: 400,
        headers: corsHeaders,
      })
    }

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: corsHeaders,
    })
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: corsHeaders }
    )
  }
})
