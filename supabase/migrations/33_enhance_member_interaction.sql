/*
# 增强会员系统与整站模块的互动性

## 1. 新增功能
- 添加浏览内容的积分规则
- 为member_points_log表添加action字段
- 增强add_browsing_history函数，自动增加浏览积分
- 防止重复刷分（每个内容每天只能获得一次浏览积分）

## 2. 积分规则
- view_article: 浏览文章 +1分
- view_product: 浏览产品 +1分
- view_video: 浏览视频 +1分
- view_download: 浏览下载 +1分
- view_question: 浏览问答 +1分

## 3. 防刷分机制
- 使用member_points_log表记录积分获取时间
- 同一内容同一天只能获得一次浏览积分
*/

-- ============================================
-- 1. 为member_points_log表添加action字段
-- ============================================

ALTER TABLE member_points_log ADD COLUMN IF NOT EXISTS action text;
ALTER TABLE member_points_log ADD COLUMN IF NOT EXISTS description text;

-- 更新现有记录的action字段（从reason字段推断）
UPDATE member_points_log
SET action = CASE
  WHEN reason LIKE '%登录%' THEN 'daily_login'
  WHEN reason LIKE '%文章%' THEN 'publish_article'
  WHEN reason LIKE '%问题%' OR reason LIKE '%提问%' THEN 'publish_question'
  WHEN reason LIKE '%回答%' THEN 'publish_answer'
  ELSE 'manual'
END,
description = reason
WHERE action IS NULL;

-- 修改reference_id字段类型为text（如果需要）
ALTER TABLE member_points_log ALTER COLUMN reference_id TYPE text USING reference_id::text;

-- ============================================
-- 2. 添加浏览内容的积分规则
-- ============================================

INSERT INTO points_rules (action, points, description, enabled)
VALUES 
  ('view_article', 1, '浏览文章', true),
  ('view_product', 1, '浏览产品', true),
  ('view_video', 1, '浏览视频', true),
  ('view_download', 1, '浏览下载', true),
  ('view_question', 1, '浏览问答', true)
ON CONFLICT (action) DO UPDATE SET
  points = EXCLUDED.points,
  description = EXCLUDED.description,
  enabled = EXCLUDED.enabled,
  updated_at = now();

-- ============================================
-- 3. 增强add_browsing_history函数
-- ============================================

CREATE OR REPLACE FUNCTION add_browsing_history(
  p_user_id uuid,
  p_content_type text,
  p_content_id uuid,
  p_content_title text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text;
  v_points int;
  v_enabled boolean;
  v_already_earned boolean;
BEGIN
  -- 删除该用户对该内容的旧记录（保持唯一性）
  DELETE FROM browsing_history
  WHERE user_id = p_user_id
    AND content_type = p_content_type
    AND content_id = p_content_id;
  
  -- 插入新浏览记录
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
  
  -- 根据内容类型确定积分动作
  v_action := 'view_' || p_content_type;
  
  -- 获取积分规则
  SELECT points, enabled INTO v_points, v_enabled
  FROM points_rules
  WHERE action = v_action;
  
  -- 如果积分规则存在且启用
  IF v_points IS NOT NULL AND v_enabled THEN
    -- 检查今天是否已经获得过该内容的浏览积分
    SELECT EXISTS (
      SELECT 1 FROM member_points_log
      WHERE user_id = p_user_id
        AND action = v_action
        AND reference_id = p_content_id::text
        AND created_at >= CURRENT_DATE
    ) INTO v_already_earned;
    
    -- 如果今天还没有获得过积分，则增加积分
    IF NOT v_already_earned THEN
      -- 更新用户积分
      UPDATE profiles
      SET points = points + v_points
      WHERE id = p_user_id;
      
      -- 记录积分日志
      INSERT INTO member_points_log (
        user_id,
        points,
        action,
        reason,
        description,
        reference_type,
        reference_id
      ) VALUES (
        p_user_id,
        v_points,
        v_action,
        '浏览内容获得积分',
        '浏览' || p_content_title,
        p_content_type,
        p_content_id::text
      );
      
      RAISE LOG '用户 % 浏览 % 获得 % 积分', p_user_id, p_content_title, v_points;
    END IF;
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    -- 记录错误但不影响浏览记录的添加
    RAISE WARNING '添加浏览积分失败: % %', SQLERRM, SQLSTATE;
END;
$$;

COMMENT ON FUNCTION add_browsing_history IS '
添加浏览历史记录，并自动增加浏览积分。
- 防止重复记录：删除旧记录后插入新记录
- 限制记录数量：每个用户最多保留100条浏览记录
- 自动增加积分：根据内容类型自动增加相应积分
- 防止刷分：同一内容每天只能获得一次浏览积分
';

-- ============================================
-- 4. 创建查看用户今日积分统计的函数
-- ============================================

CREATE OR REPLACE FUNCTION get_user_daily_points_stats(p_user_id uuid)
RETURNS TABLE (
  total_points int,
  view_points int,
  publish_points int,
  interaction_points int
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(points), 0)::int as total_points,
    COALESCE(SUM(CASE WHEN action LIKE 'view_%' THEN points ELSE 0 END), 0)::int as view_points,
    COALESCE(SUM(CASE WHEN action LIKE 'publish_%' THEN points ELSE 0 END), 0)::int as publish_points,
    COALESCE(SUM(CASE WHEN action NOT LIKE 'view_%' AND action NOT LIKE 'publish_%' THEN points ELSE 0 END), 0)::int as interaction_points
  FROM member_points_log
  WHERE user_id = p_user_id
    AND created_at >= CURRENT_DATE;
$$;

COMMENT ON FUNCTION get_user_daily_points_stats IS '
获取用户今日积分统计，包括：
- total_points: 今日总积分
- view_points: 浏览获得的积分
- publish_points: 发布获得的积分
- interaction_points: 互动获得的积分
';

-- ============================================
-- 5. 验证修改
-- ============================================

-- 测试积分规则是否添加成功
DO $$
DECLARE
  v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM points_rules
  WHERE action LIKE 'view_%';
  
  IF v_count >= 5 THEN
    RAISE NOTICE '✓ 浏览积分规则添加成功，共 % 条规则', v_count;
  ELSE
    RAISE WARNING '✗ 浏览积分规则添加失败，只有 % 条规则', v_count;
  END IF;
END $$;

