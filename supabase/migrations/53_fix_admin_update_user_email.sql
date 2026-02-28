/*
# 修复管理员更新用户邮箱函数

## 问题
- profile_management_logs 表的列名与函数中使用的列名不匹配
- 表中有 action 列，但函数使用 action_type
- 表中没有 old_value 和 new_value 列

## 解决方案
- 更新函数以匹配实际的表结构
- 将邮箱变更信息记录在 reason 字段中
*/

-- 修复管理员更新用户邮箱的函数
CREATE OR REPLACE FUNCTION admin_update_user_email(
  user_id uuid,
  new_email text,
  admin_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  old_email text;
  log_reason text;
BEGIN
  -- 检查是否为管理员
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can update user email';
  END IF;

  -- 验证邮箱格式
  IF new_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  -- 获取旧邮箱
  SELECT email INTO old_email
  FROM profiles
  WHERE id = user_id;

  IF old_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- 检查新邮箱是否已被使用
  IF EXISTS (SELECT 1 FROM profiles WHERE email = new_email AND id != user_id) THEN
    RAISE EXCEPTION 'Email already in use';
  END IF;

  -- 更新邮箱
  UPDATE profiles
  SET 
    email = new_email,
    email_verified = false,  -- 更改邮箱后需要重新验证
    email_verified_at = NULL
  WHERE id = user_id;

  -- 构建日志原因
  log_reason := format('邮箱更新: %s -> %s', old_email, new_email);
  
  IF admin_note IS NOT NULL THEN
    log_reason := log_reason || '. ' || admin_note;
  END IF;

  -- 记录操作日志
  INSERT INTO profile_management_logs (
    profile_id,
    admin_id,
    action,
    reason
  ) VALUES (
    user_id,
    auth.uid(),
    'email_update',
    log_reason
  );

  result := jsonb_build_object(
    'success', true,
    'user_id', user_id,
    'old_email', old_email,
    'new_email', new_email,
    'message', '邮箱更新成功，用户需要重新验证邮箱'
  );

  RETURN result;
END;
$$;
