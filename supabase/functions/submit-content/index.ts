
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { corsHeaders } from "../_shared/cors.ts";

const TIKTOK_URL_REGEX = /tiktok\.com\/.*\/video\/(\d+)/;
const LINKEDIN_URL_REGEX = /linkedin\.com\/feed\/update\/(urn:li:.+)/;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { campaignId, url } = await req.json();
    if (!campaignId || !url) {
      throw new Error("campaignId and url are required.");
    }

    let platform: string;
    let platformContentId: string;

    const tiktokMatch = url.match(TIKTOK_URL_REGEX);
    const linkedinMatch = url.match(LINKEDIN_URL_REGEX);

    if (tiktokMatch) {
      platform = "tiktok";
      platformContentId = `tk-${tiktokMatch[1]}`;
    } else if (linkedinMatch) {
      platform = "linkedin";
      const urn = linkedinMatch[1].split('?')[0];
      platformContentId = `li-${urn}`;
    } else {
      throw new Error("Invalid URL. Only TikTok and LinkedIn post URLs are supported.");
    }
    
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from("campaigns")
      .select("id, platform, start_date, end_date")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error("Campaign not found.");
    }
    if (campaign.platform !== platform) {
      throw new Error(`This campaign only accepts ${campaign.platform} submissions.`);
    }

    const { data: existingSubmission, error: existingSubmissionError } = await supabaseAdmin
        .from('submissions')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id)
        .eq('platform_content_id', platformContentId)
        .single();
        
    if(existingSubmission) {
        throw new Error("You have already submitted this content for this campaign.")
    }

    const { data: submission, error: submissionError } = await supabaseAdmin
      .from("submissions")
      .insert({
        campaign_id: campaignId,
        user_id: user.id,
        platform,
        platform_content_id: platformContentId,
        content_url: url,
        engagement_snapshot: {},
      })
      .select()
      .single();

    if (submissionError) {
      throw submissionError;
    }

    return new Response(JSON.stringify(submission), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
