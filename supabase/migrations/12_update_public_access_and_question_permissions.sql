/*
# 更新公开访问权限和问答模块权限

## 1. 权限调整说明

### 公开访问（无需登录）
- 所有人可以查看已发布的文章
- 所有人可以查看已上架的产品
- 所有人可以查看已发布的问答
- 游客可以提交问题（需要审核）

### 会员权限
- 会员可以回答问题
- 会员可以查看自己提交的问题（包括待审核的）

### 管理员权限
- 管理员可以审核问题
- 管理员可以管理所有内容

## 2. 修改内容

### 2.1 问题表权限
- 允许匿名用户查看已发布的问题
- 允许匿名用户创建问题（状态为pending）
- 允许会员查看自己的问题

### 2.2 答案表权限
- 允许匿名用户查看所有答案
- 允许会员创建答案
- 允许作者编辑自己的答案

### 2.3 产品和文章权限
- 已有策略支持公开访问，无需修改

## 3. 安全考虑
- 游客提交的问题默认为pending状态，需要管理员审核
- 会员提交的答案立即可见
- 所有修改操作需要身份验证
*/

-- ============================================
-- 1. 删除旧的问题表策略
-- ============================================

DROP POLICY IF EXISTS "所有人可查看已发布问题" ON questions;
DROP POLICY IF EXISTS "作者可查看自己的问题" ON questions;
DROP POLICY IF EXISTS "管理员和编辑可查看所有问题" ON questions;
DROP POLICY IF EXISTS "作者可创建问题" ON questions;
DROP POLICY IF EXISTS "作者可更新自己的问题" ON questions;
DROP POLICY IF EXISTS "管理员和编辑可管理所有问题" ON questions;
DROP POLICY IF EXISTS "作者可删除自己的问题" ON questions;

-- ============================================
-- 2. 创建新的问题表策略
-- ============================================

-- 2.1 所有人（包括游客）可以查看已批准的问题
CREATE POLICY "公开访问已发布问题" ON questions
  FOR SELECT 
  USING (status = 'approved'::question_status);

-- 2.2 已登录用户可以查看自己的所有问题（包括待审核的）
CREATE POLICY "用户查看自己的问题" ON questions
  FOR SELECT 
  TO authenticated 
  USING (author_id = auth.uid());

-- 2.3 管理员和编辑可以查看所有问题
CREATE POLICY "管理员查看所有问题" ON questions
  FOR SELECT 
  TO authenticated 
  USING (is_editor_or_admin(auth.uid()));

-- 2.4 所有人（包括游客）可以创建问题，但状态必须为pending
CREATE POLICY "公开创建问题" ON questions
  FOR INSERT 
  WITH CHECK (status = 'pending'::question_status);

-- 2.5 已登录用户可以更新自己的待审核问题
CREATE POLICY "用户更新自己的待审核问题" ON questions
  FOR UPDATE 
  TO authenticated 
  USING (author_id = auth.uid() AND status = 'pending'::question_status)
  WITH CHECK (status = 'pending'::question_status);

-- 2.6 管理员和编辑可以管理所有问题
CREATE POLICY "管理员管理所有问题" ON questions
  FOR ALL 
  TO authenticated 
  USING (is_editor_or_admin(auth.uid()));

-- ============================================
-- 3. 删除旧的答案表策略
-- ============================================

DROP POLICY IF EXISTS "所有人可查看答案" ON answers;
DROP POLICY IF EXISTS "作者可创建答案" ON answers;
DROP POLICY IF EXISTS "作者可更新自己的答案" ON answers;
DROP POLICY IF EXISTS "管理员和编辑可管理所有答案" ON answers;
DROP POLICY IF EXISTS "作者可删除自己的答案" ON answers;

-- ============================================
-- 4. 创建新的答案表策略
-- ============================================

-- 4.1 所有人（包括游客）可以查看所有答案
CREATE POLICY "公开访问所有答案" ON answers
  FOR SELECT 
  USING (true);

-- 4.2 已登录用户（会员）可以创建答案
CREATE POLICY "会员创建答案" ON answers
  FOR INSERT 
  TO authenticated 
  WITH CHECK (author_id = auth.uid());

-- 4.3 作者可以更新自己的答案
CREATE POLICY "作者更新自己的答案" ON answers
  FOR UPDATE 
  TO authenticated 
  USING (author_id = auth.uid());

-- 4.4 管理员和编辑可以管理所有答案
CREATE POLICY "管理员管理所有答案" ON answers
  FOR ALL 
  TO authenticated 
  USING (is_editor_or_admin(auth.uid()));

-- 4.5 作者可以删除自己的答案
CREATE POLICY "作者删除自己的答案" ON answers
  FOR DELETE 
  TO authenticated 
  USING (author_id = auth.uid());

-- ============================================
-- 5. 确保产品图片表的公开访问
-- ============================================

DROP POLICY IF EXISTS "所有人可查看产品图片" ON product_images;

CREATE POLICY "公开访问产品图片" ON product_images
  FOR SELECT 
  USING (true);

-- ============================================
-- 6. 确保分类表的公开访问
-- ============================================

DROP POLICY IF EXISTS "所有人可查看分类" ON categories;

CREATE POLICY "公开访问分类" ON categories
  FOR SELECT 
  USING (true);

-- ============================================
-- 7. 创建问题审核函数（供管理员使用）
-- ============================================

CREATE OR REPLACE FUNCTION approve_question(question_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 检查是否为管理员或编辑
  IF NOT is_editor_or_admin(auth.uid()) THEN
    RAISE EXCEPTION '只有管理员和编辑可以审核问题';
  END IF;
  
  -- 更新问题状态为已批准
  UPDATE questions 
  SET status = 'approved'::question_status, 
      updated_at = now()
  WHERE id = question_id;
END;
$$;

-- ============================================
-- 8. 创建问题拒绝函数（供管理员使用）
-- ============================================

CREATE OR REPLACE FUNCTION reject_question(question_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 检查是否为管理员或编辑
  IF NOT is_editor_or_admin(auth.uid()) THEN
    RAISE EXCEPTION '只有管理员和编辑可以拒绝问题';
  END IF;
  
  -- 删除问题
  DELETE FROM questions WHERE id = question_id;
END;
$$;

-- ============================================
-- 9. 添加游客问题提交字段（可选）
-- ============================================

-- 为游客提交的问题添加联系信息字段
ALTER TABLE questions ADD COLUMN IF NOT EXISTS guest_name text;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS guest_email text;

-- 添加注释
COMMENT ON COLUMN questions.guest_name IS '游客提交问题时的姓名';
COMMENT ON COLUMN questions.guest_email IS '游客提交问题时的邮箱';
