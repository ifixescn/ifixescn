/*
# 修复会员系统 - 确保所有字段正确

## 1. 确保profiles表有所有必需字段
## 2. 为现有数据添加默认值
## 3. 修复视图和函数
*/

-- ============================================
-- 1. 确保profiles表有所有必需字段
-- ============================================

-- 添加status字段（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'status') THEN
    ALTER TABLE profiles ADD COLUMN status text DEFAULT 'active' NOT NULL;
  END IF;
END $$;

-- 添加last_login_at字段（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'last_login_at') THEN
    ALTER TABLE profiles ADD COLUMN last_login_at timestamptz;
  END IF;
END $$;

-- 添加disabled_at字段（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'disabled_at') THEN
    ALTER TABLE profiles ADD COLUMN disabled_at timestamptz;
  END IF;
END $$;

-- 添加disabled_reason字段（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'disabled_reason') THEN
    ALTER TABLE profiles ADD COLUMN disabled_reason text;
  END IF;
END $$;

-- ============================================
-- 2. 为现有数据添加默认值
-- ============================================

-- 确保所有现有用户都有status字段
UPDATE profiles SET status = 'active' WHERE status IS NULL;

-- 确保status字段不为空
ALTER TABLE profiles ALTER COLUMN status SET DEFAULT 'active';
ALTER TABLE profiles ALTER COLUMN status SET NOT NULL;

-- ============================================
-- 3. 重新创建member_stats视图（确保包含所有字段）
-- ============================================

DROP VIEW IF EXISTS member_stats CASCADE;

CREATE OR REPLACE VIEW member_stats AS
SELECT 
  p.id,
  p.username,
  p.nickname,
  p.email,
  p.phone,
  p.avatar_url,
  p.role,
  COALESCE(p.status, 'active') as status,
  COALESCE(p.points, 0) as points,
  COALESCE(p.level, 1) as level,
  COALESCE(ml.name, 'Bronze') as level_name,
  COALESCE(ml.badge_color, '#cd7f32') as badge_color,
  COALESCE(p.total_articles, 0) as total_articles,
  COALESCE(p.total_questions, 0) as total_questions,
  COALESCE(p.total_answers, 0) as total_answers,
  p.country,
  p.city,
  p.created_at,
  p.last_login_at,
  COALESCE((SELECT COUNT(*) FROM browsing_history WHERE user_id = p.id), 0) as total_views,
  COALESCE((SELECT COUNT(*) FROM member_submissions WHERE user_id = p.id AND status = 'pending'), 0) as pending_submissions
FROM profiles p
LEFT JOIN member_levels ml ON p.level = ml.id;

-- ============================================
-- 4. 确保member_levels表有数据
-- ============================================

-- 如果member_levels表为空，插入默认数据
INSERT INTO member_levels (id, name, min_points, max_points, benefits, badge_color)
SELECT 1, 'Bronze', 0, 99, '{"description": "新手会员，欢迎加入", "features": ["基础浏览权限", "提问功能", "评论功能"]}'::jsonb, '#cd7f32'
WHERE NOT EXISTS (SELECT 1 FROM member_levels WHERE id = 1);

INSERT INTO member_levels (id, name, min_points, max_points, benefits, badge_color)
SELECT 2, 'Silver', 100, 499, '{"description": "银牌会员，积极参与", "features": ["发布文章", "优先回答", "专属徽章", "每日积分加成"]}'::jsonb, '#c0c0c0'
WHERE NOT EXISTS (SELECT 1 FROM member_levels WHERE id = 2);

INSERT INTO member_levels (id, name, min_points, max_points, benefits, badge_color)
SELECT 3, 'Gold', 500, 1999, '{"description": "金牌会员，活跃用户", "features": ["文章推荐位", "专属标识", "优先审核", "高级编辑器"]}'::jsonb, '#ffd700'
WHERE NOT EXISTS (SELECT 1 FROM member_levels WHERE id = 3);

INSERT INTO member_levels (id, name, min_points, max_points, benefits, badge_color)
SELECT 4, 'Platinum', 2000, 4999, '{"description": "白金会员，资深用户", "features": ["内容置顶", "专属客服", "高级权限", "自定义主页"]}'::jsonb, '#e5e4e2'
WHERE NOT EXISTS (SELECT 1 FROM member_levels WHERE id = 4);

INSERT INTO member_levels (id, name, min_points, max_points, benefits, badge_color)
SELECT 5, 'Diamond', 5000, NULL, '{"description": "钻石会员，尊贵身份", "features": ["全站特权", "专属顾问", "优先支持", "定制服务", "无限存储"]}'::jsonb, '#b9f2ff'
WHERE NOT EXISTS (SELECT 1 FROM member_levels WHERE id = 5);

-- ============================================
-- 5. 确保所有用户都有有效的level
-- ============================================

-- 将无效的level设置为1（Bronze）
UPDATE profiles SET level = 1 WHERE level IS NULL OR level < 1 OR level > 5;

-- ============================================
-- 6. 创建或替换必需的函数
-- ============================================

-- 切换会员状态函数
CREATE OR REPLACE FUNCTION toggle_member_status(
  p_user_id uuid,
  p_status text,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_status = 'disabled' THEN
    UPDATE profiles
    SET 
      status = p_status,
      disabled_at = now(),
      disabled_reason = p_reason
    WHERE id = p_user_id;
  ELSE
    UPDATE profiles
    SET 
      status = p_status,
      disabled_at = NULL,
      disabled_reason = NULL
    WHERE id = p_user_id;
  END IF;
END;
$$;

-- 批量更新会员等级函数
CREATE OR REPLACE FUNCTION batch_update_member_level(
  p_user_ids uuid[],
  p_level int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET level = p_level
  WHERE id = ANY(p_user_ids);
END;
$$;

-- 批量增加积分函数
CREATE OR REPLACE FUNCTION batch_add_points(
  p_user_ids uuid[],
  p_points int,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  FOREACH v_user_id IN ARRAY p_user_ids
  LOOP
    -- 检查add_member_points函数是否存在
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'add_member_points') THEN
      PERFORM add_member_points(v_user_id, p_points, p_reason, NULL, NULL);
    ELSE
      -- 如果函数不存在，直接更新积分
      UPDATE profiles SET points = points + p_points WHERE id = v_user_id;
    END IF;
  END LOOP;
END;
$$;

-- ============================================
-- 7. 创建积分规则表（如果不存在）
-- ============================================

CREATE TABLE IF NOT EXISTS points_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL UNIQUE,
  points int NOT NULL,
  description text,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 插入默认积分规则（如果不存在）
INSERT INTO points_rules (action, points, description) 
SELECT 'daily_login', 5, '每日登录奖励'
WHERE NOT EXISTS (SELECT 1 FROM points_rules WHERE action = 'daily_login');

INSERT INTO points_rules (action, points, description) 
SELECT 'publish_article', 10, '发布文章'
WHERE NOT EXISTS (SELECT 1 FROM points_rules WHERE action = 'publish_article');

INSERT INTO points_rules (action, points, description) 
SELECT 'publish_question', 5, '发布提问'
WHERE NOT EXISTS (SELECT 1 FROM points_rules WHERE action = 'publish_question');

INSERT INTO points_rules (action, points, description) 
SELECT 'publish_answer', 8, '发布回答'
WHERE NOT EXISTS (SELECT 1 FROM points_rules WHERE action = 'publish_answer');

INSERT INTO points_rules (action, points, description) 
SELECT 'answer_accepted', 20, '回答被采纳'
WHERE NOT EXISTS (SELECT 1 FROM points_rules WHERE action = 'answer_accepted');

-- 启用RLS
ALTER TABLE points_rules ENABLE ROW LEVEL SECURITY;

-- 允许所有人查看积分规则
DROP POLICY IF EXISTS "Anyone can view points rules" ON points_rules;
CREATE POLICY "Anyone can view points rules" ON points_rules
  FOR SELECT TO public USING (true);

-- 只允许管理员修改积分规则
DROP POLICY IF EXISTS "Admins can update points rules" ON points_rules;
CREATE POLICY "Admins can update points rules" ON points_rules
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 8. 创建管理员操作日志表（如果不存在）
-- ============================================

CREATE TABLE IF NOT EXISTS admin_operation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES profiles(id),
  operation_type text NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_operation_logs(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON admin_operation_logs(target_type, target_id);

-- 启用RLS
ALTER TABLE admin_operation_logs ENABLE ROW LEVEL SECURITY;

-- 只允许管理员查看操作日志
DROP POLICY IF EXISTS "Admins can view operation logs" ON admin_operation_logs;
CREATE POLICY "Admins can view operation logs" ON admin_operation_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 9. 添加索引以提高性能
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_level ON profiles(level);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_points ON profiles(points DESC);
