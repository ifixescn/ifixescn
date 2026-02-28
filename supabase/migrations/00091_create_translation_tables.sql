-- 创建翻译缓存表
CREATE TABLE IF NOT EXISTS translation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_text TEXT NOT NULL,
  source_lang VARCHAR(10) NOT NULL DEFAULT 'en',
  target_lang VARCHAR(10) NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  hit_count INTEGER DEFAULT 1,
  UNIQUE(source_text, source_lang, target_lang)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_translation_cache_lookup 
ON translation_cache(source_text, source_lang, target_lang);

CREATE INDEX IF NOT EXISTS idx_translation_cache_created 
ON translation_cache(created_at DESC);

-- 创建翻译统计表
CREATE TABLE IF NOT EXISTS translation_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  source_lang VARCHAR(10) NOT NULL,
  target_lang VARCHAR(10) NOT NULL,
  request_count INTEGER DEFAULT 0,
  character_count BIGINT DEFAULT 0,
  cache_hit_count INTEGER DEFAULT 0,
  api_call_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, source_lang, target_lang)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_translation_stats_date 
ON translation_stats(date DESC);

-- 启用 RLS
ALTER TABLE translation_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_stats ENABLE ROW LEVEL SECURITY;

-- 翻译缓存表策略：所有人可读，只有认证用户可写
CREATE POLICY "翻译缓存公开可读"
ON translation_cache FOR SELECT
TO public
USING (true);

CREATE POLICY "认证用户可写翻译缓存"
ON translation_cache FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "认证用户可更新翻译缓存"
ON translation_cache FOR UPDATE
TO authenticated
USING (true);

-- 翻译统计表策略：只有管理员可访问
CREATE POLICY "管理员可读翻译统计"
ON translation_stats FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "管理员可写翻译统计"
ON translation_stats FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "管理员可更新翻译统计"
ON translation_stats FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 添加注释
COMMENT ON TABLE translation_cache IS '翻译缓存表，存储已翻译的文本';
COMMENT ON TABLE translation_stats IS '翻译统计表，记录翻译使用情况';

-- 创建更新 updated_at 的触发器
CREATE OR REPLACE FUNCTION update_translation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_translation_cache_updated_at
  BEFORE UPDATE ON translation_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_translation_updated_at();

CREATE TRIGGER update_translation_stats_updated_at
  BEFORE UPDATE ON translation_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_translation_updated_at();