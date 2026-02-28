/*
# 文章采集系统

创建文章采集系统所需的数据库表和函数，支持：
- 采集规则管理
- 采集历史记录
- 图片本地化
- 来源标注
*/

-- 创建采集规则表
CREATE TABLE IF NOT EXISTS scraper_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, -- 规则名称
  description text, -- 规则描述
  source_url text NOT NULL, -- 源网站URL
  source_name text NOT NULL, -- 源网站名称
  
  -- 采集规则配置（CSS选择器或XPath）
  list_page_url text, -- 列表页URL（可选，用于批量采集）
  list_item_selector text, -- 列表项选择器
  article_url_selector text, -- 文章链接选择器
  
  -- 文章内容选择器
  title_selector text NOT NULL, -- 标题选择器
  content_selector text NOT NULL, -- 内容选择器
  excerpt_selector text, -- 摘要选择器
  cover_image_selector text, -- 封面图选择器
  author_selector text, -- 作者选择器
  publish_date_selector text, -- 发布日期选择器
  
  -- 采集配置
  category_id uuid REFERENCES categories(id), -- 默认分类
  auto_publish boolean DEFAULT false, -- 是否自动发布
  download_images boolean DEFAULT true, -- 是否下载图片到本地
  add_source_link boolean DEFAULT true, -- 是否添加来源链接
  
  -- 状态
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'testing')),
  last_run_at timestamptz, -- 最后运行时间
  success_count int DEFAULT 0, -- 成功采集数
  fail_count int DEFAULT 0, -- 失败采集数
  
  -- 元数据
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建采集历史表
CREATE TABLE IF NOT EXISTS scraper_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid REFERENCES scraper_rules(id) ON DELETE CASCADE,
  
  -- 采集信息
  source_url text NOT NULL, -- 源文章URL
  article_id uuid REFERENCES articles(id), -- 生成的文章ID
  
  -- 采集结果
  status text NOT NULL CHECK (status IN ('success', 'failed', 'processing')),
  error_message text, -- 错误信息
  
  -- 采集数据
  scraped_data jsonb, -- 采集到的原始数据
  images_downloaded int DEFAULT 0, -- 下载的图片数量
  
  -- 元数据
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_scraper_rules_status ON scraper_rules(status);
CREATE INDEX IF NOT EXISTS idx_scraper_rules_created_by ON scraper_rules(created_by);
CREATE INDEX IF NOT EXISTS idx_scraper_history_rule_id ON scraper_history(rule_id);
CREATE INDEX IF NOT EXISTS idx_scraper_history_status ON scraper_history(status);
CREATE INDEX IF NOT EXISTS idx_scraper_history_created_at ON scraper_history(created_at DESC);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_scraper_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_scraper_rules_updated_at
  BEFORE UPDATE ON scraper_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_scraper_rules_updated_at();

-- 启用RLS
ALTER TABLE scraper_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_history ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- 管理员和编辑可以查看所有规则
CREATE POLICY "管理员和编辑可以查看采集规则"
  ON scraper_rules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- 管理员和编辑可以创建规则
CREATE POLICY "管理员和编辑可以创建采集规则"
  ON scraper_rules FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- 管理员和编辑可以更新规则
CREATE POLICY "管理员和编辑可以更新采集规则"
  ON scraper_rules FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- 管理员可以删除规则
CREATE POLICY "管理员可以删除采集规则"
  ON scraper_rules FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 采集历史策略
CREATE POLICY "管理员和编辑可以查看采集历史"
  ON scraper_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "系统可以插入采集历史"
  ON scraper_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 创建统计函数
CREATE OR REPLACE FUNCTION get_scraper_stats()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_rules', COUNT(*),
    'active_rules', COUNT(*) FILTER (WHERE status = 'active'),
    'total_scraped', SUM(success_count),
    'total_failed', SUM(fail_count)
  ) INTO result
  FROM scraper_rules;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 插入示例采集规则
INSERT INTO scraper_rules (
  name,
  description,
  source_url,
  source_name,
  title_selector,
  content_selector,
  excerpt_selector,
  cover_image_selector,
  status,
  download_images,
  add_source_link
) VALUES (
  '示例采集规则',
  '这是一个示例采集规则，展示如何配置CSS选择器',
  'https://example.com',
  '示例网站',
  'h1.article-title',
  'div.article-content',
  'div.article-excerpt',
  'img.cover-image',
  'testing',
  true,
  true
) ON CONFLICT DO NOTHING;

COMMENT ON TABLE scraper_rules IS '文章采集规则配置表';
COMMENT ON TABLE scraper_history IS '文章采集历史记录表';
