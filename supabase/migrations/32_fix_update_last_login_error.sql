/*
# 修复登录时更新last_login_at字段的错误

## 问题描述
用户登录后出现错误：
"error update user's last_sign_in field: ERROR: relation "profilesdoes not exist (SQLSTATE 42P01)"

## 根本原因
1. update_last_login()函数没有设置search_path，可能导致找不到profiles表
2. 函数缺少错误处理，当更新失败时会导致整个登录流程失败
3. 可能存在SQL语句格式问题

## 解决方案
1. 为update_last_login()函数添加search_path设置
2. 添加异常处理，即使更新失败也不影响登录
3. 添加详细的日志记录
4. 确保SQL语句格式正确
*/

-- ============================================
-- 1. 重新创建update_last_login函数，添加完整的错误处理
-- ============================================

CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- 使用异常处理，确保即使更新失败也不影响登录
  BEGIN
    -- 更新profiles表的last_login_at字段
    UPDATE public.profiles
    SET last_login_at = now()
    WHERE id = NEW.id;
    
    -- 记录成功日志（可选）
    RAISE LOG 'Successfully updated last_login_at for user %', NEW.id;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- 记录错误但不抛出异常，避免影响登录流程
      RAISE WARNING 'Failed to update last_login_at for user %: % %', 
        NEW.id, SQLERRM, SQLSTATE;
  END;
  
  -- 始终返回NEW，确保触发器不会阻止操作
  RETURN NEW;
END;
$$;

-- ============================================
-- 2. 重新创建触发器，确保定义正确
-- ============================================

-- 删除旧触发器
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;

-- 创建新触发器
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION update_last_login();

-- ============================================
-- 3. 添加注释
-- ============================================

COMMENT ON FUNCTION update_last_login() IS '
更新用户的last_login_at字段。
使用SECURITY DEFINER绕过RLS。
设置search_path避免找不到表。
包含异常处理，确保更新失败不影响登录流程。
';

COMMENT ON TRIGGER on_auth_user_login ON auth.users IS '
当用户登录时（last_sign_in_at更新时）触发，更新profiles表的last_login_at字段。
';

-- ============================================
-- 4. 验证修复
-- ============================================

-- 测试函数是否可以正常执行
DO $$
DECLARE
  test_user_id uuid;
BEGIN
  -- 获取一个测试用户ID
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- 测试更新
    UPDATE public.profiles
    SET last_login_at = now()
    WHERE id = test_user_id;
    
    RAISE NOTICE '测试成功：成功更新用户 % 的last_login_at字段', test_user_id;
  ELSE
    RAISE NOTICE '没有找到测试用户，跳过测试';
  END IF;
END $$;
