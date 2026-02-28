/*
# 优化会员系统 - 增强管理员权限和英文等级

## 1. 更新会员等级为英文
## 2. 添加会员状态管理
## 3. 添加更多管理员权限
## 4. 创建会员等级配置管理函数
*/

-- ============================================
-- 1. 添加会员状态字段
-- ============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' NOT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disabled_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disabled_reason text;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- ============================================
-- 2. 更新会员等级配置为英文
-- ============================================

-- 清空旧数据
TRUNCATE member_levels CASCADE;

-- 插入英文等级配置
INSERT INTO member_levels (id, name, min_points, max_points, benefits, badge_color) VALUES
  (1, 'Bronze', 0, 99, '{"description": "新手会员，欢迎加入", "features": ["基础浏览权限", "提问功能", "评论功能"]}', '#cd7f32'),
  (2, 'Silver', 100, 499, '{"description": "银牌会员，积极参与", "features": ["发布文章", "优先回答", "专属徽章", "每日积分加成"]}', '#c0c0c0'),
  (3, 'Gold', 500, 1999, '{"description": "金牌会员，活跃用户", "features": ["文章推荐位", "专属标识", "优先审核", "高级编辑器"]}', '#ffd700'),
  (4, 'Platinum', 2000, 4999, '{"description": "白金会员，资深用户", "features": ["内容置顶", "专属客服", "高级权限", "自定义主页"]}', '#e5e4e2'),
  (5, 'Diamond', 5000, NULL, '{"description": "钻石会员，尊贵身份", "features": ["全站特权", "专属顾问", "优先支持", "定制服务", "无限存储"]}', '#b9f2ff')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  min_points = EXCLUDED.min_points,
  max_points = EXCLUDED.max_points,
  benefits = EXCLUDED.benefits,
  badge_color = EXCLUDED.badge_color;

-- ============================================
-- 3. 创建积分规则配置表
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

-- 插入默认积分规则
INSERT INTO points_rules (action, points, description) VALUES
  ('daily_login', 5, '每日登录奖励'),
  ('publish_article', 10, '发布文章'),
  ('publish_question', 5, '发布提问'),
  ('publish_answer', 8, '发布回答'),
  ('answer_accepted', 20, '回答被采纳'),
  ('article_liked', 2, '文章被点赞'),
  ('comment_received', 1, '收到评论')
ON CONFLICT (action) DO NOTHING;

-- ============================================
-- 4. 创建管理员操作日志表
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

-- ============================================
-- 5. 创建会员等级管理函数
-- ============================================

-- 更新会员等级配置
CREATE OR REPLACE FUNCTION update_member_level_config(
  p_level_id int,
  p_name text,
  p_min_points int,
  p_max_points int,
  p_benefits jsonb,
  p_badge_color text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE member_levels
  SET 
    name = p_name,
    min_points = p_min_points,
    max_points = p_max_points,
    benefits = p_benefits,
    badge_color = p_badge_color
  WHERE id = p_level_id;
END;
$$;

-- 更新积分规则
CREATE OR REPLACE FUNCTION update_points_rule(
  p_action text,
  p_points int,
  p_description text,
  p_enabled boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE points_rules
  SET 
    points = p_points,
    description = p_description,
    enabled = p_enabled,
    updated_at = now()
  WHERE action = p_action;
END;
$$;

-- 禁用/启用会员账号
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

-- 批量更新会员等级
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

-- 批量增加积分
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
    PERFORM add_member_points(v_user_id, p_points, p_reason, NULL, NULL);
  END LOOP;
END;
$$;

-- 记录管理员操作
CREATE OR REPLACE FUNCTION log_admin_operation(
  p_admin_id uuid,
  p_operation_type text,
  p_target_type text,
  p_target_id uuid,
  p_details jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO admin_operation_logs (admin_id, operation_type, target_type, target_id, details)
  VALUES (p_admin_id, p_operation_type, p_target_type, p_target_id, p_details);
END;
$$;

-- ============================================
-- 6. 更新会员统计视图
-- ============================================

DROP VIEW IF EXISTS member_stats;

CREATE VIEW member_stats AS
SELECT 
  p.id,
  p.username,
  p.nickname,
  p.email,
  p.phone,
  p.avatar_url,
  p.role,
  p.status,
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
  p.last_login_at,
  COALESCE((SELECT COUNT(*) FROM browsing_history WHERE user_id = p.id), 0) as total_views,
  COALESCE((SELECT COUNT(*) FROM member_submissions WHERE user_id = p.id AND status = 'pending'), 0) as pending_submissions
FROM profiles p
LEFT JOIN member_levels ml ON p.level = ml.id;

-- ============================================
-- 7. 更新安全策略
-- ============================================

-- 允许管理员查看所有会员状态
DROP POLICY IF EXISTS "Admins can view all member stats" ON profiles;
CREATE POLICY "Admins can view all member stats" ON profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 允许管理员更新会员状态
DROP POLICY IF EXISTS "Admins can update member status" ON profiles;
CREATE POLICY "Admins can update member status" ON profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 积分规则表的安全策略
ALTER TABLE points_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view points rules" ON points_rules
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage points rules" ON points_rules
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

-- 管理员操作日志的安全策略
ALTER TABLE admin_operation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view operation logs" ON admin_operation_logs
  FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "System can insert operation logs" ON admin_operation_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================
-- 8. 创建会员等级自动更新触发器
-- ============================================

CREATE OR REPLACE FUNCTION auto_update_member_level()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_level int;
BEGIN
  -- 根据积分自动计算等级
  SELECT id INTO v_new_level
  FROM member_levels
  WHERE NEW.points >= min_points
    AND (max_points IS NULL OR NEW.points <= max_points)
  ORDER BY min_points DESC
  LIMIT 1;

  IF v_new_level IS NOT NULL AND v_new_level != NEW.level THEN
    NEW.level := v_new_level;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_update_member_level ON profiles;
CREATE TRIGGER trigger_auto_update_member_level
  BEFORE UPDATE OF points ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_member_level();
