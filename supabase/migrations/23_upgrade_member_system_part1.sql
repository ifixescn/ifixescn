/*
# 会员系统升级 - Part 1: 表结构和基础函数

## 1. 扩展profiles表
## 2. 创建新表
## 3. 创建基础函数
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
-- 6. 创建辅助函数 - 检查是否为编辑
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
-- 7. 创建积分管理函数
-- ============================================

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

-- ============================================
-- 8. 创建浏览记录函数
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

COMMENT ON TABLE member_levels IS '会员等级配置表';
COMMENT ON TABLE member_points_log IS '会员积分记录表';
COMMENT ON TABLE browsing_history IS '会员浏览记录表';
COMMENT ON TABLE member_submissions IS '会员提交内容审核表';
