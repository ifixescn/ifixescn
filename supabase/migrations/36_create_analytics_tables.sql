/*
# 访问流量统计系统

## 1. 新建表

### page_views (页面访问记录)
- `id` (uuid, 主键)
- `visitor_id` (text, 访客唯一标识)
- `page_url` (text, 访问页面URL)
- `page_title` (text, 页面标题)
- `referrer` (text, 来源页面)
- `user_agent` (text, 浏览器信息)
- `device_type` (text, 设备类型: desktop/mobile/tablet)
- `browser` (text, 浏览器名称)
- `os` (text, 操作系统)
- `ip_address` (text, IP地址)
- `country` (text, 国家)
- `region` (text, 地区/省份)
- `city` (text, 城市)
- `session_id` (text, 会话ID)
- `duration` (integer, 停留时长秒数)
- `created_at` (timestamptz, 访问时间)

### visitor_sessions (访客会话)
- `id` (uuid, 主键)
- `visitor_id` (text, 访客ID)
- `session_id` (text, 会话ID)
- `first_visit` (timestamptz, 首次访问时间)
- `last_visit` (timestamptz, 最后访问时间)
- `page_views_count` (integer, 页面浏览数)
- `total_duration` (integer, 总停留时长)

### analytics_summary (统计汇总 - 按天)
- `id` (uuid, 主键)
- `date` (date, 日期)
- `total_views` (integer, 总访问量)
- `unique_visitors` (integer, 独立访客数)
- `avg_duration` (integer, 平均停留时长)
- `bounce_rate` (numeric, 跳出率)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

## 2. 安全策略
- page_views表：公开读取权限（用于统计），管理员可写入
- visitor_sessions表：公开读取权限，管理员可写入
- analytics_summary表：公开读取权限，管理员可写入

## 3. 索引
- page_views: visitor_id, page_url, created_at
- visitor_sessions: visitor_id, session_id
- analytics_summary: date

## 4. RPC函数
- record_page_view: 记录页面访问
- get_analytics_summary: 获取统计汇总
*/

-- 创建页面访问记录表
CREATE TABLE IF NOT EXISTS page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL,
  page_url text NOT NULL,
  page_title text,
  referrer text,
  user_agent text,
  device_type text,
  browser text,
  os text,
  ip_address text,
  country text,
  region text,
  city text,
  session_id text NOT NULL,
  duration integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 创建访客会话表
CREATE TABLE IF NOT EXISTS visitor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL,
  session_id text NOT NULL UNIQUE,
  first_visit timestamptz DEFAULT now(),
  last_visit timestamptz DEFAULT now(),
  page_views_count integer DEFAULT 0,
  total_duration integer DEFAULT 0
);

-- 创建统计汇总表
CREATE TABLE IF NOT EXISTS analytics_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  total_views integer DEFAULT 0,
  unique_visitors integer DEFAULT 0,
  avg_duration integer DEFAULT 0,
  bounce_rate numeric(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON page_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_views_page_url ON page_views(page_url);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_visitor_id ON visitor_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_session_id ON visitor_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_summary_date ON analytics_summary(date DESC);

-- 启用RLS
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_summary ENABLE ROW LEVEL SECURITY;

-- 创建策略：所有人可以插入访问记录
CREATE POLICY "Anyone can insert page views" ON page_views
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- 创建策略：所有人可以读取访问记录
CREATE POLICY "Anyone can read page views" ON page_views
  FOR SELECT TO anon, authenticated
  USING (true);

-- 创建策略：所有人可以插入会话记录
CREATE POLICY "Anyone can insert sessions" ON visitor_sessions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- 创建策略：所有人可以更新会话记录
CREATE POLICY "Anyone can update sessions" ON visitor_sessions
  FOR UPDATE TO anon, authenticated
  USING (true);

-- 创建策略：所有人可以读取会话记录
CREATE POLICY "Anyone can read sessions" ON visitor_sessions
  FOR SELECT TO anon, authenticated
  USING (true);

-- 创建策略：所有人可以读取统计汇总
CREATE POLICY "Anyone can read analytics summary" ON analytics_summary
  FOR SELECT TO anon, authenticated
  USING (true);

-- 创建策略：管理员可以管理统计汇总
CREATE POLICY "Admins can manage analytics summary" ON analytics_summary
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 创建RPC函数：记录页面访问
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
  p_city text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_view_id uuid;
  v_session_exists boolean;
BEGIN
  -- 插入页面访问记录
  INSERT INTO page_views (
    visitor_id, session_id, page_url, page_title, referrer,
    user_agent, device_type, browser, os, ip_address,
    country, region, city
  ) VALUES (
    p_visitor_id, p_session_id, p_page_url, p_page_title, p_referrer,
    p_user_agent, p_device_type, p_browser, p_os, p_ip_address,
    p_country, p_region, p_city
  ) RETURNING id INTO v_view_id;

  -- 检查会话是否存在
  SELECT EXISTS(
    SELECT 1 FROM visitor_sessions WHERE session_id = p_session_id
  ) INTO v_session_exists;

  IF v_session_exists THEN
    -- 更新现有会话
    UPDATE visitor_sessions
    SET 
      last_visit = now(),
      page_views_count = page_views_count + 1
    WHERE session_id = p_session_id;
  ELSE
    -- 创建新会话
    INSERT INTO visitor_sessions (visitor_id, session_id, page_views_count)
    VALUES (p_visitor_id, p_session_id, 1);
  END IF;

  RETURN v_view_id;
END;
$$;

-- 创建RPC函数：更新页面停留时长
CREATE OR REPLACE FUNCTION update_page_duration(
  p_view_id uuid,
  p_duration integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE page_views
  SET duration = p_duration
  WHERE id = p_view_id;

  -- 更新会话总时长
  UPDATE visitor_sessions vs
  SET total_duration = (
    SELECT COALESCE(SUM(duration), 0)
    FROM page_views pv
    WHERE pv.session_id = vs.session_id
  )
  WHERE session_id = (
    SELECT session_id FROM page_views WHERE id = p_view_id
  );
END;
$$;

-- 创建RPC函数：获取实时统计
CREATE OR REPLACE FUNCTION get_realtime_analytics(
  p_days integer DEFAULT 7
)
RETURNS TABLE (
  date date,
  total_views bigint,
  unique_visitors bigint,
  avg_duration numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(pv.created_at) as date,
    COUNT(*)::bigint as total_views,
    COUNT(DISTINCT pv.visitor_id)::bigint as unique_visitors,
    ROUND(AVG(pv.duration))::numeric as avg_duration
  FROM page_views pv
  WHERE pv.created_at >= CURRENT_DATE - p_days
  GROUP BY DATE(pv.created_at)
  ORDER BY date DESC;
END;
$$;

-- 创建RPC函数：获取页面访问排行
CREATE OR REPLACE FUNCTION get_top_pages(
  p_limit integer DEFAULT 10,
  p_days integer DEFAULT 7
)
RETURNS TABLE (
  page_url text,
  page_title text,
  view_count bigint,
  unique_visitors bigint,
  avg_duration numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pv.page_url,
    MAX(pv.page_title) as page_title,
    COUNT(*)::bigint as view_count,
    COUNT(DISTINCT pv.visitor_id)::bigint as unique_visitors,
    ROUND(AVG(pv.duration))::numeric as avg_duration
  FROM page_views pv
  WHERE pv.created_at >= CURRENT_DATE - p_days
  GROUP BY pv.page_url
  ORDER BY view_count DESC
  LIMIT p_limit;
END;
$$;

-- 创建RPC函数：获取地区分布
CREATE OR REPLACE FUNCTION get_location_stats(
  p_days integer DEFAULT 7
)
RETURNS TABLE (
  country text,
  region text,
  city text,
  view_count bigint,
  unique_visitors bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(pv.country, '未知') as country,
    COALESCE(pv.region, '未知') as region,
    COALESCE(pv.city, '未知') as city,
    COUNT(*)::bigint as view_count,
    COUNT(DISTINCT pv.visitor_id)::bigint as unique_visitors
  FROM page_views pv
  WHERE pv.created_at >= CURRENT_DATE - p_days
  GROUP BY pv.country, pv.region, pv.city
  ORDER BY view_count DESC;
END;
$$;

-- 创建RPC函数：获取设备统计
CREATE OR REPLACE FUNCTION get_device_stats(
  p_days integer DEFAULT 7
)
RETURNS TABLE (
  device_type text,
  browser text,
  os text,
  view_count bigint,
  unique_visitors bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(pv.device_type, '未知') as device_type,
    COALESCE(pv.browser, '未知') as browser,
    COALESCE(pv.os, '未知') as os,
    COUNT(*)::bigint as view_count,
    COUNT(DISTINCT pv.visitor_id)::bigint as unique_visitors
  FROM page_views pv
  WHERE pv.created_at >= CURRENT_DATE - p_days
  GROUP BY pv.device_type, pv.browser, pv.os
  ORDER BY view_count DESC;
END;
$$;
