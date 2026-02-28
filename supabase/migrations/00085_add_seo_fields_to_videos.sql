-- 为 videos 表添加 SEO 字段
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS seo_keywords TEXT;

-- 添加注释
COMMENT ON COLUMN videos.seo_title IS 'SEO 标题';
COMMENT ON COLUMN videos.seo_description IS 'SEO 描述';
COMMENT ON COLUMN videos.seo_keywords IS 'SEO 关键词';