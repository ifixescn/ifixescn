/*
# 会员系统升级 - Part 2: 触发器和安全策略

## 1. 创建触发器
## 2. 创建安全策略
## 3. 创建视图和辅助函数
*/

-- ============================================
-- 1. 创建触发器 - 文章发布时增加积分和统计
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
-- 2. 创建触发器 - 提问时增加积分和统计
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
-- 3. 创建触发器 - 回答时增加积分和统计
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
-- 4. 创建触发器 - 回答被采纳时额外增加积分
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
-- 5. 安全策略 - member_levels
-- ============================================

ALTER TABLE member_levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view member levels" ON member_levels;
CREATE POLICY "Anyone can view member levels"
  ON member_levels FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Only admins can modify member levels" ON member_levels;
CREATE POLICY "Only admins can modify member levels"
  ON member_levels FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- ============================================
-- 6. 安全策略 - member_points_log
-- ============================================

ALTER TABLE member_points_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own points log" ON member_points_log;
CREATE POLICY "Users can view own points log"
  ON member_points_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin(auth.uid()));

-- ============================================
-- 7. 安全策略 - browsing_history
-- ============================================

ALTER TABLE browsing_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own browsing history" ON browsing_history;
CREATE POLICY "Users can manage own browsing history"
  ON browsing_history FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all browsing history" ON browsing_history;
CREATE POLICY "Admins can view all browsing history"
  ON browsing_history FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- ============================================
-- 8. 安全策略 - member_submissions
-- ============================================

ALTER TABLE member_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own submissions" ON member_submissions;
CREATE POLICY "Users can view own submissions"
  ON member_submissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin(auth.uid()) OR is_editor(auth.uid()));

DROP POLICY IF EXISTS "Users can create submissions" ON member_submissions;
CREATE POLICY "Users can create submissions"
  ON member_submissions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins and editors can update submissions" ON member_submissions;
CREATE POLICY "Admins and editors can update submissions"
  ON member_submissions FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()) OR is_editor(auth.uid()))
  WITH CHECK (is_admin(auth.uid()) OR is_editor(auth.uid()));

-- ============================================
-- 9. 创建视图 - 会员统计信息
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
-- 10. 创建函数 - 获取会员排行榜
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
