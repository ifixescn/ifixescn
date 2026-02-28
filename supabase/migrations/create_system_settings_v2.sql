/*
# 创建系统配置表

## 1. 新增表
- `system_settings`
  - `id` (uuid, 主键)
  - `setting_key` (text, 唯一, 配置键名)
  - `setting_value` (jsonb, 配置值)
  - `category` (text, 配置分类)
  - `description` (text, 配置描述)
  - `is_encrypted` (boolean, 是否加密)
  - `created_at` (timestamptz, 创建时间)
  - `updated_at` (timestamptz, 更新时间)

## 2. 安全策略
- 启用 RLS
- 只允许管理员读取和修改配置

## 3. RPC 函数
- get_system_setting：获取单个配置
- set_system_setting：设置配置
- delete_system_setting：删除配置
- get_settings_by_category：获取分类下的所有配置
*/

-- 删除已存在的表（如果存在）
DROP TABLE IF EXISTS system_settings CASCADE;

-- 创建系统配置表
CREATE TABLE system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  category text NOT NULL DEFAULT 'general',
  description text,
  is_encrypted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX idx_system_settings_category ON system_settings(category);

-- 启用 RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- 创建策略：只允许管理员访问
CREATE POLICY "管理员可以查看所有配置" ON system_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "管理员可以修改所有配置" ON system_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_updated_at();

-- 创建 RPC 函数：获取配置
CREATE OR REPLACE FUNCTION get_system_setting(p_setting_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_setting_value jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION '权限不足';
  END IF;

  SELECT setting_value INTO v_setting_value
  FROM system_settings
  WHERE setting_key = p_setting_key;

  RETURN COALESCE(v_setting_value, '{}'::jsonb);
END;
$$;

-- 创建 RPC 函数：设置配置
CREATE OR REPLACE FUNCTION set_system_setting(
  p_setting_key text,
  p_setting_value jsonb,
  p_category text DEFAULT 'general',
  p_description text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION '权限不足';
  END IF;

  INSERT INTO system_settings (setting_key, setting_value, category, description)
  VALUES (p_setting_key, p_setting_value, p_category, p_description)
  ON CONFLICT (setting_key)
  DO UPDATE SET
    setting_value = p_setting_value,
    category = p_category,
    description = COALESCE(p_description, system_settings.description),
    updated_at = now();
END;
$$;

-- 创建 RPC 函数：删除配置
CREATE OR REPLACE FUNCTION delete_system_setting(p_setting_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION '权限不足';
  END IF;

  DELETE FROM system_settings WHERE setting_key = p_setting_key;
END;
$$;

-- 创建 RPC 函数：获取分类下的所有配置
CREATE OR REPLACE FUNCTION get_settings_by_category(p_category text)
RETURNS TABLE (
  setting_key text,
  setting_value jsonb,
  description text,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION '权限不足';
  END IF;

  RETURN QUERY
  SELECT
    s.setting_key,
    s.setting_value,
    s.description,
    s.updated_at
  FROM system_settings s
  WHERE s.category = p_category
  ORDER BY s.setting_key;
END;
$$;

-- 插入默认翻译配置
INSERT INTO system_settings (setting_key, setting_value, category, description) VALUES
  ('translation.baidu.app_id', '""'::jsonb, 'translation', '百度翻译 APP ID'),
  ('translation.baidu.secret_key', '""'::jsonb, 'translation', '百度翻译密钥'),
  ('translation.enabled', 'true'::jsonb, 'translation', '是否启用自动翻译'),
  ('translation.quality', '"high"'::jsonb, 'translation', '翻译质量（high/standard）'),
  ('translation.cache_enabled', 'true'::jsonb, 'translation', '是否启用翻译缓存'),
  ('translation.cache_ttl', '2592000'::jsonb, 'translation', '缓存过期时间（秒，默认30天）'),
  ('translation.auto_translate', 'true'::jsonb, 'translation', '是否自动翻译未找到的文本'),
  ('translation.fallback_lang', '"en"'::jsonb, 'translation', '备用语言'),
  ('translation.rate_limit', '100'::jsonb, 'translation', 'API 调用频率限制（次/分钟）'),
  ('translation.log_enabled', 'true'::jsonb, 'translation', '是否记录翻译日志'),
  ('translation.review_required', 'false'::jsonb, 'translation', '新翻译是否需要审核'),
  ('translation.supported_languages', '["en","zh","zh-TW","ja","ko","es","fr","de","ru","pt","it","ar"]'::jsonb, 'translation', '支持的语言列表');
