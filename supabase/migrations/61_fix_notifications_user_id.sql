/*
# 修复 notifications 表列名错误

## 问题描述
Migration 60 错误地将 notifications 表的列名从 user_id 改为 member_id
但实际上 notifications 表使用的就是 user_id 列

## 错误信息
ERROR: column "member_id" of relation "notifications" does not exist (SQLSTATE 42703)

## 实际表结构
notifications 表的列：
- id (uuid)
- user_id (uuid) ← 正确的列名
- type (text)
- title (text)
- content (text)
- related_type (text)
- related_id (uuid)
- is_read (boolean)
- created_at (timestamptz)

## 解决方案
将 send_welcome_notification() 函数中的 member_id 改回 user_id
保持 messages 表的 subject 列名不变（这个是正确的）

## 修改内容
1. 修复 notifications 表 INSERT 语句：member_id → user_id
2. 保持 messages 表 INSERT 语句：使用 subject（正确）
*/

-- 更新 send_welcome_notification 函数，使用正确的列名
CREATE OR REPLACE FUNCTION send_welcome_notification()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE
  welcome_subject text;
  welcome_content text;
  welcome_settings jsonb;
  message_title text;
  message_content text;
  system_user_id uuid;
BEGIN
  -- 获取系统管理员用户ID（第一个管理员用户）
  SELECT id INTO system_user_id
  FROM profiles
  WHERE role = 'admin'
  ORDER BY created_at ASC
  LIMIT 1;
  
  -- 如果没有管理员，使用 NULL 表示系统消息
  IF system_user_id IS NULL THEN
    system_user_id := NULL;
  END IF;

  -- 从 message_templates 获取欢迎消息模板
  SELECT subject, content INTO welcome_subject, welcome_content
  FROM message_templates 
  WHERE template_key = 'welcome_message';
  
  -- 插入通知（始终发送）- 使用正确的列名 "user_id"
  IF welcome_subject IS NOT NULL AND welcome_content IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, content, is_read)
    VALUES (NEW.id, 'system', welcome_subject, welcome_content, false);
  ELSE
    -- 使用默认欢迎通知
    INSERT INTO notifications (user_id, type, title, content, is_read)
    VALUES (
      NEW.id, 
      'system', 
      'Welcome to Our Community!', 
      'Dear ' || COALESCE(NEW.username, NEW.nickname, 'Member') || ',

Welcome to our community!

We are delighted to have you join us. Here you can:
- Connect with experts online
- Get the latest information
- Enjoy exclusive member services

Tip: After verifying your email, you will automatically be upgraded to Silver membership with more privileges!

If you have any questions, please feel free to contact our support team.

Enjoy your experience!

The Team',
      false
    );
  END IF;

  -- 从 system_settings 获取欢迎消息设置
  SELECT setting_value INTO welcome_settings
  FROM system_settings
  WHERE setting_key = 'welcome_message_template';

  -- 如果启用，发送欢迎消息
  IF welcome_settings IS NOT NULL AND (welcome_settings->>'enabled')::boolean = true THEN
    message_title := welcome_settings->>'title';
    message_content := welcome_settings->>'content';
    
    -- 替换占位符
    message_content := replace(message_content, '{username}', COALESCE(NEW.username, NEW.nickname, 'Member'));
    
    -- 插入欢迎消息 - 使用正确的列名 "subject"
    IF message_title IS NOT NULL AND message_content IS NOT NULL THEN
      INSERT INTO messages (
        sender_id,
        receiver_id,
        subject,
        content,
        message_type,
        is_read
      ) VALUES (
        system_user_id,
        NEW.id,
        message_title,
        message_content,
        'system',
        false
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION send_welcome_notification() IS 'Unified function to send welcome notification and message to new members (fixed: notifications.user_id, messages.subject)';
