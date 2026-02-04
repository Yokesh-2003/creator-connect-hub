CREATE OR REPLACE FUNCTION get_campaign_submissions(campaign_id_param UUID)
RETURNS TABLE (
    id UUID,
    campaign_id UUID,
    user_id UUID,
    content_url TEXT,
    platform TEXT,
    video_id TEXT,
    view_count BIGINT,
    like_count BIGINT,
    comment_count BIGINT,
    created_at TIMESTAMPTZ,
    username TEXT,
    avatar_url TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.campaign_id,
        s.user_id,
        s.content_url,
        s.platform,
        s.video_id,
        s.view_count,
        s.like_count,
        s.comment_count,
        s.created_at,
        p.username,
        p.avatar_url
    FROM 
        submissions s
    LEFT JOIN 
        profiles p ON s.user_id = p.id
    WHERE 
        s.campaign_id = campaign_id_param
    ORDER BY
        s.created_at DESC;
END; 
$$;
