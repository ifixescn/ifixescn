-- 创建增加缓存命中次数的函数
CREATE OR REPLACE FUNCTION increment_cache_hit(
  p_source_text TEXT,
  p_source_lang VARCHAR(10),
  p_target_lang VARCHAR(10)
)
RETURNS VOID AS $$
BEGIN
  UPDATE translation_cache
  SET hit_count = hit_count + 1,
      updated_at = now()
  WHERE source_text = p_source_text
    AND source_lang = p_source_lang
    AND target_lang = p_target_lang;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建更新翻译统计的函数
CREATE OR REPLACE FUNCTION update_translation_stats(
  p_source_lang VARCHAR(10),
  p_target_lang VARCHAR(10),
  p_request_count INTEGER,
  p_character_count BIGINT,
  p_cache_hit_count INTEGER,
  p_api_call_count INTEGER
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO translation_stats (
    date,
    source_lang,
    target_lang,
    request_count,
    character_count,
    cache_hit_count,
    api_call_count
  )
  VALUES (
    CURRENT_DATE,
    p_source_lang,
    p_target_lang,
    p_request_count,
    p_character_count,
    p_cache_hit_count,
    p_api_call_count
  )
  ON CONFLICT (date, source_lang, target_lang)
  DO UPDATE SET
    request_count = translation_stats.request_count + p_request_count,
    character_count = translation_stats.character_count + p_character_count,
    cache_hit_count = translation_stats.cache_hit_count + p_cache_hit_count,
    api_call_count = translation_stats.api_call_count + p_api_call_count,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建获取翻译统计的函数
CREATE OR REPLACE FUNCTION get_translation_stats(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  date DATE,
  source_lang VARCHAR(10),
  target_lang VARCHAR(10),
  request_count INTEGER,
  character_count BIGINT,
  cache_hit_count INTEGER,
  api_call_count INTEGER,
  cache_hit_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ts.date,
    ts.source_lang,
    ts.target_lang,
    ts.request_count,
    ts.character_count,
    ts.cache_hit_count,
    ts.api_call_count,
    CASE
      WHEN ts.request_count > 0 THEN
        ROUND((ts.cache_hit_count::NUMERIC / ts.request_count::NUMERIC) * 100, 2)
      ELSE 0
    END AS cache_hit_rate
  FROM translation_stats ts
  WHERE ts.date BETWEEN p_start_date AND p_end_date
  ORDER BY ts.date DESC, ts.request_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建清理过期缓存的函数
CREATE OR REPLACE FUNCTION clean_expired_translation_cache(
  p_days_to_keep INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM translation_cache
  WHERE updated_at < (CURRENT_DATE - (p_days_to_keep || ' days')::INTERVAL);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建获取缓存统计的函数
CREATE OR REPLACE FUNCTION get_cache_statistics()
RETURNS TABLE (
  total_entries BIGINT,
  total_size_mb NUMERIC,
  most_used_pairs JSONB,
  cache_by_language JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_entries,
    ROUND((pg_total_relation_size('translation_cache')::NUMERIC / 1024 / 1024), 2) AS total_size_mb,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'source_lang', source_lang,
          'target_lang', target_lang,
          'count', count,
          'total_hits', total_hits
        )
      )
      FROM (
        SELECT
          source_lang,
          target_lang,
          COUNT(*) AS count,
          SUM(hit_count) AS total_hits
        FROM translation_cache
        GROUP BY source_lang, target_lang
        ORDER BY SUM(hit_count) DESC
        LIMIT 10
      ) top_pairs
    ) AS most_used_pairs,
    (
      SELECT jsonb_object_agg(
        target_lang,
        count
      )
      FROM (
        SELECT
          target_lang,
          COUNT(*) AS count
        FROM translation_cache
        GROUP BY target_lang
        ORDER BY COUNT(*) DESC
      ) lang_counts
    ) AS cache_by_language
  FROM translation_cache;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 添加注释
COMMENT ON FUNCTION increment_cache_hit IS '增加翻译缓存命中次数';
COMMENT ON FUNCTION update_translation_stats IS '更新翻译统计数据';
COMMENT ON FUNCTION get_translation_stats IS '获取翻译统计数据';
COMMENT ON FUNCTION clean_expired_translation_cache IS '清理过期的翻译缓存';
COMMENT ON FUNCTION get_cache_statistics IS '获取缓存统计信息';