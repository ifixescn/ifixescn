/*
# 添加邮箱验证和欢迎消息功能

## 概述
1. 添加系统设置表，用于存储欢迎消息模板
2. 创建自动发送欢迎消息的触发器
3. 添加邮箱验证后自动升级为Silver会员的功能
4. 添加管理员手动设置邮箱验证状态的RPC函数

## 表结构
- system_settings: 系统设置表
  - id (uuid): 主键
  - setting_key (text): 设置键名
  - setting_value (jsonb): 设置值
  - description (text): 设置描述
  - updated_at (timestamptz): 更新时间
  - updated_by (uuid): 更新者ID

## 功能
1. 新会员注册时自动发送欢迎消息
2. 邮箱验证后自动升级为Silver会员
3. 管理员可以手动设置会员的邮箱验证状态
4. 管理员可以编辑欢迎消息模板

## 安全性
- system_settings表启用RLS
- 只有管理员可以修改系统设置
- 所有用户可以读取系统设置
*/

-- 创建系统设置表
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES profiles(id)
);

-- 启用RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- 所有人可以读取系统设置
CREATE POLICY "Anyone can read system settings" ON system_settings
  FOR SELECT USING (true);

-- 只有管理员可以修改系统设置
CREATE POLICY "Only admins can modify system settings" ON system_settings
  FOR ALL USING (is_admin(auth.uid()));

-- 插入默认欢迎消息模板
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES (
  'welcome_message_template',
  jsonb_build_object(
    'enabled', true,
    'title', '欢迎加入iFixes官方平台！',
    'content', '亲爱的 {username}，\n\n欢迎您注册成为iFixes官方平台的会员！\n\n我们很高兴您的加入。在这里，您可以：\n- 与技术专家在线交流\n- 获取最新的技术资讯\n- 享受会员专属服务\n\n温馨提示：验证您的邮箱后，您将自动升级为Silver会员，享受更多特权！\n\n如有任何问题，请随时联系我们的客服团队。\n\n祝您使用愉快！\n\niFixes团队'
  ),
  '新会员注册欢迎消息模板'
) ON CONFLICT (setting_key) DO NOTHING;

-- 创建自动发送欢迎消息的触发器函数
CREATE OR REPLACE FUNCTION send_welcome_message_on_register()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  welcome_settings jsonb;
  message_title text;
  message_content text;
BEGIN
  -- 获取欢迎消息设置
  SELECT setting_value INTO welcome_settings
  FROM system_settings
  WHERE setting_key = 'welcome_message_template';

  -- 检查是否启用欢迎消息
  IF welcome_settings IS NOT NULL AND (welcome_settings->>'enabled')::boolean = true THEN
    -- 获取消息标题和内容
    message_title := welcome_settings->>'title';
    message_content := welcome_settings->>'content';
    
    -- 替换占位符
    message_content := replace(message_content, '{username}', COALESCE(NEW.username, NEW.nickname, '用户'));
    
    -- 插入站内消息
    INSERT INTO messages (
      sender_id,
      receiver_id,
      title,
      content,
      message_type
    ) VALUES (
      NULL,  -- 系统消息，sender_id为NULL
      NEW.id,
      message_title,
      message_content,
      'system'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 创建触发器：新用户注册时发送欢迎消息
DROP TRIGGER IF EXISTS trigger_send_welcome_message ON profiles;
CREATE TRIGGER trigger_send_welcome_message
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION send_welcome_message_on_register();

-- 创建邮箱验证后自动升级为Silver会员的触发器函数
CREATE OR REPLACE FUNCTION auto_upgrade_to_silver_on_email_verified()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 检查邮箱是否刚刚被验证（从false变为true）
  IF NEW.email_verified = true AND (OLD.email_verified IS NULL OR OLD.email_verified = false) THEN
    -- 如果当前是Bronze会员，自动升级为Silver
    IF NEW.member_level = 'bronze' THEN
      NEW.member_level := 'silver';
      
      -- 发送升级通知消息
      INSERT INTO messages (
        sender_id,
        receiver_id,
        title,
        content,
        message_type
      ) VALUES (
        NULL,
        NEW.id,
        '恭喜！您已升级为Silver会员',
        '亲爱的 ' || COALESCE(NEW.username, NEW.nickname, '用户') || '，\n\n恭喜您成功验证邮箱！\n\n您的会员等级已自动升级为Silver会员。现在您可以：\n- 设置个人主页\n- 享受更多会员特权\n- 获得优先技术支持\n\n感谢您对iFixes的支持！\n\niFixes团队',
        'system'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 创建触发器：邮箱验证后自动升级
DROP TRIGGER IF EXISTS trigger_auto_upgrade_on_email_verified ON profiles;
CREATE TRIGGER trigger_auto_upgrade_on_email_verified
  BEFORE UPDATE OF email_verified ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_upgrade_to_silver_on_email_verified();

-- 创建管理员手动设置邮箱验证状态的RPC函数
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

  -- 记录操作日志（如果有profile_management_logs表）
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_management_logs') THEN
    INSERT INTO profile_management_logs (
      profile_id,
      admin_id,
      action_type,
      old_value,
      new_value,
      reason
    ) VALUES (
      user_id,
      auth.uid(),
      'email_verification',
      old_verified::text,
      verified::text,
      admin_note
    );
  END IF;

  result := jsonb_build_object(
    'success', true,
    'user_id', user_id,
    'email_verified', verified,
    'message', CASE 
      WHEN verified THEN 'Email verification status set to verified'
      ELSE 'Email verification status set to unverified'
    END
  );

  RETURN result;
END;
$$;

-- 创建管理员编辑会员邮箱的RPC函数
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

  -- 记录操作日志
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_management_logs') THEN
    INSERT INTO profile_management_logs (
      profile_id,
      admin_id,
      action_type,
      old_value,
      new_value,
      reason
    ) VALUES (
      user_id,
      auth.uid(),
      'email_update',
      old_email,
      new_email,
      admin_note
    );
  END IF;

  result := jsonb_build_object(
    'success', true,
    'user_id', user_id,
    'old_email', old_email,
    'new_email', new_email,
    'message', 'Email updated successfully. User needs to verify the new email.'
  );

  RETURN result;
END;
$$;

-- 创建更新欢迎消息模板的RPC函数
CREATE OR REPLACE FUNCTION admin_update_welcome_message(
  enabled boolean,
  title text,
  content text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 检查是否为管理员
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can update welcome message template';
  END IF;

  -- 更新欢迎消息模板
  UPDATE system_settings
  SET 
    setting_value = jsonb_build_object(
      'enabled', enabled,
      'title', title,
      'content', content
    ),
    updated_at = now(),
    updated_by = auth.uid()
  WHERE setting_key = 'welcome_message_template';

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Welcome message template updated successfully'
  );
END;
$$;
