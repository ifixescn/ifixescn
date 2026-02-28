/*
# 创建翻译缓存表

## 1. 新表
- `translations`
  - `id` (uuid, 主键)
  - `source_text` (text, 原文)
  - `target_text` (text, 译文)
  - `source_lang` (text, 源语言代码，默认 'en')
  - `target_lang` (text, 目标语言代码)
  - `translation_key` (text, 翻译键，用于快速查找)
  - `context` (text, 上下文信息，可选)
  - `created_at` (timestamptz, 创建时间)
  - `updated_at` (timestamptz, 更新时间)
  - `usage_count` (integer, 使用次数)

## 2. 索引
- 为 translation_key 创建唯一索引
- 为 source_lang 和 target_lang 创建组合索引
- 为 source_text 创建全文搜索索引

## 3. 安全策略
- 允许所有用户读取翻译缓存
- 只允许通过 Edge Function 写入翻译缓存

## 4. RPC 函数
- `get_translation`: 获取翻译（带缓存）
- `batch_get_translations`: 批量获取翻译
- `increment_translation_usage`: 增加翻译使用次数
*/

-- 创建翻译缓存表
CREATE TABLE IF NOT EXISTS translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_text text NOT NULL,
  target_text text NOT NULL,
  source_lang text NOT NULL DEFAULT 'en',
  target_lang text NOT NULL,
  translation_key text NOT NULL,
  context text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  usage_count integer DEFAULT 0
);

-- 创建唯一索引（防止重复翻译）
CREATE UNIQUE INDEX IF NOT EXISTS idx_translations_key 
ON translations(translation_key);

-- 创建组合索引（优化查询）
CREATE INDEX IF NOT EXISTS idx_translations_langs 
ON translations(source_lang, target_lang);

-- 创建全文搜索索引
CREATE INDEX IF NOT EXISTS idx_translations_source_text 
ON translations USING gin(to_tsvector('english', source_text));

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_translations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_translations_updated_at
  BEFORE UPDATE ON translations
  FOR EACH ROW
  EXECUTE FUNCTION update_translations_updated_at();

-- RPC: 获取单个翻译
CREATE OR REPLACE FUNCTION get_translation(
  p_source_text text,
  p_source_lang text DEFAULT 'en',
  p_target_lang text DEFAULT 'zh'
)
RETURNS TABLE(
  id uuid,
  source_text text,
  target_text text,
  source_lang text,
  target_lang text
) AS $$
DECLARE
  v_translation_key text;
BEGIN
  -- 生成翻译键
  v_translation_key := md5(p_source_lang || ':' || p_target_lang || ':' || p_source_text);
  
  -- 查询翻译
  RETURN QUERY
  SELECT 
    t.id,
    t.source_text,
    t.target_text,
    t.source_lang,
    t.target_lang
  FROM translations t
  WHERE t.translation_key = v_translation_key;
  
  -- 增加使用次数
  UPDATE translations 
  SET usage_count = usage_count + 1
  WHERE translation_key = v_translation_key;
END;
$$ LANGUAGE plpgsql;

-- RPC: 批量获取翻译
CREATE OR REPLACE FUNCTION batch_get_translations(
  p_texts text[],
  p_source_lang text DEFAULT 'en',
  p_target_lang text DEFAULT 'zh'
)
RETURNS TABLE(
  source_text text,
  target_text text,
  found boolean
) AS $$
DECLARE
  v_text text;
  v_translation_key text;
  v_result record;
BEGIN
  -- 遍历所有文本
  FOREACH v_text IN ARRAY p_texts
  LOOP
    -- 生成翻译键
    v_translation_key := md5(p_source_lang || ':' || p_target_lang || ':' || v_text);
    
    -- 查询翻译
    SELECT t.target_text INTO v_result
    FROM translations t
    WHERE t.translation_key = v_translation_key;
    
    IF FOUND THEN
      -- 找到翻译
      RETURN QUERY SELECT v_text, v_result.target_text, true;
      
      -- 增加使用次数
      UPDATE translations 
      SET usage_count = usage_count + 1
      WHERE translation_key = v_translation_key;
    ELSE
      -- 未找到翻译
      RETURN QUERY SELECT v_text, v_text, false;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- RPC: 保存翻译（仅供 Edge Function 使用）
CREATE OR REPLACE FUNCTION save_translation(
  p_source_text text,
  p_target_text text,
  p_source_lang text DEFAULT 'en',
  p_target_lang text DEFAULT 'zh',
  p_context text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_translation_key text;
  v_id uuid;
BEGIN
  -- 生成翻译键
  v_translation_key := md5(p_source_lang || ':' || p_target_lang || ':' || p_source_text);
  
  -- 插入或更新翻译
  INSERT INTO translations (
    source_text,
    target_text,
    source_lang,
    target_lang,
    translation_key,
    context,
    usage_count
  ) VALUES (
    p_source_text,
    p_target_text,
    p_source_lang,
    p_target_lang,
    v_translation_key,
    p_context,
    1
  )
  ON CONFLICT (translation_key) 
  DO UPDATE SET
    target_text = EXCLUDED.target_text,
    updated_at = now(),
    usage_count = translations.usage_count + 1
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- RPC: 批量保存翻译
CREATE OR REPLACE FUNCTION batch_save_translations(
  p_translations jsonb
)
RETURNS integer AS $$
DECLARE
  v_translation jsonb;
  v_count integer := 0;
BEGIN
  -- 遍历所有翻译
  FOR v_translation IN SELECT * FROM jsonb_array_elements(p_translations)
  LOOP
    PERFORM save_translation(
      v_translation->>'source_text',
      v_translation->>'target_text',
      COALESCE(v_translation->>'source_lang', 'en'),
      COALESCE(v_translation->>'target_lang', 'zh'),
      v_translation->>'context'
    );
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 允许所有用户读取翻译缓存
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "允许所有用户读取翻译" ON translations
  FOR SELECT TO public USING (true);

-- 注意：写入操作只能通过 Edge Function 进行，不需要直接的写入策略