/*
# 创建SNS会员互动系统

## 1. 新增表结构

### messages（站内信表）
- id (uuid, 主键)
- sender_id (uuid, 发送者ID)
- receiver_id (uuid, 接收者ID)
- title (text, 消息标题)
- content (text, 消息内容)
- is_read (boolean, 是否已读)
- created_at (timestamptz, 创建时间)

### member_follows（关注关系表）
- id (uuid, 主键)
- follower_id (uuid, 关注者ID)
- following_id (uuid, 被关注者ID)
- created_at (timestamptz, 创建时间)
- 唯一约束：(follower_id, following_id)

### member_posts（会员动态表）
- id (uuid, 主键)
- member_id (uuid, 会员ID)
- content (text, 动态内容)
- related_type (text, 关联类型: article/question/answer)
- related_id (uuid, 关联ID)
- related_title (text, 关联标题)
- likes_count (integer, 点赞数)
- comments_count (integer, 评论数)
- created_at (timestamptz, 创建时间)

### post_likes（动态点赞表）
- id (uuid, 主键)
- post_id (uuid, 动态ID)
- member_id (uuid, 会员ID)
- created_at (timestamptz, 创建时间)
- 唯一约束：(post_id, member_id)

### post_comments（动态评论表）
- id (uuid, 主键)
- post_id (uuid, 动态ID)
- member_id (uuid, 会员ID)
- content (text, 评论内容)
- created_at (timestamptz, 创建时间)

### notifications（通知表）
- id (uuid, 主键)
- member_id (uuid, 会员ID)
- type (text, 通知类型)
- title (text, 通知标题)
- content (text, 通知内容)
- related_id (uuid, 关联ID)
- is_read (boolean, 是否已读)
- created_at (timestamptz, 创建时间)

## 2. 安全策略
- 所有表启用RLS
- 用户可以查看和管理自己的数据
- 管理员拥有完全访问权限

## 3. RPC函数
- toggle_follow: 切换关注状态
- toggle_post_like: 切换点赞状态
- get_unread_notification_count: 获取未读通知数

## 4. 触发器
- 点赞时自动创建通知
- 评论时自动创建通知
- 关注时自动创建通知
- 发送消息时自动创建通知
- 点赞时增加积分
- 评论时增加积分
- 发布动态时增加积分

## 5. Profile表扩展
- following_count (integer, 关注数)
- follower_count (integer, 粉丝数)
- post_count (integer, 动态数)
*/

-- 创建站内信表
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 创建关注关系表
CREATE TABLE IF NOT EXISTS member_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- 创建会员动态表
CREATE TABLE IF NOT EXISTS member_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  related_type text CHECK (related_type IN ('article', 'question', 'answer')),
  related_id uuid,
  related_title text,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 创建动态点赞表
CREATE TABLE IF NOT EXISTS post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES member_posts(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, member_id)
);

-- 创建动态评论表
CREATE TABLE IF NOT EXISTS post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES member_posts(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 创建通知表
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('message', 'follow', 'like', 'comment')),
  title text NOT NULL,
  content text NOT NULL,
  related_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 为profiles表添加SNS统计字段
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS follower_count integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS post_count integer DEFAULT 0;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_follows_follower ON member_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_member_follows_following ON member_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_member_posts_member ON member_posts(member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_member ON notifications(member_id, created_at DESC);

-- 启用RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- messages表的RLS策略
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages" ON messages
  FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Admins have full access to messages" ON messages
  FOR ALL USING (is_admin(auth.uid()));

-- member_follows表的RLS策略
CREATE POLICY "Anyone can view follows" ON member_follows
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own follows" ON member_follows
  FOR ALL USING (auth.uid() = follower_id);

CREATE POLICY "Admins have full access to follows" ON member_follows
  FOR ALL USING (is_admin(auth.uid()));

-- member_posts表的RLS策略
CREATE POLICY "Anyone can view posts" ON member_posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own posts" ON member_posts
  FOR INSERT WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Users can update their own posts" ON member_posts
  FOR UPDATE USING (auth.uid() = member_id);

CREATE POLICY "Users can delete their own posts" ON member_posts
  FOR DELETE USING (auth.uid() = member_id);

CREATE POLICY "Admins have full access to posts" ON member_posts
  FOR ALL USING (is_admin(auth.uid()));

-- post_likes表的RLS策略
CREATE POLICY "Anyone can view likes" ON post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes" ON post_likes
  FOR ALL USING (auth.uid() = member_id);

-- post_comments表的RLS策略
CREATE POLICY "Anyone can view comments" ON post_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON post_comments
  FOR INSERT WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Users can delete their own comments" ON post_comments
  FOR DELETE USING (auth.uid() = member_id);

CREATE POLICY "Admins have full access to comments" ON post_comments
  FOR ALL USING (is_admin(auth.uid()));

-- notifications表的RLS策略
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = member_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = member_id);

CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (auth.uid() = member_id);

-- RPC函数：切换关注状态
CREATE OR REPLACE FUNCTION toggle_follow(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  is_following boolean;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF current_user_id = target_user_id THEN
    RAISE EXCEPTION 'Cannot follow yourself';
  END IF;
  
  SELECT EXISTS(
    SELECT 1 FROM member_follows 
    WHERE follower_id = current_user_id AND following_id = target_user_id
  ) INTO is_following;
  
  IF is_following THEN
    DELETE FROM member_follows 
    WHERE follower_id = current_user_id AND following_id = target_user_id;
    
    UPDATE profiles SET follower_count = GREATEST(0, follower_count - 1) 
    WHERE id = target_user_id;
    
    UPDATE profiles SET following_count = GREATEST(0, following_count - 1) 
    WHERE id = current_user_id;
    
    RETURN false;
  ELSE
    INSERT INTO member_follows (follower_id, following_id) 
    VALUES (current_user_id, target_user_id);
    
    UPDATE profiles SET follower_count = follower_count + 1 
    WHERE id = target_user_id;
    
    UPDATE profiles SET following_count = following_count + 1 
    WHERE id = current_user_id;
    
    RETURN true;
  END IF;
END;
$$;

-- RPC函数：切换点赞状态
CREATE OR REPLACE FUNCTION toggle_post_like(target_post_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  is_liked boolean;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  SELECT EXISTS(
    SELECT 1 FROM post_likes 
    WHERE post_id = target_post_id AND member_id = current_user_id
  ) INTO is_liked;
  
  IF is_liked THEN
    DELETE FROM post_likes 
    WHERE post_id = target_post_id AND member_id = current_user_id;
    
    UPDATE member_posts SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = target_post_id;
    
    RETURN false;
  ELSE
    INSERT INTO post_likes (post_id, member_id) 
    VALUES (target_post_id, current_user_id);
    
    UPDATE member_posts SET likes_count = likes_count + 1 
    WHERE id = target_post_id;
    
    RETURN true;
  END IF;
END;
$$;

-- RPC函数：获取未读通知数
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unread_count integer;
BEGIN
  SELECT COUNT(*) INTO unread_count
  FROM notifications
  WHERE member_id = user_id AND is_read = false;
  
  RETURN unread_count;
END;
$$;

-- 触发器：点赞时创建通知
CREATE OR REPLACE FUNCTION notify_post_like()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  post_author_id uuid;
  liker_username text;
BEGIN
  SELECT member_id INTO post_author_id FROM member_posts WHERE id = NEW.post_id;
  SELECT username INTO liker_username FROM profiles WHERE id = NEW.member_id;
  
  IF post_author_id != NEW.member_id THEN
    INSERT INTO notifications (member_id, type, title, content, related_id)
    VALUES (
      post_author_id,
      'like',
      '新的点赞',
      liker_username || ' 赞了你的动态',
      NEW.post_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_post_like
AFTER INSERT ON post_likes
FOR EACH ROW
EXECUTE FUNCTION notify_post_like();

-- 触发器：评论时创建通知
CREATE OR REPLACE FUNCTION notify_post_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  post_author_id uuid;
  commenter_username text;
BEGIN
  SELECT member_id INTO post_author_id FROM member_posts WHERE id = NEW.post_id;
  SELECT username INTO commenter_username FROM profiles WHERE id = NEW.member_id;
  
  IF post_author_id != NEW.member_id THEN
    INSERT INTO notifications (member_id, type, title, content, related_id)
    VALUES (
      post_author_id,
      'comment',
      '新的评论',
      commenter_username || ' 评论了你的动态',
      NEW.post_id
    );
  END IF;
  
  UPDATE member_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_post_comment
AFTER INSERT ON post_comments
FOR EACH ROW
EXECUTE FUNCTION notify_post_comment();

-- 触发器：关注时创建通知
CREATE OR REPLACE FUNCTION notify_new_follow()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  follower_username text;
BEGIN
  SELECT username INTO follower_username FROM profiles WHERE id = NEW.follower_id;
  
  INSERT INTO notifications (member_id, type, title, content, related_id)
  VALUES (
    NEW.following_id,
    'follow',
    '新的关注',
    follower_username || ' 关注了你',
    NEW.follower_id
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_new_follow
AFTER INSERT ON member_follows
FOR EACH ROW
EXECUTE FUNCTION notify_new_follow();

-- 触发器：发送消息时创建通知
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  sender_username text;
BEGIN
  SELECT username INTO sender_username FROM profiles WHERE id = NEW.sender_id;
  
  INSERT INTO notifications (member_id, type, title, content, related_id)
  VALUES (
    NEW.receiver_id,
    'message',
    '新的站内信',
    sender_username || ' 给你发送了一条消息',
    NEW.id
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_new_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION notify_new_message();

-- 触发器：点赞时增加积分
CREATE OR REPLACE FUNCTION add_points_for_like()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  post_author_id uuid;
BEGIN
  SELECT member_id INTO post_author_id FROM member_posts WHERE id = NEW.post_id;
  
  IF post_author_id != NEW.member_id THEN
    UPDATE profiles SET points = points + 2 WHERE id = post_author_id;
    
    INSERT INTO member_points_log (member_id, points, action, description)
    VALUES (post_author_id, 2, 'post_liked', '动态被点赞');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_add_points_for_like
AFTER INSERT ON post_likes
FOR EACH ROW
EXECUTE FUNCTION add_points_for_like();

-- 触发器：评论时增加积分
CREATE OR REPLACE FUNCTION add_points_for_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  post_author_id uuid;
BEGIN
  SELECT member_id INTO post_author_id FROM member_posts WHERE id = NEW.post_id;
  
  IF post_author_id != NEW.member_id THEN
    UPDATE profiles SET points = points + 3 WHERE id = post_author_id;
    
    INSERT INTO member_points_log (member_id, points, action, description)
    VALUES (post_author_id, 3, 'post_commented', '动态被评论');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_add_points_for_comment
AFTER INSERT ON post_comments
FOR EACH ROW
EXECUTE FUNCTION add_points_for_comment();

-- 触发器：发布动态时增加积分
CREATE OR REPLACE FUNCTION add_points_for_post()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE profiles SET points = points + 5, post_count = post_count + 1 WHERE id = NEW.member_id;
  
  INSERT INTO member_points_log (member_id, points, action, description)
  VALUES (NEW.member_id, 5, 'create_post', '发布动态');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_add_points_for_post
AFTER INSERT ON member_posts
FOR EACH ROW
EXECUTE FUNCTION add_points_for_post();

-- 触发器：删除动态时减少积分和计数
CREATE OR REPLACE FUNCTION remove_points_for_post()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE profiles 
  SET points = GREATEST(0, points - 5), 
      post_count = GREATEST(0, post_count - 1) 
  WHERE id = OLD.member_id;
  
  RETURN OLD;
END;
$$;

CREATE TRIGGER trigger_remove_points_for_post
AFTER DELETE ON member_posts
FOR EACH ROW
EXECUTE FUNCTION remove_points_for_post();
