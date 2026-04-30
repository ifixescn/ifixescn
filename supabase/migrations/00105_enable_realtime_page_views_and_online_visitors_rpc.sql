
-- 1. Enable Realtime for page_views table
ALTER PUBLICATION supabase_realtime ADD TABLE page_views;

-- 2. Create get_online_visitors RPC
-- Returns active visitor count and their current page details (last 5 minutes)
CREATE OR REPLACE FUNCTION get_online_visitors(p_minutes integer DEFAULT 5)
RETURNS TABLE (
  visitor_id    text,
  session_id    text,
  page_url      text,
  page_title    text,
  ip_address    text,
  country       text,
  country_code  text,
  city          text,
  device_type   text,
  browser       text,
  os            text,
  isp           text,
  last_seen     timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- 取每个访客在时间窗口内的最新一条访问记录
  SELECT DISTINCT ON (pv.visitor_id)
    pv.visitor_id,
    pv.session_id,
    pv.page_url,
    pv.page_title,
    pv.ip_address,
    pv.country,
    pv.country_code,
    pv.city,
    pv.device_type,
    pv.browser,
    pv.os,
    pv.isp,
    pv.created_at AS last_seen
  FROM page_views pv
  WHERE pv.created_at >= (NOW() - (p_minutes || ' minutes')::interval)
  ORDER BY pv.visitor_id, pv.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_online_visitors(integer) TO anon, authenticated;
