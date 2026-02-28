/*
# 修复欢迎通知content字段NULL值错误

## 问题描述
注册会员时出现错误：
"ERROR: null value in column "content" of relation "notifications" violates not-null constraint (SQLSTATE 23502)"

## 根本原因
send_welcome_notification()函数在插入notifications时，虽然检查了welcome_template IS NOT NULL，
但没有检查welcome_template.subject和welcome_template.content是否为NULL。
当message_templates表中的数据存在但字段值为NULL时，就会导致插入NULL值。

## 解决方案
1. 增强send_welcome_notification()函数的NULL值检查
2. 确保只有在subject和content都不为NULL时才插入通知
3. 添加默认值作为后备方案
*/

-- 重新创建send_welcome_notification函数，增强NULL值检查
CREATE OR REPLACE FUNCTION send_welcome_notification()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE
  welcome_subject text;
  welcome_content text;
BEGIN
  -- 获取欢迎消息模板的subject和content
  SELECT subject, content INTO welcome_subject, welcome_content
  FROM message_templates 
  WHERE template_key = 'welcome_message';
  
  -- 只有在subject和content都不为NULL时才插入通知
  IF welcome_subject IS NOT NULL AND welcome_content IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, content, is_read)
    VALUES (NEW.id, 'system', welcome_subject, welcome_content, false);
  ELSE
    -- 如果模板不存在或字段为NULL，使用默认欢迎消息
    INSERT INTO notifications (user_id, type, title, content, is_read)
    VALUES (
      NEW.id, 
      'system', 
      '欢迎加入iFixes服务平台！', 
      '亲爱的 ' || COALESCE(NEW.username, NEW.nickname, '用户') || '，

欢迎您注册成为iFixes服务平台的会员！

我们很高兴您能加入我们。在这里，您可以：
- 在线交流技术专家
- 获取最新的技术资讯
- 享受专属会员服务

温馨提示：验证邮箱后，您将自动升级为Silver会员，享受更多特权！

如有任何问题，请随时联系我们的客服团队。

祝您使用愉快！

iFixes团队',
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 确保message_templates表中的welcome_message模板数据完整
UPDATE message_templates
SET 
  subject = COALESCE(subject, '欢迎加入iFixes服务平台！'),
  content = COALESCE(content, 'Dear Member,

Welcome to our community! We are thrilled to have you here.

As a Bronze member, you can now:
- Browse and read all articles
- Ask questions and get answers
- Participate in community discussions

To unlock more features and become a Silver member, please verify your email address.

Best regards,
The Team')
WHERE template_key = 'welcome_message' AND (subject IS NULL OR content IS NULL);
