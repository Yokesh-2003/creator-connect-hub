
-- Function to increment view count
create or replace function increment_view_count(submission_id_param uuid)
returns void as $$
begin
  update submissions
  set view_count = view_count + 1
  where id = submission_id_param;
end; 
$$ language plpgsql;

-- Function to get leaderboard data
create or replace function get_leaderboard(campaign_id_param uuid)
returns table(creator_id uuid, total_views bigint) as $$
begin
  return query
  select s.creator_id, sum(s.view_count) as total_views
  from submissions s
  where s.campaign_id = campaign_id_param
  group by s.creator_id
  order by total_views desc;
end;
$$ language plpgsql;
