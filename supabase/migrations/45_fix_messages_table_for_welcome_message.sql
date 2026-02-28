/*
# 修复messages表以支持欢迎消息功能

## 问题描述
注册会员时出现错误：
"ERROR: column "title" of relation "messages" does not exist (SQLSTATE 42703)"

## 根本原因
1. messages表中的字段名是"subject"，但代码中使用了"title"
2. messages表缺少"message_type"字段来区分系统消息和用户消息
3. sender_id字段是NOT NULL，但系统消息需要使用NULL

## 解决方案
1. 修改sender_id字段允许NULL值（用于系统消息）
2. 添加message_type字段
3. 更新欢迎消息和升级通知的触发器函数，使用正确的字段名
*/

-- 1. 修改sender_id字段允许NULL（用于系统消息）
ALTER TABLE messages ALTER COLUMN sender_id DROP NOT NULL;

-- 2. 添加message_type字段
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'user' NOT NULL;

-- 添加注释
COMMENT ON COLUMN messages.message_type IS '消息类型：system=系统消息, user=用户消息';

-- 3. 重新创建发送欢迎消息的触发器函数
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
    
    -- 插入站内消息（使用正确的字段名）
    INSERT INTO messages (
      sender_id,
      receiver_id,
      subject,
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

-- 4. 重新创建邮箱验证后自动升级的触发器函数
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
      
      -- 发送升级通知消息（使用正确的字段名）
      INSERT INTO messages (
        sender_id,
        receiver_id,
        subject,
        content,
        message_type
      ) VALUES (
        NULL,
        NEW.id,
        '恭喜！您已升级为Silver会员',
        '亲爱的 ' || COALESCE(NEW.username, NEW.nickname, '用户') || '，

恭喜您成功验证邮箱！

您的会员等级已自动升级为Silver会员。现在您可以：
- 设置个人主页
- 享受更多会员特权
- 获得优先技术支持

感谢您对iFixes的支持！

iFixes团队',
        'system'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 5. 更新现有消息的message_type（如果有的话）
UPDATE messages SET message_type = 'user' WHERE message_type IS NULL;

-- 6. 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id_created_at ON messages(receiver_id, created_at DESC);
