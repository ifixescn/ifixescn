/*
# 会员系统升级 - 完整功能集成

## 1. 新增字段到profiles表
- `points` (int, 积分, 默认0)
- `level` (int, 会员等级, 默认1)
- `country` (text, 国家)
- `address` (text, 地址)
- `city` (text, 城市)
- `postal_code` (text, 邮编)
- `bio` (text, 个人简介)
- `total_articles` (int, 发布文章总数, 默认0)
- `total_questions` (int, 提问总数, 默认0)
- `total_answers` (int, 回答总数, 默认0)

## 2. 新建表

### 2.1 member_levels - 会员等级配置表
- `id` (int, 主键)
- `name` (text, 等级名称)
- `min_points` (int, 最低积分要求)
- `max_points` (int, 最高积分, null表示无上限)
- `benefits` (jsonb, 等级权益)
- `badge_color` (text, 徽章颜色)

### 2.2 member_points_log - 积分记录表
- `id` (uuid, 主键)
- `user_id` (uuid, 用户ID)
- `points` (int, 积分变化, 正数为增加, 负数为减少)
- `reason` (text, 原因)
- `reference_type` (text, 关联类型: article/question/answer/login/purchase)
- `reference_id` (uuid, 关联ID, 可为空)
- `created_at` (timestamptz, 创建时间)

### 2.3 browsing_history - 浏览记录表
- `id` (uuid, 主键)
- `user_id` (uuid, 用户ID)
- `content_type` (text, 内容类型: article/product/video/download/question)
- `content_id` (uuid, 内容ID)
- `content_title` (text, 内容标题)
- `created_at` (timestamptz, 浏览时间)

### 2.4 member_submissions - 会员提交内容审核表
- `id` (uuid, 主键)
- `user_id` (uuid, 用户ID)
- `content_type` (text, 内容类型: article/question)
- `content_id` (uuid, 内容ID)
- `status` (text, 状态: pending/approved/rejected)
- `reviewer_id` (uuid, 审核人ID, 可为空)
- `review_note` (text, 审核备注, 可为空)
- `submitted_at` (timestamptz, 提交时间)
- `reviewed_at` (timestamptz, 审核时间, 可为空)

## 3. 安全策略
- member_levels: 公开读取, 仅管理员可写入
- member_points_log: 用户可查看自己的记录, 管理员可查看所有
- browsing_history: 用户可查看和管理自己的记录, 管理员可查看所有
- member_submissions: 用户可查看自己的提交, 管理员和编辑可查看和审核所有

## 4. 触发器和函数
- 自动更新会员等级
- 自动统计发布数量
- 积分变化记录
*/

-- ============================================
-- 1. 扩展profiles表
-- ============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS points int DEFAULT 0 NOT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level int DEFAULT 1 NOT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_articles int DEFAULT 0 NOT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_questions int DEFAULT 0 NOT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_answers int DEFAULT 0 NOT NULL;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_profiles_points ON profiles(points DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_level ON profiles(level);

-- ============================================
-- 2. 创建会员等级配置表
-- ============================================

CREATE TABLE IF NOT EXISTS member_levels (
  id int PRIMARY KEY,
  name text NOT NULL,
  min_points int NOT NULL,
  max_points int,
  benefits jsonb DEFAULT '{}',
  badge_color text DEFAULT '#gray',
  created_at timestamptz DEFAULT now()
);

-- 插入默认等级配置
INSERT INTO member_levels (id, name, min_points, max_points, benefits, badge_color) VALUES
  (1, '新手会员', 0, 99, '{"description": "欢迎加入", "features": ["基础浏览", "提问功能"]}', '#94a3b8'),
  (2, '初级会员', 100, 499, '{"description": "积极参与", "features": ["发布文章", "优先回答", "专属徽章"]}', '#3b82f6'),
  (3, '中级会员', 500, 1999, '{"description": "活跃用户", "features": ["文章推荐", "专属标识", "优先审核"]}', '#8b5cf6'),
  (4, '高级会员', 2000, 4999, '{"description": "资深用户", "features": ["内容置顶", "专属客服", "高级权限"]}', '#f59e0b'),
  (5, 'VIP会员', 5000, NULL, '{"description": "尊贵身份", "features": ["全站特权", "专属顾问", "优先支持", "定制服务"]}', '#ef4444')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. 创建积分记录表
-- ============================================

CREATE TABLE IF NOT EXISTS member_points_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points int NOT NULL,
  reason text NOT NULL,
  reference_type text,
  reference_id uuid,
  created_at timestamptz DEFAULT now()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_points_log_user ON member_points_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_log_reference ON member_points_log(reference_type, reference_id);

-- ============================================
-- 4. 创建浏览记录表
-- ============================================

CREATE TABLE IF NOT EXISTS browsing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  content_title text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_browsing_history_user ON browsing_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_browsing_history_content ON browsing_history(content_type, content_id);

-- ============================================
-- 5. 创建会员提交内容审核表
-- ============================================

CREATE TABLE IF NOT EXISTS member_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  reviewer_id uuid REFERENCES profiles(id),
  review_note text,
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_submissions_user ON member_submissions(user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON member_submissions(status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_content ON member_submissions(content_type, content_id);

-- ============================================
-- 6. 创建积分管理函数
-- ============================================

-- 添加积分函数
CREATE OR REPLACE FUNCTION add_member_points(
  p_user_id uuid,
  p_points int,
  p_reason text,
  p_reference_type text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 更新用户积分
  UPDATE profiles
  SET points = points + p_points,
      updated_at = now()
  WHERE id = p_user_id;
  
  -- 记录积分变化
  INSERT INTO member_points_log (user_id, points, reason, reference_type, reference_id)
  VALUES (p_user_id, p_points, p_reason, p_reference_type, p_reference_id);
  
  -- 更新会员等级
  PERFORM update_member_level(p_user_id);
END;
$$;

-- 更新会员等级函数
CREATE OR REPLACE FUNCTION update_member_level(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_points int;
  v_new_level int;
BEGIN
  -- 获取当前积分
  SELECT points INTO v_points
  FROM profiles
  WHERE id = p_user_id;
  
  -- 根据积分确定等级
  SELECT id INTO v_new_level
  FROM member_levels
  WHERE min_points <= v_points
    AND (max_points IS NULL OR max_points >= v_points)
  ORDER BY min_points DESC
  LIMIT 1;
  
  -- 更新等级
  IF v_new_level IS NOT NULL THEN
    UPDATE profiles
    SET level = v_new_level,
        updated_at = now()
    WHERE id = p_user_id;
  END IF;
END;
$$;

-- ============================================
-- 7. 创建浏览记录函数
-- ============================================

CREATE OR REPLACE FUNCTION add_browsing_history(
  p_user_id uuid,
  p_content_type text,
  p_content_id uuid,
  p_content_title text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 删除该用户对该内容的旧记录（保持唯一性）
  DELETE FROM browsing_history
  WHERE user_id = p_user_id
    AND content_type = p_content_type
    AND content_id = p_content_id;
  
  -- 插入新记录
  INSERT INTO browsing_history (user_id, content_type, content_id, content_title)
  VALUES (p_user_id, p_content_type, p_content_id, p_content_title);
  
  -- 限制每个用户的浏览记录数量（保留最近100条）
  DELETE FROM browsing_history
  WHERE id IN (
    SELECT id FROM browsing_history
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    OFFSET 100
  );
END;
$$;

-- ============================================
-- 8. 创建触发器 - 文章发布时增加积分和统计
-- ============================================

CREATE OR REPLACE FUNCTION on_article_published()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 如果文章从非published状态变为published状态
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    -- 增加积分
    PERFORM add_member_points(
      NEW.author_id,
      10,
      '发布文章',
      'article',
      NEW.id
    );
    
    -- 更新文章统计
    UPDATE profiles
    SET total_articles = total_articles + 1
    WHERE id = NEW.author_id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_article_published ON articles;
CREATE TRIGGER trigger_article_published
  AFTER INSERT OR UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION on_article_published();

-- ============================================
-- 9. 创建触发器 - 提问时增加积分和统计
-- ============================================

CREATE OR REPLACE FUNCTION on_question_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 增加积分
  PERFORM add_member_points(
    NEW.author_id,
    5,
    '提出问题',
    'question',
    NEW.id
  );
  
  -- 更新提问统计
  UPDATE profiles
  SET total_questions = total_questions + 1
  WHERE id = NEW.author_id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_question_created ON questions;
CREATE TRIGGER trigger_question_created
  AFTER INSERT ON questions
  FOR EACH ROW
  EXECUTE FUNCTION on_question_created();

-- ============================================
-- 10. 创建触发器 - 回答时增加积分和统计
-- ============================================

CREATE OR REPLACE FUNCTION on_answer_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 增加积分
  PERFORM add_member_points(
    NEW.author_id,
    3,
    '回答问题',
    'answer',
    NEW.id
  );
  
  -- 更新回答统计
  UPDATE profiles
  SET total_answers = total_answers + 1
  WHERE id = NEW.author_id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_answer_created ON answers;
CREATE TRIGGER trigger_answer_created
  AFTER INSERT ON answers
  FOR EACH ROW
  EXECUTE FUNCTION on_answer_created();

-- ============================================
-- 11. 创建触发器 - 回答被采纳时额外增加积分
-- ============================================

CREATE OR REPLACE FUNCTION on_answer_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 如果回答从未采纳变为采纳
  IF NEW.is_accepted = true AND (OLD.is_accepted IS NULL OR OLD.is_accepted = false) THEN
    -- 额外增加积分
    PERFORM add_member_points(
      NEW.author_id,
      15,
      '回答被采纳',
      'answer',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_answer_accepted ON answers;
CREATE TRIGGER trigger_answer_accepted
  AFTER UPDATE ON answers
  FOR EACH ROW
  EXECUTE FUNCTION on_answer_accepted();

-- ============================================
-- 12. 创建辅助函数 - 检查是否为编辑
-- ============================================

CREATE OR REPLACE FUNCTION is_editor(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role IN ('editor'::user_role, 'admin'::user_role)
  );
$$;

-- ============================================
-- 13. 安全策略 - member_levels
-- ============================================

ALTER TABLE member_levels ENABLE ROW LEVEL SECURITY;

-- 所有人可以查看等级配置
CREATE POLICY "Anyone can view member levels"
  ON member_levels FOR SELECT
  TO public
  USING (true);

-- 只有管理员可以修改等级配置
CREATE POLICY "Only admins can modify member levels"
  ON member_levels FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- ============================================
-- 14. 安全策略 - member_points_log
-- ============================================

ALTER TABLE member_points_log ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的积分记录
CREATE POLICY "Users can view own points log"
  ON member_points_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin(auth.uid()));

-- 管理员可以查看所有积分记录
CREATE POLICY "Admins can view all points log"
  ON member_points_log FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- ============================================
-- 15. 安全策略 - browsing_history
-- ============================================

ALTER TABLE browsing_history ENABLE ROW LEVEL SECURITY;

-- 用户可以查看和删除自己的浏览记录
CREATE POLICY "Users can manage own browsing history"
  ON browsing_history FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 管理员可以查看所有浏览记录
CREATE POLICY "Admins can view all browsing history"
  ON browsing_history FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- ============================================
-- 16. 安全策略 - member_submissions
-- ============================================

ALTER TABLE member_submissions ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的提交记录
CREATE POLICY "Users can view own submissions"
  ON member_submissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin(auth.uid()) OR is_editor(auth.uid()));

-- 用户可以创建提交记录
CREATE POLICY "Users can create submissions"
  ON member_submissions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 管理员和编辑可以更新提交记录（审核）
CREATE POLICY "Admins and editors can update submissions"
  ON member_submissions FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()) OR is_editor(auth.uid()))
  WITH CHECK (is_admin(auth.uid()) OR is_editor(auth.uid()));

-- ============================================
-- 17. 创建视图 - 会员统计信息
-- ============================================

CREATE OR REPLACE VIEW member_stats AS
SELECT 
  p.id,
  p.username,
  p.email,
  p.avatar_url,
  p.points,
  p.level,
  ml.name as level_name,
  ml.badge_color,
  p.total_articles,
  p.total_questions,
  p.total_answers,
  p.country,
  p.city,
  p.created_at,
  (SELECT COUNT(*) FROM browsing_history WHERE user_id = p.id) as total_views,
  (SELECT COUNT(*) FROM member_submissions WHERE user_id = p.id AND status = 'pending') as pending_submissions
FROM profiles p
LEFT JOIN member_levels ml ON p.level = ml.id;

-- ============================================
-- 18. 创建函数 - 获取会员排行榜
-- ============================================

CREATE OR REPLACE FUNCTION get_member_leaderboard(
  p_limit int DEFAULT 10,
  p_order_by text DEFAULT 'points'
)
RETURNS TABLE (
  id uuid,
  username text,
  avatar_url text,
  points int,
  level int,
  level_name text,
  badge_color text,
  total_articles int,
  total_questions int,
  total_answers int
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.avatar_url,
    p.points,
    p.level,
    ml.name as level_name,
    ml.badge_color,
    p.total_articles,
    p.total_questions,
    p.total_answers
  FROM profiles p
  LEFT JOIN member_levels ml ON p.level = ml.id
  WHERE p.role = 'member'::user_role
  ORDER BY 
    CASE 
      WHEN p_order_by = 'points' THEN p.points
      WHEN p_order_by = 'articles' THEN p.total_articles
      WHEN p_order_by = 'questions' THEN p.total_questions
      WHEN p_order_by = 'answers' THEN p.total_answers
      ELSE p.points
    END DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON TABLE member_levels IS '会员等级配置表';
COMMENT ON TABLE member_points_log IS '会员积分记录表';
COMMENT ON TABLE browsing_history IS '会员浏览记录表';
COMMENT ON TABLE member_submissions IS '会员提交内容审核表';
