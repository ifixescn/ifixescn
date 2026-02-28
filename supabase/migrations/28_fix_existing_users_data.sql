/*
# 修复现有用户数据 - 确保所有用户都有完整的字段

## 更新内容
1. 为所有现有用户添加缺失的字段值
2. 确保数据一致性
*/

-- ============================================
-- 1. 修复status字段
-- ============================================

-- 为所有没有status的用户设置默认值
UPDATE profiles 
SET status = 'active' 
WHERE status IS NULL OR status = '';

-- ============================================
-- 2. 修复level字段
-- ============================================

-- 为所有没有level或level无效的用户设置默认值
UPDATE profiles 
SET level = 1 
WHERE level IS NULL OR level < 1 OR level > 5;

-- ============================================
-- 3. 修复points字段
-- ============================================

-- 为所有没有points的用户设置默认值
UPDATE profiles 
SET points = 0 
WHERE points IS NULL;

-- ============================================
-- 4. 修复计数字段
-- ============================================

-- 为所有没有total_articles的用户设置默认值
UPDATE profiles 
SET total_articles = 0 
WHERE total_articles IS NULL;

-- 为所有没有total_questions的用户设置默认值
UPDATE profiles 
SET total_questions = 0 
WHERE total_questions IS NULL;

-- 为所有没有total_answers的用户设置默认值
UPDATE profiles 
SET total_answers = 0 
WHERE total_answers IS NULL;

-- ============================================
-- 5. 修复role字段
-- ============================================

-- 为所有没有role的用户设置默认值
UPDATE profiles 
SET role = 'member'::user_role 
WHERE role IS NULL;

-- ============================================
-- 6. 确保字段约束
-- ============================================

-- 确保status字段不为空
ALTER TABLE profiles ALTER COLUMN status SET DEFAULT 'active';
ALTER TABLE profiles ALTER COLUMN status SET NOT NULL;

-- 确保level字段不为空
ALTER TABLE profiles ALTER COLUMN level SET DEFAULT 1;
ALTER TABLE profiles ALTER COLUMN level SET NOT NULL;

-- 确保points字段不为空
ALTER TABLE profiles ALTER COLUMN points SET DEFAULT 0;
ALTER TABLE profiles ALTER COLUMN points SET NOT NULL;

-- 确保计数字段不为空
ALTER TABLE profiles ALTER COLUMN total_articles SET DEFAULT 0;
ALTER TABLE profiles ALTER COLUMN total_articles SET NOT NULL;

ALTER TABLE profiles ALTER COLUMN total_questions SET DEFAULT 0;
ALTER TABLE profiles ALTER COLUMN total_questions SET NOT NULL;

ALTER TABLE profiles ALTER COLUMN total_answers SET DEFAULT 0;
ALTER TABLE profiles ALTER COLUMN total_answers SET NOT NULL;

-- ============================================
-- 7. 添加检查约束
-- ============================================

-- 确保status只能是有效值
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_status_check'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_status_check 
    CHECK (status IN ('active', 'disabled', 'suspended'));
  END IF;
END $$;

-- 确保level在有效范围内
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_level_check'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_level_check 
    CHECK (level >= 1 AND level <= 5);
  END IF;
END $$;

-- 确保points不为负数
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_points_check'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_points_check 
    CHECK (points >= 0);
  END IF;
END $$;
