
-- Step 1: Drop the old 13-param record_page_view (no isp/country_code, uses session_id based logic)
DROP FUNCTION IF EXISTS record_page_view(
  text, text, text,
  text, text, text, text, text, text,
  text, text, text, text
);

-- Step 2: Replace the broken 15-param version with a correct one
-- Root cause: old version did INSERT INTO visitor_sessions(visitor_id, last_visit, visit_count)
-- without session_id column which is NOT NULL → entire transaction rolled back, losing all data
CREATE OR REPLACE FUNCTION record_page_view(
  p_visitor_id   text,
  p_session_id   text,
  p_page_url     text,
  p_page_title   text    DEFAULT NULL,
  p_referrer     text    DEFAULT NULL,
  p_user_agent   text    DEFAULT NULL,
  p_device_type  text    DEFAULT NULL,
  p_browser      text    DEFAULT NULL,
  p_os           text    DEFAULT NULL,
  p_ip_address   text    DEFAULT NULL,
  p_country      text    DEFAULT NULL,
  p_region       text    DEFAULT NULL,
  p_city         text    DEFAULT NULL,
  p_isp          text    DEFAULT NULL,
  p_country_code text    DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_view_id uuid;
BEGIN
  -- 插入页面访问记录（含 ISP 和 country_code）
  INSERT INTO page_views (
    visitor_id, session_id, page_url, page_title, referrer,
    user_agent, device_type, browser, os,
    ip_address, country, region, city, isp, country_code
  ) VALUES (
    p_visitor_id, p_session_id, p_page_url, p_page_title, p_referrer,
    p_user_agent, p_device_type, p_browser, p_os,
    p_ip_address, p_country, p_region, p_city, p_isp, p_country_code
  ) RETURNING id INTO v_view_id;

  -- Upsert 访客会话（以 visitor_id 为主键，ON CONFLICT 正确包含 session_id）
  INSERT INTO visitor_sessions (
    visitor_id, session_id, page_views_count, visit_count, last_visit
  ) VALUES (
    p_visitor_id, p_session_id, 1, 1, now()
  )
  ON CONFLICT (visitor_id) DO UPDATE SET
    session_id       = EXCLUDED.session_id,
    last_visit       = now(),
    page_views_count = visitor_sessions.page_views_count + 1,
    visit_count      = visitor_sessions.visit_count + 1;

  RETURN v_view_id;
END;
$$;

-- Step 3: Grant execute permissions to public (needed for anon/authenticated callers)
GRANT EXECUTE ON FUNCTION record_page_view(
  text, text, text, text, text, text, text, text, text, text, text, text, text, text, text
) TO anon, authenticated;
