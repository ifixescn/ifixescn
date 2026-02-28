/*
# 添加邮箱验证系统

## 概述
1. 创建邮箱验证码表
2. 创建发送验证码的RPC函数
3. 创建验证邮箱的RPC函数
4. 添加验证邮件模板配置

## 表结构
- email_verification_codes: 邮箱验证码表
  - id (uuid): 主键
  - email (text): 邮箱地址
  - code (text): 6位验证码
  - created_at (timestamptz): 创建时间
  - expires_at (timestamptz): 过期时间
  - used (boolean): 是否已使用
  - used_at (timestamptz): 使用时间

## 功能
1. 用户可以请求发送邮箱验证码
2. 验证码有效期为10分钟
3. 验证成功后自动标记邮箱为已验证
4. 管理员可以配置验证邮件模板

## 安全性
- 验证码表启用RLS
- 用户只能查看自己的验证码
- 验证码10分钟后自动过期
- 每个邮箱每分钟最多发送一次验证码
*/

-- 创建邮箱验证码表
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '10 minutes'),
  used boolean DEFAULT false,
  used_at timestamptz
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email ON email_verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_expires_at ON email_verification_codes(expires_at);

-- 启用RLS
ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己邮箱的验证码
CREATE POLICY "Users can view their own verification codes" ON email_verification_codes
  FOR SELECT USING (
    email IN (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- 管理员可以查看所有验证码
CREATE POLICY "Admins can view all verification codes" ON email_verification_codes
  FOR SELECT USING (is_admin(auth.uid()));

-- 插入验证邮件模板配置
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES (
  'email_verification_template',
  jsonb_build_object(
    'enabled', true,
    'subject', 'Email Verification Code - iFixes',
    'content', 'Hello,\n\nYour email verification code is: {code}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this code, please ignore this email.\n\nBest regards,\niFixes Team'
  ),
  'Email verification template'
) ON CONFLICT (setting_key) DO UPDATE
SET setting_value = EXCLUDED.setting_value;

-- 创建生成6位随机验证码的函数
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
END;
$$;

-- 创建发送邮箱验证码的RPC函数
CREATE OR REPLACE FUNCTION send_email_verification_code(user_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  verification_code text;
  last_sent_time timestamptz;
  email_template jsonb;
  result jsonb;
BEGIN
  -- 验证邮箱格式
  IF user_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  -- 检查邮箱是否存在于profiles表中
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = user_email) THEN
    RAISE EXCEPTION 'Email not found in system';
  END IF;

  -- 检查是否在1分钟内已发送过验证码
  SELECT created_at INTO last_sent_time
  FROM email_verification_codes
  WHERE email = user_email
  ORDER BY created_at DESC
  LIMIT 1;

  IF last_sent_time IS NOT NULL AND (now() - last_sent_time) < interval '1 minute' THEN
    RAISE EXCEPTION 'Please wait before requesting another verification code';
  END IF;

  -- 生成验证码
  verification_code := generate_verification_code();

  -- 保存验证码到数据库
  INSERT INTO email_verification_codes (email, code)
  VALUES (user_email, verification_code);

  -- 获取邮件模板
  SELECT setting_value INTO email_template
  FROM system_settings
  WHERE setting_key = 'email_verification_template';

  -- 这里应该调用邮件发送服务
  -- 由于这是演示，我们只返回验证码（实际生产环境中不应该返回验证码）
  -- 在实际应用中，应该通过Edge Function调用邮件服务API

  result := jsonb_build_object(
    'success', true,
    'message', 'Verification code sent successfully',
    'email', user_email,
    'code', verification_code,  -- 仅用于开发测试，生产环境应删除此行
    'expires_in_minutes', 10
  );

  RETURN result;
END;
$$;

-- 创建验证邮箱验证码的RPC函数
CREATE OR REPLACE FUNCTION verify_email_code(
  user_email text,
  verification_code text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  code_record RECORD;
  user_id uuid;
BEGIN
  -- 验证邮箱格式
  IF user_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  -- 查找有效的验证码
  SELECT * INTO code_record
  FROM email_verification_codes
  WHERE email = user_email
    AND code = verification_code
    AND used = false
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  -- 如果没有找到有效的验证码
  IF code_record IS NULL THEN
    RETURN false;
  END IF;

  -- 标记验证码为已使用
  UPDATE email_verification_codes
  SET used = true, used_at = now()
  WHERE id = code_record.id;

  -- 获取用户ID
  SELECT id INTO user_id
  FROM profiles
  WHERE email = user_email;

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- 更新用户的邮箱验证状态
  UPDATE profiles
  SET 
    email_verified = true,
    email_verified_at = now()
  WHERE id = user_id;

  RETURN true;
END;
$$;

-- 创建清理过期验证码的函数
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM email_verification_codes
  WHERE expires_at < now() - interval '1 day';
END;
$$;

-- 注释：在生产环境中，应该设置定时任务定期调用 cleanup_expired_verification_codes() 函数
