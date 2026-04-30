
-- 语言设置表
CREATE TABLE language_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code text UNIQUE NOT NULL,
  language_name text NOT NULL,
  native_name text NOT NULL,
  flag_emoji text DEFAULT '',
  is_enabled boolean DEFAULT true,
  is_default boolean DEFAULT false,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 翻译缓存表
CREATE TABLE translation_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_text text NOT NULL,
  source_lang text NOT NULL DEFAULT 'en',
  target_lang text NOT NULL,
  translated_text text NOT NULL,
  engine text DEFAULT 'mymemory',
  hit_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 唯一索引防止重复翻译
CREATE UNIQUE INDEX translation_cache_unique_idx 
  ON translation_cache (md5(source_text), source_lang, target_lang);

-- 翻译引擎设置表
CREATE TABLE translation_engine_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_key text UNIQUE NOT NULL,
  engine_name text NOT NULL,
  is_active boolean DEFAULT false,
  api_key text DEFAULT '',
  extra_config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 插入默认语言数据
INSERT INTO language_settings (language_code, language_name, native_name, flag_emoji, is_enabled, is_default, sort_order) VALUES
  ('en', 'English', 'English', '🇺🇸', true, true, 1),
  ('zh-CN', 'Chinese Simplified', '简体中文', '🇨🇳', true, false, 2),
  ('zh-TW', 'Chinese Traditional', '繁體中文', '🇹🇼', true, false, 3),
  ('ja', 'Japanese', '日本語', '🇯🇵', true, false, 4),
  ('ko', 'Korean', '한국어', '🇰🇷', true, false, 5),
  ('es', 'Spanish', 'Español', '🇪🇸', true, false, 6),
  ('fr', 'French', 'Français', '🇫🇷', true, false, 7),
  ('de', 'German', 'Deutsch', '🇩🇪', true, false, 8),
  ('pt', 'Portuguese', 'Português', '🇧🇷', true, false, 9),
  ('ru', 'Russian', 'Русский', '🇷🇺', true, false, 10),
  ('ar', 'Arabic', 'العربية', '🇸🇦', false, false, 11),
  ('it', 'Italian', 'Italiano', '🇮🇹', false, false, 12),
  ('nl', 'Dutch', 'Nederlands', '🇳🇱', false, false, 13),
  ('th', 'Thai', 'ภาษาไทย', '🇹🇭', false, false, 14),
  ('vi', 'Vietnamese', 'Tiếng Việt', '🇻🇳', false, false, 15),
  ('id', 'Indonesian', 'Bahasa Indonesia', '🇮🇩', false, false, 16);

-- 插入默认翻译引擎
INSERT INTO translation_engine_settings (engine_key, engine_name, is_active, api_key) VALUES
  ('mymemory', 'MyMemory (免费)', true, ''),
  ('google', 'Google Translate', false, ''),
  ('deepl', 'DeepL', false, ''),
  ('baidu', '百度翻译', false, '');

-- RLS 配置
ALTER TABLE language_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_engine_settings ENABLE ROW LEVEL SECURITY;

-- language_settings: 所有人可读，仅管理员可写
CREATE POLICY "language_settings_read_all" ON language_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "language_settings_admin_write" ON language_settings FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- translation_cache: 所有人可读，认证用户可写
CREATE POLICY "translation_cache_read_all" ON translation_cache FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "translation_cache_insert_auth" ON translation_cache FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "translation_cache_update_auth" ON translation_cache FOR UPDATE TO anon, authenticated USING (true);

-- translation_engine_settings: 仅管理员可访问
CREATE POLICY "engine_settings_admin_only" ON translation_engine_settings FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "engine_settings_read_all" ON translation_engine_settings FOR SELECT TO anon, authenticated USING (true);
