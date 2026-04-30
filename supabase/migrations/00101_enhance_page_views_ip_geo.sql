-- 添加 ISP 和国家代码字段
ALTER TABLE page_views ADD COLUMN isp text;
ALTER TABLE page_views ADD COLUMN country_code text;

-- 更新 record_page_view 函数以接受新字段
CREATE OR REPLACE FUNCTION record_page_view(
  p_visitor_id text,
  p_session_id text,
  p_page_url text,
  p_page_title text DEFAULT NULL,
  p_referrer text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_device_type text DEFAULT NULL,
  p_browser text DEFAULT NULL,
  p_os text DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_region text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_isp text DEFAULT NULL,
  p_country_code text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_view_id uuid;
BEGIN
  INSERT INTO page_views (
    visitor_id, session_id, page_url, page_title, referrer,
    user_agent, device_type, browser, os,
    ip_address, country, region, city, isp, country_code
  ) VALUES (
    p_visitor_id, p_session_id, p_page_url, p_page_title, p_referrer,
    p_user_agent, p_device_type, p_browser, p_os,
    p_ip_address, p_country, p_region, p_city, p_isp, p_country_code
  ) RETURNING id INTO v_view_id;

  -- 更新访客会话表
  INSERT INTO visitor_sessions (visitor_id, last_visit, visit_count)
  VALUES (p_visitor_id, now(), 1)
  ON CONFLICT (visitor_id)
  DO UPDATE SET
    last_visit = now(),
    visit_count = visitor_sessions.visit_count + 1;

  RETURN v_view_id;
END;
$$;

-- 删除旧版 get_location_stats 函数后重建（增加 country_code 返回字段）
DROP FUNCTION get_location_stats(integer);
CREATE FUNCTION get_location_stats(p_days integer DEFAULT 7)
RETURNS TABLE(
  country text,
  country_code text,
  region text,
  city text,
  view_count bigint,
  unique_visitors bigint
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(pv.country, '未知') AS country,
    COALESCE(pv.country_code, '') AS country_code,
    COALESCE(pv.region, '未知') AS region,
    COALESCE(pv.city, '未知') AS city,
    COUNT(*)::bigint AS view_count,
    COUNT(DISTINCT pv.visitor_id)::bigint AS unique_visitors
  FROM page_views pv
  WHERE pv.created_at >= now() - (p_days || ' days')::interval
  GROUP BY pv.country, pv.country_code, pv.region, pv.city
  ORDER BY view_count DESC;
END;
$$;

-- 新增：按国家统计
CREATE OR REPLACE FUNCTION get_country_stats(p_days integer DEFAULT 7)
RETURNS TABLE(
  country text,
  country_code text,
  view_count bigint,
  unique_visitors bigint,
  percentage numeric
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total bigint;
BEGIN
  SELECT COUNT(*) INTO v_total
  FROM page_views
  WHERE created_at >= now() - (p_days || ' days')::interval;

  RETURN QUERY
  SELECT
    COALESCE(pv.country, '未知') AS country,
    COALESCE(pv.country_code, '') AS country_code,
    COUNT(*)::bigint AS view_count,
    COUNT(DISTINCT pv.visitor_id)::bigint AS unique_visitors,
    CASE WHEN v_total > 0 THEN ROUND(COUNT(*)::numeric / v_total * 100, 1) ELSE 0 END AS percentage
  FROM page_views pv
  WHERE pv.created_at >= now() - (p_days || ' days')::interval
  GROUP BY pv.country, pv.country_code
  ORDER BY view_count DESC;
END;
$$;

-- 新增：ISP 分布统计
CREATE OR REPLACE FUNCTION get_isp_stats(p_days integer DEFAULT 7)
RETURNS TABLE(
  isp text,
  view_count bigint,
  unique_visitors bigint
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(pv.isp, '未知') AS isp,
    COUNT(*)::bigint AS view_count,
    COUNT(DISTINCT pv.visitor_id)::bigint AS unique_visitors
  FROM page_views pv
  WHERE pv.created_at >= now() - (p_days || ' days')::interval
    AND pv.isp IS NOT NULL
  GROUP BY pv.isp
  ORDER BY view_count DESC
  LIMIT 20;
END;
$$;

-- 新增：获取带完整 IP 信息的最近访问记录
CREATE OR REPLACE FUNCTION get_recent_views_with_ip(p_limit integer DEFAULT 50)
RETURNS TABLE(
  id uuid,
  visitor_id text,
  session_id text,
  page_url text,
  page_title text,
  device_type text,
  browser text,
  os text,
  ip_address text,
  country text,
  country_code text,
  region text,
  city text,
  isp text,
  duration integer,
  created_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    pv.id, pv.visitor_id, pv.session_id,
    pv.page_url, pv.page_title,
    pv.device_type, pv.browser, pv.os,
    pv.ip_address, pv.country, pv.country_code,
    pv.region, pv.city, pv.isp,
    pv.duration, pv.created_at
  FROM page_views pv
  ORDER BY pv.created_at DESC
  LIMIT p_limit;
END;
$$;