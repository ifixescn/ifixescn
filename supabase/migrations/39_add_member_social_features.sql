/*
# 会员社交功能增强

## 1. 新增表结构
- `message_templates` - 消息模板表
- `follows` - 关注关系表
- `direct_messages` - 站内信表

## 2. profiles表扩展
- 邮箱验证相关字段
- 个人主页相关字段

## 3. 安全策略
- 消息模板：管理员可管理，所有人可读
- 关注关系：用户可管理自己的关注，所有人可查看
- 站内信：仅发送者和接收者可见

## 4. 初始数据
- 插入欢迎消息模板（英文）
*/

-- 1. 扩展profiles表
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS location text;

-- 更新现有用户为bronze等级
UPDATE profiles SET member_level = 'bronze'::member_level 
WHERE member_level IN ('member'::member_level, 'guest'::member_level);

-- 2. 创建消息模板表
CREATE TABLE IF NOT EXISTS message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text UNIQUE NOT NULL,
  template_name text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. 创建关注关系表
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- 4. 创建站内信表
CREATE TABLE IF NOT EXISTS direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CHECK (sender_id != receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver ON direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created ON direct_messages(created_at DESC);

-- 5. 安全策略

-- message_templates 策略
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "所有人可查看消息模板" ON message_templates
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "管理员可管理消息模板" ON message_templates
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- follows 策略
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "所有人可查看关注关系" ON follows
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "用户可关注他人" ON follows
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "用户可取消关注" ON follows
  FOR DELETE TO authenticated 
  USING (auth.uid() = follower_id);

-- direct_messages 策略
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可查看自己的消息" ON direct_messages
  FOR SELECT TO authenticated 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "用户可发送消息" ON direct_messages
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "接收者可标记已读" ON direct_messages
  FOR UPDATE TO authenticated 
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- 6. 创建辅助函数

-- 检查是否为好友（相互关注）
CREATE OR REPLACE FUNCTION are_friends(user1_id uuid, user2_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM follows 
    WHERE follower_id = user1_id AND following_id = user2_id
  ) AND EXISTS (
    SELECT 1 FROM follows 
    WHERE follower_id = user2_id AND following_id = user1_id
  );
$$;

-- 获取用户关注数
CREATE OR REPLACE FUNCTION get_following_count(user_id uuid)
RETURNS bigint LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*) FROM follows WHERE follower_id = user_id;
$$;

-- 获取用户粉丝数
CREATE OR REPLACE FUNCTION get_followers_count(user_id uuid)
RETURNS bigint LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*) FROM follows WHERE following_id = user_id;
$$;

-- 获取未读消息数
CREATE OR REPLACE FUNCTION get_unread_messages_count(user_id uuid)
RETURNS bigint LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*) FROM direct_messages 
  WHERE receiver_id = user_id AND is_read = false;
$$;

-- 验证邮箱并升级会员等级
CREATE OR REPLACE FUNCTION verify_email_and_upgrade(user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles 
  SET 
    email_verified = true,
    email_verified_at = now(),
    member_level = 'silver'::member_level
  WHERE id = user_id AND email_verified = false;
END;
$$;

-- 7. 插入默认消息模板

INSERT INTO message_templates (template_key, template_name, subject, content) VALUES
('welcome_message', 'Welcome Message', 'Welcome to Our Community!', 
'Dear Member,

Welcome to our community! We are thrilled to have you here.

As a Bronze member, you can now:
- Browse and read all articles
- Ask questions and get answers
- Participate in community discussions

To unlock more features and become a Silver member, please verify your email address.

Best regards,
The Team')
ON CONFLICT (template_key) DO NOTHING;

-- 8. 创建触发器：新用户注册时发送欢迎消息

CREATE OR REPLACE FUNCTION send_welcome_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  welcome_template record;
BEGIN
  -- 获取欢迎消息模板
  SELECT subject, content INTO welcome_template 
  FROM message_templates 
  WHERE template_key = 'welcome_message';
  
  -- 插入通知
  IF welcome_template IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, content, is_read)
    VALUES (NEW.id, 'system', welcome_template.subject, welcome_template.content, false);
  END IF;
  
  RETURN NEW;
END;
$$;

-- 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS trigger_send_welcome_notification ON profiles;

-- 创建新触发器
CREATE TRIGGER trigger_send_welcome_notification
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION send_welcome_notification();
