CREATE OR REPLACE FUNCTION get_campaign_submissions(campaign_id_param UUID)
RETURNS TABLE (id UUID, content_url TEXT, view_count BIGINT, created_at TIMESTAMPTZ, creator_name TEXT, avatar_url TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.content_url,
        s.view_count,
        s.created_at,
        p.username AS creator_name,
        p.avatar_url
    FROM 
        submissions s
    LEFT JOIN 
        profiles p ON s.user_id = p.id
    WHERE 
        s.campaign_id = campaign_id_param
    ORDER BY
        s.view_count DESC, p.username ASC;
END; 
$$;
