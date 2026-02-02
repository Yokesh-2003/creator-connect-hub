import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.ts'

interface Submission {
  campaign_id: string;
  post_url?: string;
  post_id?: string;
  social_account_id?: string;
  content_platform?: 'tiktok' | 'linkedin';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
        });
    }

    const {
        campaign_id,
        post_url,
        post_id,
        social_account_id,
        content_platform,
    }: Submission = await req.json();

    if (!campaign_id) {
      return new Response(JSON.stringify({ error: 'campaign_id is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    let submissionData: Omit<any, 'id' | 'created_at' | 'updated_at' | 'creator_id'> = {
        campaign_id,
        creator_id: user.id,
        status: 'pending',
    };

    if (post_url) {
      // Manual URL submission flow
      submissionData = { ...submissionData, post_url };
    } else if (post_id && social_account_id && content_platform) {
      // OAuth content picker flow
      submissionData = {
        ...submissionData,
        post_id,
        social_account_id,
        content_platform,
      };
    } else {
      return new Response(JSON.stringify({ error: 'Invalid submission payload. Provide either post_url or (post_id, social_account_id, content_platform).' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { data, error } = await supabaseAdmin
      .from('submissions')
      .insert(submissionData)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})