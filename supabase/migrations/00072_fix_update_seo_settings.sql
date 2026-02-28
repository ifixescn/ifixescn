/*
# 修复 update_seo_settings 函数

## 问题
当前的 update_seo_settings 函数使用 COALESCE，导致无法将字段更新为空字符串或 NULL。
例如：COALESCE(p_og_image, og_image) 会在 p_og_image 为 NULL 时保留原值。

## 解决方案
修改函数逻辑，允许将可选字段更新为空字符串或 NULL。
- 如果参数为空字符串 ''，则更新为 NULL
- 如果参数为 NULL，则保持原值不变
- 如果参数有值，则更新为新值

## 修改内容
重新创建 update_seo_settings 函数，使用更灵活的更新逻辑
*/

-- 删除旧函数
DROP FUNCTION IF EXISTS update_seo_settings(text, text, text, text, text, text, text, text, text, text);

-- 重新创建函数，修复更新逻辑
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
    -- 如果传入空字符串，转换为 NULL；如果传入 NULL，保持原值
    og_image = CASE 
      WHEN p_og_image = '' THEN NULL 
      WHEN p_og_image IS NOT NULL THEN p_og_image 
      ELSE og_image 
    END,
    twitter_handle = CASE 
      WHEN p_twitter_handle = '' THEN NULL 
      WHEN p_twitter_handle IS NOT NULL THEN p_twitter_handle 
      ELSE twitter_handle 
    END,
    google_analytics_id = CASE 
      WHEN p_google_analytics_id = '' THEN NULL 
      WHEN p_google_analytics_id IS NOT NULL THEN p_google_analytics_id 
      ELSE google_analytics_id 
    END,
    google_search_console_id = CASE 
      WHEN p_google_search_console_id = '' THEN NULL 
      WHEN p_google_search_console_id IS NOT NULL THEN p_google_search_console_id 
      ELSE google_search_console_id 
    END,
    bing_webmaster_id = CASE 
      WHEN p_bing_webmaster_id = '' THEN NULL 
      WHEN p_bing_webmaster_id IS NOT NULL THEN p_bing_webmaster_id 
      ELSE bing_webmaster_id 
    END,
    robots_txt = CASE 
      WHEN p_robots_txt = '' THEN 'User-agent: *
Allow: /
Sitemap: /sitemap.xml'
      WHEN p_robots_txt IS NOT NULL THEN p_robots_txt 
      ELSE robots_txt 
    END,
    updated_at = now()
  WHERE id = '00000000-0000-0000-0000-000000000001';
  
  -- 如果没有记录，插入默认记录
  IF NOT FOUND THEN
    INSERT INTO seo_settings (
      id,
      site_title,
      site_description,
      site_keywords,
      site_author,
      og_image,
      twitter_handle,
      google_analytics_id,
      google_search_console_id,
      bing_webmaster_id,
      robots_txt
    ) VALUES (
      '00000000-0000-0000-0000-000000000001',
      p_site_title,
      p_site_description,
      p_site_keywords,
      p_site_author,
      NULLIF(p_og_image, ''),
      NULLIF(p_twitter_handle, ''),
      NULLIF(p_google_analytics_id, ''),
      NULLIF(p_google_search_console_id, ''),
      NULLIF(p_bing_webmaster_id, ''),
      COALESCE(NULLIF(p_robots_txt, ''), 'User-agent: *
Allow: /
Sitemap: /sitemap.xml')
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
