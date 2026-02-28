/*
# 修复管理员设置邮箱验证状态函数

## 问题
- profile_management_logs 表的列名与函数中使用的列名不匹配
- 表中有 action 列，但函数使用 action_type
- 表中没有 old_value 和 new_value 列

## 解决方案
- 更新函数以匹配实际的表结构
- 将验证状态信息记录在 reason 字段中
*/

-- 修复管理员设置邮箱验证状态的函数
CREATE OR REPLACE FUNCTION admin_set_email_verified(
  user_id uuid,
  verified boolean,
  admin_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  old_verified boolean;
  log_reason text;
BEGIN
  -- 检查是否为管理员
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can set email verification status';
  END IF;

  -- 获取当前验证状态
  SELECT email_verified INTO old_verified
  FROM profiles
  WHERE id = user_id;

  IF old_verified IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- 更新邮箱验证状态
  UPDATE profiles
  SET 
    email_verified = verified,
    email_verified_at = CASE WHEN verified THEN now() ELSE NULL END
  WHERE id = user_id;

  -- 构建日志原因
  log_reason := format('邮箱验证状态: %s -> %s', 
    CASE WHEN old_verified THEN '已验证' ELSE '未验证' END,
    CASE WHEN verified THEN '已验证' ELSE '未验证' END
  );
  
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
    'email_verification_update',
    log_reason
  );

  -- 如果设置为已验证，检查是否需要自动升级会员等级
  IF verified AND NOT old_verified THEN
    -- 自动升级到银卡会员（如果当前是铜卡或更低）
    UPDATE profiles
    SET member_level = 'silver'
    WHERE id = user_id
      AND (member_level IS NULL OR member_level = 'bronze');
  END IF;

  result := jsonb_build_object(
    'success', true,
    'user_id', user_id,
    'email_verified', verified,
    'message', CASE 
      WHEN verified THEN '邮箱已标记为已验证'
      ELSE '邮箱验证状态已取消'
    END
  );

  RETURN result;
END;
$$;
