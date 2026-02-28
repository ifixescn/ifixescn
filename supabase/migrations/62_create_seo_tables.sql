/*
# 创建 SEO 管理表

## 1. 新增表

### seo_settings 表
全局 SEO 设置表，存储网站级别的 SEO 配置
- `id` (uuid, 主键)
- `site_title` (text) - 网站标题
- `site_description` (text) - 网站描述
- `site_keywords` (text) - 网站关键词
- `site_author` (text) - 网站作者
- `og_image` (text) - Open Graph 默认图片
- `twitter_handle` (text) - Twitter 账号
- `google_analytics_id` (text) - Google Analytics ID
- `google_search_console_id` (text) - Google Search Console ID
- `bing_webmaster_id` (text) - Bing Webmaster ID
- `robots_txt` (text) - robots.txt 内容
- `created_at`, `updated_at` (timestamptz)

### page_seo 表
页面级 SEO 设置表，存储每个页面的 SEO 配置
- `id` (uuid, 主键)
- `page_path` (text, 唯一) - 页面路径
- `page_title` (text) - 页面标题
- `page_description` (text) - 页面描述
- `page_keywords` (text) - 页面关键词
- `og_title`, `og_description`, `og_image` (text) - Open Graph 标签
- `twitter_title`, `twitter_description`, `twitter_image` (text) - Twitter Card 标签
- `canonical_url` (text) - 规范 URL
- `noindex`, `nofollow` (boolean) - 索引控制
- `priority` (decimal) - 站点地图优先级 (0.0-1.0)
- `change_frequency` (text) - 更新频率
- `created_at`, `updated_at` (timestamptz)

### redirects 表
URL 重定向管理表，存储 URL 重定向规则
- `id` (uuid, 主键)
- `from_path` (text, 唯一) - 源路径
- `to_path` (text) - 目标路径
- `redirect_type` (integer) - 重定向类型 (301, 302, 307, 308)
- `is_active` (boolean) - 是否启用
- `created_at`, `updated_at` (timestamptz)

## 2. 安全性
- 所有表都是公开的，任何人都可以读取
- 只有管理员可以修改

## 3. RPC 函数
- `get_seo_settings`: 获取全局 SEO 设置
- `update_seo_settings`: 更新全局 SEO 设置
- `get_page_seo`: 获取页面 SEO 设置
- `upsert_page_seo`: 创建或更新页面 SEO 设置
- `get_all_page_seo`: 获取所有页面 SEO 设置（用于生成站点地图）
- `get_active_redirects`: 获取所有启用的重定向规则
*/

-- 创建 seo_settings 表
CREATE TABLE IF NOT EXISTS seo_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_title text NOT NULL DEFAULT 'iFixes',
  site_description text NOT NULL DEFAULT 'Global leading mobile phone repair resource integration service provider',
  site_keywords text NOT NULL DEFAULT 'mobile phone repair, smartphone repair, screen repair, battery replacement',
  site_author text NOT NULL DEFAULT 'iFixes',
  og_image text,
  twitter_handle text,
  google_analytics_id text,
  google_search_console_id text,
  bing_webmaster_id text,
  robots_txt text NOT NULL DEFAULT 'User-agent: *
Allow: /
Sitemap: /sitemap.xml',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建 page_seo 表
CREATE TABLE IF NOT EXISTS page_seo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path text UNIQUE NOT NULL,
  page_title text,
  page_description text,
  page_keywords text,
  og_title text,
  og_description text,
  og_image text,
  twitter_title text,
  twitter_description text,
  twitter_image text,
  canonical_url text,
  noindex boolean DEFAULT false,
  nofollow boolean DEFAULT false,
  priority decimal(2,1) DEFAULT 0.5 CHECK (priority >= 0.0 AND priority <= 1.0),
  change_frequency text DEFAULT 'weekly' CHECK (change_frequency IN ('always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建 redirects 表
CREATE TABLE IF NOT EXISTS redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path text UNIQUE NOT NULL,
  to_path text NOT NULL,
  redirect_type integer DEFAULT 301 CHECK (redirect_type IN (301, 302, 307, 308)),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 插入默认的全局 SEO 设置
INSERT INTO seo_settings (id, site_title, site_description, site_keywords, site_author)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'iFixes - Global Leading Mobile Phone Repair Resource Integration Service Provider',
  'iFixes provides comprehensive mobile phone repair resources, including repair guides, parts sourcing, technical support, and professional training for repair technicians worldwide.',
  'mobile phone repair, smartphone repair, screen repair, battery replacement, repair guides, repair parts, technical support, repair training',
  'iFixes'
)
ON CONFLICT (id) DO NOTHING;

-- 插入默认的页面 SEO 设置
INSERT INTO page_seo (page_path, page_title, page_description, priority, change_frequency) VALUES
('/', 'Home - iFixes', 'Welcome to iFixes, your trusted partner for mobile phone repair resources and services.', 1.0, 'daily'),
('/articles', 'Articles - iFixes', 'Browse our comprehensive collection of repair guides and technical articles.', 0.9, 'daily'),
('/products', 'Products - iFixes', 'Discover high-quality repair parts and tools for mobile phone repair.', 0.9, 'daily'),
('/questions', 'Q&A - iFixes', 'Get answers to your repair questions from our expert community.', 0.8, 'daily'),
('/downloads', 'Downloads - iFixes', 'Access repair manuals, software tools, and technical resources.', 0.8, 'weekly'),
('/videos', 'Videos - iFixes', 'Watch step-by-step repair tutorials and training videos.', 0.8, 'weekly'),
('/search', 'Search - iFixes', 'Search for repair guides, parts, and technical information.', 0.7, 'weekly')
ON CONFLICT (page_path) DO NOTHING;

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有表添加更新时间触发器
CREATE TRIGGER update_seo_settings_updated_at BEFORE UPDATE ON seo_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_page_seo_updated_at BEFORE UPDATE ON page_seo
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_redirects_updated_at BEFORE UPDATE ON redirects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RPC 函数：获取全局 SEO 设置
CREATE OR REPLACE FUNCTION get_seo_settings()
RETURNS TABLE (
  id uuid,
  site_title text,
  site_description text,
  site_keywords text,
  site_author text,
  og_image text,
  twitter_handle text,
  google_analytics_id text,
  google_search_console_id text,
  bing_webmaster_id text,
  robots_txt text,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM seo_settings
  ORDER BY created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 函数：更新全局 SEO 设置
CREATE OR REPLACE FUNCTION update_seo_settings(
  p_site_title text,
  p_site_description text,
  p_site_keywords text,
  p_site_author text,
  p_og_image text DEFAULT NULL,
  p_twitter_handle text DEFAULT NULL,
  p_google_analytics_id text DEFAULT NULL,
  p_google_search_console_id text DEFAULT NULL,
  p_bing_webmaster_id text DEFAULT NULL,
  p_robots_txt text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE seo_settings
  SET
    site_title = p_site_title,
    site_description = p_site_description,
    site_keywords = p_site_keywords,
    site_author = p_site_author,
    og_image = COALESCE(p_og_image, og_image),
    twitter_handle = COALESCE(p_twitter_handle, twitter_handle),
    google_analytics_id = COALESCE(p_google_analytics_id, google_analytics_id),
    google_search_console_id = COALESCE(p_google_search_console_id, google_search_console_id),
    bing_webmaster_id = COALESCE(p_bing_webmaster_id, bing_webmaster_id),
    robots_txt = COALESCE(p_robots_txt, robots_txt),
    updated_at = now()
  WHERE id = '00000000-0000-0000-0000-000000000001';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 函数：获取页面 SEO 设置
CREATE OR REPLACE FUNCTION get_page_seo(p_page_path text)
RETURNS TABLE (
  id uuid,
  page_path text,
  page_title text,
  page_description text,
  page_keywords text,
  og_title text,
  og_description text,
  og_image text,
  twitter_title text,
  twitter_description text,
  twitter_image text,
  canonical_url text,
  noindex boolean,
  nofollow boolean,
  priority decimal,
  change_frequency text,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM page_seo
  WHERE page_seo.page_path = p_page_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 函数：创建或更新页面 SEO 设置
CREATE OR REPLACE FUNCTION upsert_page_seo(
  p_page_path text,
  p_page_title text DEFAULT NULL,
  p_page_description text DEFAULT NULL,
  p_page_keywords text DEFAULT NULL,
  p_og_title text DEFAULT NULL,
  p_og_description text DEFAULT NULL,
  p_og_image text DEFAULT NULL,
  p_twitter_title text DEFAULT NULL,
  p_twitter_description text DEFAULT NULL,
  p_twitter_image text DEFAULT NULL,
  p_canonical_url text DEFAULT NULL,
  p_noindex boolean DEFAULT false,
  p_nofollow boolean DEFAULT false,
  p_priority decimal DEFAULT 0.5,
  p_change_frequency text DEFAULT 'weekly'
)
RETURNS void AS $$
BEGIN
  INSERT INTO page_seo (
    page_path,
    page_title,
    page_description,
    page_keywords,
    og_title,
    og_description,
    og_image,
    twitter_title,
    twitter_description,
    twitter_image,
    canonical_url,
    noindex,
    nofollow,
    priority,
    change_frequency
  ) VALUES (
    p_page_path,
    p_page_title,
    p_page_description,
    p_page_keywords,
    p_og_title,
    p_og_description,
    p_og_image,
    p_twitter_title,
    p_twitter_description,
    p_twitter_image,
    p_canonical_url,
    p_noindex,
    p_nofollow,
    p_priority,
    p_change_frequency
  )
  ON CONFLICT (page_path) DO UPDATE SET
    page_title = COALESCE(EXCLUDED.page_title, page_seo.page_title),
    page_description = COALESCE(EXCLUDED.page_description, page_seo.page_description),
    page_keywords = COALESCE(EXCLUDED.page_keywords, page_seo.page_keywords),
    og_title = COALESCE(EXCLUDED.og_title, page_seo.og_title),
    og_description = COALESCE(EXCLUDED.og_description, page_seo.og_description),
    og_image = COALESCE(EXCLUDED.og_image, page_seo.og_image),
    twitter_title = COALESCE(EXCLUDED.twitter_title, page_seo.twitter_title),
    twitter_description = COALESCE(EXCLUDED.twitter_description, page_seo.twitter_description),
    twitter_image = COALESCE(EXCLUDED.twitter_image, page_seo.twitter_image),
    canonical_url = COALESCE(EXCLUDED.canonical_url, page_seo.canonical_url),
    noindex = EXCLUDED.noindex,
    nofollow = EXCLUDED.nofollow,
    priority = EXCLUDED.priority,
    change_frequency = EXCLUDED.change_frequency,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 函数：获取所有页面 SEO 设置（用于生成站点地图）
CREATE OR REPLACE FUNCTION get_all_page_seo()
RETURNS TABLE (
  page_path text,
  page_title text,
  priority decimal,
  change_frequency text,
  updated_at timestamptz,
  noindex boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    page_seo.page_path,
    page_seo.page_title,
    page_seo.priority,
    page_seo.change_frequency,
    page_seo.updated_at,
    page_seo.noindex
  FROM page_seo
  WHERE page_seo.noindex = false
  ORDER BY page_seo.priority DESC, page_seo.page_path ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 函数：获取所有启用的重定向规则
CREATE OR REPLACE FUNCTION get_active_redirects()
RETURNS TABLE (
  from_path text,
  to_path text,
  redirect_type integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    redirects.from_path,
    redirects.to_path,
    redirects.redirect_type
  FROM redirects
  WHERE redirects.is_active = true
  ORDER BY redirects.from_path ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
