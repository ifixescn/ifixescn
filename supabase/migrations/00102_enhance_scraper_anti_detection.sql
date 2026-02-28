/*
# 增强文章采集系统 - 添加反爬虫配置

添加反爬虫配置字段和请求控制功能
*/

-- 添加反爬虫配置字段到scraper_rules表
ALTER TABLE scraper_rules ADD COLUMN IF NOT EXISTS anti_scraping_config jsonb DEFAULT '{
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "delay_min": 2000,
  "delay_max": 5000,
  "use_referer": true,
  "use_cookies": false,
  "custom_headers": {},
  "timeout": 30000,
  "retry_times": 3,
  "retry_delay": 5000
}'::jsonb;

-- 添加请求频率控制字段
ALTER TABLE scraper_rules ADD COLUMN IF NOT EXISTS rate_limit_config jsonb DEFAULT '{
  "max_requests_per_minute": 10,
  "max_requests_per_hour": 100,
  "concurrent_requests": 1
}'::jsonb;

-- 添加代理配置字段
ALTER TABLE scraper_rules ADD COLUMN IF NOT EXISTS proxy_config jsonb DEFAULT '{
  "enabled": false,
  "proxy_url": null,
  "rotate_proxy": false
}'::jsonb;

-- 添加Cookie存储字段
ALTER TABLE scraper_rules ADD COLUMN IF NOT EXISTS cookies jsonb DEFAULT '[]'::jsonb;

-- 添加最后请求时间字段（用于频率控制）
ALTER TABLE scraper_rules ADD COLUMN IF NOT EXISTS last_request_at timestamptz;

-- 添加请求计数字段
ALTER TABLE scraper_rules ADD COLUMN IF NOT EXISTS request_count_minute int DEFAULT 0;
ALTER TABLE scraper_rules ADD COLUMN IF NOT EXISTS request_count_hour int DEFAULT 0;
ALTER TABLE scraper_rules ADD COLUMN IF NOT EXISTS request_count_reset_at timestamptz DEFAULT now();

-- 创建请求日志表（用于分析和调试）
CREATE TABLE IF NOT EXISTS scraper_request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid REFERENCES scraper_rules(id) ON DELETE CASCADE,
  url text NOT NULL,
  method text DEFAULT 'GET',
  status_code int,
  response_time int, -- 毫秒
  user_agent text,
  headers jsonb,
  success boolean,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_scraper_request_logs_rule_id ON scraper_request_logs(rule_id);
CREATE INDEX IF NOT EXISTS idx_scraper_request_logs_created_at ON scraper_request_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraper_request_logs_success ON scraper_request_logs(success);

-- 创建清理旧日志的函数
CREATE OR REPLACE FUNCTION cleanup_old_scraper_logs()
RETURNS void AS $$
BEGIN
  -- 删除30天前的日志
  DELETE FROM scraper_request_logs
  WHERE created_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql;

-- 创建更新请求计数的函数
CREATE OR REPLACE FUNCTION update_scraper_request_count(rule_uuid uuid)
RETURNS void AS $$
DECLARE
  current_rule RECORD;
BEGIN
  SELECT * INTO current_rule FROM scraper_rules WHERE id = rule_uuid;
  
  -- 检查是否需要重置计数
  IF current_rule.request_count_reset_at < now() - interval '1 hour' THEN
    UPDATE scraper_rules
    SET 
      request_count_minute = 0,
      request_count_hour = 0,
      request_count_reset_at = now()
    WHERE id = rule_uuid;
  ELSIF current_rule.request_count_reset_at < now() - interval '1 minute' THEN
    UPDATE scraper_rules
    SET 
      request_count_minute = 0
    WHERE id = rule_uuid;
  END IF;
  
  -- 增加计数
  UPDATE scraper_rules
  SET 
    request_count_minute = request_count_minute + 1,
    request_count_hour = request_count_hour + 1,
    last_request_at = now()
  WHERE id = rule_uuid;
END;
$$ LANGUAGE plpgsql;

-- 创建检查频率限制的函数
CREATE OR REPLACE FUNCTION check_scraper_rate_limit(rule_uuid uuid)
RETURNS boolean AS $$
DECLARE
  current_rule RECORD;
  rate_config jsonb;
BEGIN
  SELECT * INTO current_rule FROM scraper_rules WHERE id = rule_uuid;
  rate_config := current_rule.rate_limit_config;
  
  -- 检查分钟限制
  IF current_rule.request_count_minute >= (rate_config->>'max_requests_per_minute')::int THEN
    RETURN false;
  END IF;
  
  -- 检查小时限制
  IF current_rule.request_count_hour >= (rate_config->>'max_requests_per_hour')::int THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- RLS策略
ALTER TABLE scraper_request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员和编辑可以查看请求日志"
  ON scraper_request_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "系统可以插入请求日志"
  ON scraper_request_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

COMMENT ON TABLE scraper_request_logs IS '采集请求日志表，用于分析和调试';
COMMENT ON COLUMN scraper_rules.anti_scraping_config IS '反爬虫配置：User-Agent、延迟、Headers等';
COMMENT ON COLUMN scraper_rules.rate_limit_config IS '频率限制配置';
COMMENT ON COLUMN scraper_rules.proxy_config IS '代理配置';
