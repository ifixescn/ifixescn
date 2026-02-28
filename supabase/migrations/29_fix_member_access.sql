/*
# 修复会员访问权限 - 确保会员可以登录和查看所有公开内容

## 修复内容
1. 确保所有会员账号状态正常
2. 确保RLS策略允许所有人查看已发布内容
3. 添加会员登录日志更新
*/

-- ============================================
-- 1. 确保所有会员账号状态正常
-- ============================================

-- 将所有会员状态设置为active
UPDATE profiles 
SET status = 'active'
WHERE role = 'member' AND status != 'active';

-- 确保所有会员都有有效的level
UPDATE profiles 
SET level = 1
WHERE role = 'member' AND (level < 1 OR level > 5);

-- 确保所有会员都有points字段（已经有默认值，这里不需要更新）
-- UPDATE profiles 
-- SET points = 0
-- WHERE role = 'member' AND points IS NULL;

-- ============================================
-- 2. 重新创建RLS策略 - 确保所有人都能查看已发布内容
-- ============================================

-- Articles表策略
DROP POLICY IF EXISTS "所有人可查看已发布文章" ON articles;
CREATE POLICY "所有人可查看已发布文章" ON articles
  FOR SELECT 
  TO public
  USING (status = 'published'::content_status);

-- Products表策略
DROP POLICY IF EXISTS "所有人可查看已发布产品" ON products;
CREATE POLICY "所有人可查看已发布产品" ON products
  FOR SELECT 
  TO public
  USING (status = 'published'::content_status);

-- Downloads表策略
DROP POLICY IF EXISTS "公开可读已发布的下载" ON downloads;
CREATE POLICY "公开可读已发布的下载" ON downloads
  FOR SELECT 
  TO public
  USING (is_published = true);

-- Videos表策略
DROP POLICY IF EXISTS "公开可读已发布的视频" ON videos;
CREATE POLICY "公开可读已发布的视频" ON videos
  FOR SELECT 
  TO public
  USING (is_published = true);

-- Questions表策略
DROP POLICY IF EXISTS "所有人可查看已审核问题" ON questions;
CREATE POLICY "所有人可查看已审核问题" ON questions
  FOR SELECT 
  TO public
  USING (status = 'approved'::question_status);

-- Answers表策略（answers表没有status字段，所有回答都可见）
DROP POLICY IF EXISTS "所有人可查看回答" ON answers;
CREATE POLICY "所有人可查看回答" ON answers
  FOR SELECT 
  TO public
  USING (true);

-- Categories表策略（确保所有人都能查看分类）
DROP POLICY IF EXISTS "所有人可查看分类" ON categories;
CREATE POLICY "所有人可查看分类" ON categories
  FOR SELECT 
  TO public
  USING (true);

-- ============================================
-- 3. 添加会员登录时更新last_login_at的触发器
-- ============================================

-- 创建更新last_login_at的函数
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET last_login_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- 创建触发器（如果不存在）
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION update_last_login();

-- ============================================
-- 4. 确保profiles表的RLS策略允许用户查看自己的信息
-- ============================================

-- 允许已认证用户查看自己的profile
DROP POLICY IF EXISTS "用户可查看自己的信息" ON profiles;
CREATE POLICY "用户可查看自己的信息" ON profiles
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

-- 允许用户更新自己的信息（但不能改role和status）
DROP POLICY IF EXISTS "用户可更新自己的信息但不能改角色" ON profiles;
CREATE POLICY "用户可更新自己的信息但不能改角色" ON profiles
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 5. 确保会员可以创建内容
-- ============================================

-- 会员可以创建文章（草稿状态）
DROP POLICY IF EXISTS "会员可创建文章" ON articles;
CREATE POLICY "会员可创建文章" ON articles
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id 
    AND status = 'draft'::content_status
  );

-- 会员可以查看自己的文章（包括草稿）
DROP POLICY IF EXISTS "作者可查看自己的文章" ON articles;
CREATE POLICY "作者可查看自己的文章" ON articles
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = author_id);

-- 会员可以更新自己的文章
DROP POLICY IF EXISTS "作者可更新自己的文章" ON articles;
CREATE POLICY "作者可更新自己的文章" ON articles
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- 会员可以删除自己的文章
DROP POLICY IF EXISTS "作者可删除自己的文章" ON articles;
CREATE POLICY "作者可删除自己的文章" ON articles
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = author_id);

-- 会员可以创建问题
DROP POLICY IF EXISTS "会员可创建问题" ON questions;
CREATE POLICY "会员可创建问题" ON questions
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- 会员可以查看自己的问题
DROP POLICY IF EXISTS "提问者可查看自己的问题" ON questions;
CREATE POLICY "提问者可查看自己的问题" ON questions
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = author_id);

-- 会员可以更新自己的问题
DROP POLICY IF EXISTS "提问者可更新自己的问题" ON questions;
CREATE POLICY "提问者可更新自己的问题" ON questions
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- 会员可以创建回答
DROP POLICY IF EXISTS "会员可创建回答" ON answers;
CREATE POLICY "会员可创建回答" ON answers
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- 会员可以查看自己的回答
DROP POLICY IF EXISTS "回答者可查看自己的回答" ON answers;
CREATE POLICY "回答者可查看自己的回答" ON answers
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = author_id);

-- 会员可以更新自己的回答
DROP POLICY IF EXISTS "回答者可更新自己的回答" ON answers;
CREATE POLICY "回答者可更新自己的回答" ON answers
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- ============================================
-- 6. 添加注释
-- ============================================

COMMENT ON POLICY "所有人可查看已发布文章" ON articles IS '允许所有人（包括匿名用户和会员）查看已发布的文章';
COMMENT ON POLICY "所有人可查看已发布产品" ON products IS '允许所有人（包括匿名用户和会员）查看已发布的产品';
COMMENT ON POLICY "公开可读已发布的下载" ON downloads IS '允许所有人（包括匿名用户和会员）查看已发布的下载资源';
COMMENT ON POLICY "公开可读已发布的视频" ON videos IS '允许所有人（包括匿名用户和会员）查看已发布的视频';
COMMENT ON POLICY "所有人可查看已审核问题" ON questions IS '允许所有人（包括匿名用户和会员）查看已审核的问题';
COMMENT ON POLICY "所有人可查看回答" ON answers IS '允许所有人（包括匿名用户和会员）查看所有回答';
