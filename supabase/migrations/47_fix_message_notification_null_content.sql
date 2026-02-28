/*
# 修复消息通知content字段NULL值错误

## 问题描述
用户注册时出现错误：
"ERROR: null value in column "content" of relation "notifications" violates not-null constraint (SQLSTATE 23502)"

## 根本原因
create_message_notification()函数在处理系统消息时会产生NULL content：
1. 用户注册时，send_welcome_message_on_register()函数向messages表插入欢迎消息
2. 欢迎消息的sender_id为NULL（系统消息）
3. messages表的INSERT触发器调用create_message_notification()
4. 该函数使用子查询获取发送者用户名：
   `(SELECT username FROM profiles WHERE id = NEW.sender_id) || ' 给你发送了消息'`
5. 当sender_id为NULL时，子查询返回NULL
6. NULL || '任何字符串' = NULL
7. 尝试插入NULL到content字段，违反NOT NULL约束

## 解决方案
1. 修改create_message_notification()函数，处理sender_id为NULL的情况
2. 当sender_id为NULL时，使用"系统消息"作为发送者名称
3. 使用COALESCE确保content永远不为NULL
*/

-- 重新创建create_message_notification函数，处理NULL sender_id
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE
  sender_name text;
  notification_content text;
BEGIN
  -- 获取发送者用户名，如果sender_id为NULL则使用"系统"
  IF NEW.sender_id IS NULL THEN
    sender_name := '系统';
  ELSE
    SELECT username INTO sender_name 
    FROM profiles 
    WHERE id = NEW.sender_id;
    
    -- 如果找不到用户名，使用默认值
    sender_name := COALESCE(sender_name, '未知用户');
  END IF;
  
  -- 构建通知内容
  notification_content := sender_name || ' 给你发送了消息';
  
  -- 插入通知
  INSERT INTO notifications (user_id, type, title, content, related_type, related_id)
  VALUES (
    NEW.receiver_id,
    'message',
    '新的消息',
    notification_content,
    'message',
    NEW.id
  );
  
  RETURN NEW;
END;
$$;

-- 同样修复create_follow_notification函数，确保健壮性
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE
  follower_name text;
  notification_content text;
BEGIN
  -- 获取关注者用户名
  SELECT username INTO follower_name 
  FROM profiles 
  WHERE id = NEW.follower_id;
  
  -- 如果找不到用户名，使用默认值
  follower_name := COALESCE(follower_name, '某位用户');
  
  -- 构建通知内容
  notification_content := follower_name || ' 关注了你';
  
  -- 插入通知
  INSERT INTO notifications (user_id, type, title, content, related_type, related_id)
  VALUES (
    NEW.following_id,
    'follow',
    '新的关注',
    notification_content,
    'user',
    NEW.follower_id
  );
  
  RETURN NEW;
END;
$$;
