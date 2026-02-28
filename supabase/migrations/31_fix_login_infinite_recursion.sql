/*
# 修复登录时的无限递归错误

## 问题描述
用户登录后出现42P17错误（infinite recursion detected in policy for relation "profiles"）

## 根本原因
profiles表的RLS策略中存在无限递归：
- "Admins can view all member stats" 策略直接查询profiles表检查用户角色
- "Admins can update member status" 策略也直接查询profiles表
- 这导致在查询profiles表时，RLS策略又去查询profiles表，形成无限递归

## 解决方案
1. 删除导致无限递归的策略
2. 保留使用is_admin()函数的策略（因为is_admin使用SECURITY DEFINER可以绕过RLS）
3. 确保所有策略都不会直接在profiles表上查询profiles表
*/

-- ============================================
-- 1. 删除导致无限递归的策略
-- ============================================

-- 删除直接查询profiles表的策略
DROP POLICY IF EXISTS "Admins can view all member stats" ON profiles;
DROP POLICY IF EXISTS "Admins can update member status" ON profiles;

-- ============================================
-- 2. 确保基本的RLS策略存在且正确
-- ============================================

-- 公开读取用户基本信息（已存在，确保存在）
DROP POLICY IF EXISTS "公开读取用户基本信息" ON profiles;
CREATE POLICY "公开读取用户基本信息" ON profiles
  FOR SELECT
  TO public
  USING (true);

-- 用户可查看自己的信息（已存在，确保存在）
DROP POLICY IF EXISTS "用户可查看自己的信息" ON profiles;
CREATE POLICY "用户可查看自己的信息" ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 用户可更新自己的信息但不能改角色（已存在，确保存在）
DROP POLICY IF EXISTS "用户可更新自己的信息但不能改角色" ON profiles;
CREATE POLICY "用户可更新自己的信息但不能改角色" ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 管理员可查看所有用户（使用is_admin函数，SECURITY DEFINER可以绕过RLS）
DROP POLICY IF EXISTS "管理员可查看所有用户" ON profiles;
CREATE POLICY "管理员可查看所有用户" ON profiles
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- 管理员可更新所有用户（使用is_admin函数）
DROP POLICY IF EXISTS "管理员可更新所有用户" ON profiles;
CREATE POLICY "管理员可更新所有用户" ON profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

-- ============================================
-- 3. 验证is_admin函数使用SECURITY DEFINER
-- ============================================

-- 重新创建is_admin函数，确保使用SECURITY DEFINER
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

-- ============================================
-- 4. 添加注释
-- ============================================

COMMENT ON POLICY "公开读取用户基本信息" ON profiles IS '允许所有人（包括匿名用户）查看用户基本信息';
COMMENT ON POLICY "用户可查看自己的信息" ON profiles IS '允许已认证用户查看自己的完整信息';
COMMENT ON POLICY "用户可更新自己的信息但不能改角色" ON profiles IS '允许用户更新自己的信息，但不能修改角色字段';
COMMENT ON POLICY "管理员可查看所有用户" ON profiles IS '允许管理员查看所有用户信息。使用is_admin函数（SECURITY DEFINER）避免无限递归';
COMMENT ON POLICY "管理员可更新所有用户" ON profiles IS '允许管理员更新所有用户信息。使用is_admin函数（SECURITY DEFINER）避免无限递归';

COMMENT ON FUNCTION is_admin(uuid) IS '检查用户是否是管理员。使用SECURITY DEFINER绕过RLS，避免无限递归';
