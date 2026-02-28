/*
# 创建社交网络功能模块

## 1. 新增表
- `albums` - 相册表
  - `id` (uuid, 主键)
  - `user_id` (uuid, 外键到profiles)
  - `title` (text, 相册标题)
  - `description` (text, 相册描述)
  - `cover_image` (text, 封面图片URL)
  - `privacy` (text, 隐私设置: public/friends/private)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

- `album_photos` - 相册照片表
  - `id` (uuid, 主键)
  - `album_id` (uuid, 外键到albums)
  - `user_id` (uuid, 外键到profiles)
  - `image_url` (text, 图片URL)
  - `title` (text, 照片标题)
  - `description` (text, 照片描述)
  - `created_at` (timestamptz)

- `blogs` - 日志/博客表
  - `id` (uuid, 主键)
  - `user_id` (uuid, 外键到profiles)
  - `title` (text, 标题)
  - `content` (text, 内容)
  - `cover_image` (text, 封面图)
  - `privacy` (text, 隐私设置)
  - `views_count` (integer, 浏览次数)
  - `likes_count` (integer, 点赞数)
  - `comments_count` (integer, 评论数)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

- `blog_comments` - 日志评论表
  - `id` (uuid, 主键)
  - `blog_id` (uuid, 外键到blogs)
  - `user_id` (uuid, 外键到profiles)
  - `content` (text, 评论内容)
  - `created_at` (timestamptz)

- `blog_likes` - 日志点赞表
  - `id` (uuid, 主键)
  - `blog_id` (uuid, 外键到blogs)
  - `user_id` (uuid, 外键到profiles)
  - `created_at` (timestamptz)

- `groups` - 群组表
  - `id` (uuid, 主键)
  - `name` (text, 群组名称)
  - `description` (text, 群组描述)
  - `avatar` (text, 群组头像)
  - `cover_image` (text, 封面图)
  - `creator_id` (uuid, 外键到profiles)
  - `privacy` (text, 隐私设置: public/private)
  - `members_count` (integer, 成员数)
  - `posts_count` (integer, 动态数)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

- `group_members` - 群组成员表
  - `id` (uuid, 主键)
  - `group_id` (uuid, 外键到groups)
  - `user_id` (uuid, 外键到profiles)
  - `role` (text, 角色: admin/member)
  - `joined_at` (timestamptz)

- `group_posts` - 群组动态表
  - `id` (uuid, 主键)
  - `group_id` (uuid, 外键到groups)
  - `user_id` (uuid, 外键到profiles)
  - `content` (text, 内容)
  - `images` (text[], 图片数组)
  - `likes_count` (integer, 点赞数)
  - `comments_count` (integer, 评论数)
  - `created_at` (timestamptz)

- `privacy_settings` - 隐私设置表
  - `id` (uuid, 主键)
  - `user_id` (uuid, 外键到profiles, 唯一)
  - `profile_visibility` (text, 个人资料可见性)
  - `posts_visibility` (text, 动态可见性)
  - `albums_visibility` (text, 相册可见性)
  - `blogs_visibility` (text, 日志可见性)
  - `allow_friend_requests` (boolean, 允许好友请求)
  - `allow_messages` (boolean, 允许私信)
  - `show_online_status` (boolean, 显示在线状态)
  - `updated_at` (timestamptz)

## 2. 安全策略
- 所有表启用RLS
- 用户可以查看公开内容和好友内容
- 用户可以管理自己的内容
- 管理员拥有完全访问权限

## 3. 索引
- 为外键字段创建索引
- 为常用查询字段创建索引
*/

-- 创建相册表
CREATE TABLE IF NOT EXISTS albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  cover_image text,
  privacy text NOT NULL DEFAULT 'public' CHECK (privacy IN ('public', 'friends', 'private')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_albums_user_id ON albums(user_id);
CREATE INDEX idx_albums_created_at ON albums(created_at DESC);

-- 创建相册照片表
CREATE TABLE IF NOT EXISTS album_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  title text,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_album_photos_album_id ON album_photos(album_id);
CREATE INDEX idx_album_photos_user_id ON album_photos(user_id);
CREATE INDEX idx_album_photos_created_at ON album_photos(created_at DESC);

-- 创建日志/博客表
CREATE TABLE IF NOT EXISTS blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  cover_image text,
  privacy text NOT NULL DEFAULT 'public' CHECK (privacy IN ('public', 'friends', 'private')),
  views_count integer DEFAULT 0,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_blogs_user_id ON blogs(user_id);
CREATE INDEX idx_blogs_created_at ON blogs(created_at DESC);
CREATE INDEX idx_blogs_views_count ON blogs(views_count DESC);

-- 创建日志评论表
CREATE TABLE IF NOT EXISTS blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id uuid NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_blog_comments_blog_id ON blog_comments(blog_id);
CREATE INDEX idx_blog_comments_user_id ON blog_comments(user_id);
CREATE INDEX idx_blog_comments_created_at ON blog_comments(created_at DESC);

-- 创建日志点赞表
CREATE TABLE IF NOT EXISTS blog_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id uuid NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blog_id, user_id)
);

CREATE INDEX idx_blog_likes_blog_id ON blog_likes(blog_id);
CREATE INDEX idx_blog_likes_user_id ON blog_likes(user_id);

-- 创建群组表
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  avatar text,
  cover_image text,
  creator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  privacy text NOT NULL DEFAULT 'public' CHECK (privacy IN ('public', 'private')),
  members_count integer DEFAULT 1,
  posts_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_groups_creator_id ON groups(creator_id);
CREATE INDEX idx_groups_created_at ON groups(created_at DESC);
CREATE INDEX idx_groups_members_count ON groups(members_count DESC);

-- 创建群组成员表
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);

-- 创建群组动态表
CREATE TABLE IF NOT EXISTS group_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  images text[],
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_group_posts_group_id ON group_posts(group_id);
CREATE INDEX idx_group_posts_user_id ON group_posts(user_id);
CREATE INDEX idx_group_posts_created_at ON group_posts(created_at DESC);

-- 创建隐私设置表
CREATE TABLE IF NOT EXISTS privacy_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  profile_visibility text NOT NULL DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends', 'private')),
  posts_visibility text NOT NULL DEFAULT 'public' CHECK (posts_visibility IN ('public', 'friends', 'private')),
  albums_visibility text NOT NULL DEFAULT 'public' CHECK (albums_visibility IN ('public', 'friends', 'private')),
  blogs_visibility text NOT NULL DEFAULT 'public' CHECK (blogs_visibility IN ('public', 'friends', 'private')),
  allow_friend_requests boolean DEFAULT true,
  allow_messages boolean DEFAULT true,
  show_online_status boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_privacy_settings_user_id ON privacy_settings(user_id);

-- 创建Supabase Storage桶用于图片上传
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-7fshtpomqha9_social_images', 'app-7fshtpomqha9_social_images', true)
ON CONFLICT (id) DO NOTHING;

-- 设置存储桶策略：允许所有用户上传和查看图片
CREATE POLICY "允许所有用户查看图片"
ON storage.objects FOR SELECT
USING (bucket_id = 'app-7fshtpomqha9_social_images');

CREATE POLICY "允许认证用户上传图片"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'app-7fshtpomqha9_social_images');

CREATE POLICY "允许用户删除自己的图片"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'app-7fshtpomqha9_social_images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 启用RLS
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;

-- 创建辅助函数：检查是否为好友
CREATE OR REPLACE FUNCTION is_friend(user1_id uuid, user2_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM member_follows
    WHERE follower_id = user1_id AND following_id = user2_id
  ) AND EXISTS (
    SELECT 1 FROM member_follows
    WHERE follower_id = user2_id AND following_id = user1_id
  );
$$;

-- 相册RLS策略
CREATE POLICY "用户可以查看公开相册"
ON albums FOR SELECT
USING (privacy = 'public');

CREATE POLICY "用户可以查看好友的相册"
ON albums FOR SELECT
USING (
  privacy = 'friends' AND 
  is_friend(auth.uid(), user_id)
);

CREATE POLICY "用户可以查看自己的相册"
ON albums FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的相册"
ON albums FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的相册"
ON albums FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的相册"
ON albums FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 相册照片RLS策略
CREATE POLICY "用户可以查看公开相册的照片"
ON album_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM albums
    WHERE albums.id = album_photos.album_id
    AND albums.privacy = 'public'
  )
);

CREATE POLICY "用户可以查看好友相册的照片"
ON album_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM albums
    WHERE albums.id = album_photos.album_id
    AND albums.privacy = 'friends'
    AND is_friend(auth.uid(), albums.user_id)
  )
);

CREATE POLICY "用户可以查看自己相册的照片"
ON album_photos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "用户可以上传照片到自己的相册"
ON album_photos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的照片"
ON album_photos FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 日志RLS策略
CREATE POLICY "用户可以查看公开日志"
ON blogs FOR SELECT
USING (privacy = 'public');

CREATE POLICY "用户可以查看好友的日志"
ON blogs FOR SELECT
USING (
  privacy = 'friends' AND 
  is_friend(auth.uid(), user_id)
);

CREATE POLICY "用户可以查看自己的日志"
ON blogs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的日志"
ON blogs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的日志"
ON blogs FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的日志"
ON blogs FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 日志评论RLS策略
CREATE POLICY "用户可以查看可见日志的评论"
ON blog_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM blogs
    WHERE blogs.id = blog_comments.blog_id
    AND (
      blogs.privacy = 'public'
      OR (blogs.privacy = 'friends' AND is_friend(auth.uid(), blogs.user_id))
      OR blogs.user_id = auth.uid()
    )
  )
);

CREATE POLICY "用户可以评论可见的日志"
ON blog_comments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM blogs
    WHERE blogs.id = blog_comments.blog_id
    AND (
      blogs.privacy = 'public'
      OR (blogs.privacy = 'friends' AND is_friend(auth.uid(), blogs.user_id))
      OR blogs.user_id = auth.uid()
    )
  )
);

CREATE POLICY "用户可以删除自己的评论"
ON blog_comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 日志点赞RLS策略
CREATE POLICY "用户可以查看点赞"
ON blog_likes FOR SELECT
USING (true);

CREATE POLICY "用户可以点赞可见的日志"
ON blog_likes FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM blogs
    WHERE blogs.id = blog_likes.blog_id
    AND (
      blogs.privacy = 'public'
      OR (blogs.privacy = 'friends' AND is_friend(auth.uid(), blogs.user_id))
      OR blogs.user_id = auth.uid()
    )
  )
);

CREATE POLICY "用户可以取消自己的点赞"
ON blog_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 群组RLS策略
CREATE POLICY "用户可以查看公开群组"
ON groups FOR SELECT
USING (privacy = 'public');

CREATE POLICY "群组成员可以查看私密群组"
ON groups FOR SELECT
USING (
  privacy = 'private' AND
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "用户可以创建群组"
ON groups FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "群组管理员可以更新群组"
ON groups FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id = auth.uid()
    AND group_members.role = 'admin'
  )
);

CREATE POLICY "群组创建者可以删除群组"
ON groups FOR DELETE
TO authenticated
USING (auth.uid() = creator_id);

-- 群组成员RLS策略
CREATE POLICY "用户可以查看公开群组的成员"
ON group_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = group_members.group_id
    AND groups.privacy = 'public'
  )
);

CREATE POLICY "群组成员可以查看成员列表"
ON group_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "用户可以加入公开群组"
ON group_members FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = group_members.group_id
    AND groups.privacy = 'public'
  )
);

CREATE POLICY "用户可以退出群组"
ON group_members FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 群组动态RLS策略
CREATE POLICY "用户可以查看公开群组的动态"
ON group_posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = group_posts.group_id
    AND groups.privacy = 'public'
  )
);

CREATE POLICY "群组成员可以查看动态"
ON group_posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = group_posts.group_id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "群组成员可以发布动态"
ON group_posts FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = group_posts.group_id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "用户可以删除自己的动态"
ON group_posts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 隐私设置RLS策略
CREATE POLICY "用户可以查看自己的隐私设置"
ON privacy_settings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的隐私设置"
ON privacy_settings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的隐私设置"
ON privacy_settings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 创建触发器：自动更新updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_albums_updated_at
  BEFORE UPDATE ON albums
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blogs_updated_at
  BEFORE UPDATE ON blogs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_privacy_settings_updated_at
  BEFORE UPDATE ON privacy_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 创建触发器：自动创建群组成员记录（创建者）
CREATE OR REPLACE FUNCTION create_group_creator_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.creator_id, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_group_creator_member
  AFTER INSERT ON groups
  FOR EACH ROW
  EXECUTE FUNCTION create_group_creator_member();

-- 创建触发器：自动创建隐私设置
CREATE OR REPLACE FUNCTION create_default_privacy_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO privacy_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_default_privacy_settings
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_privacy_settings();

-- 创建触发器：更新日志评论数
CREATE OR REPLACE FUNCTION update_blog_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE blogs SET comments_count = comments_count + 1 WHERE id = NEW.blog_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE blogs SET comments_count = comments_count - 1 WHERE id = OLD.blog_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_blog_comments_count
  AFTER INSERT OR DELETE ON blog_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_comments_count();

-- 创建触发器：更新日志点赞数
CREATE OR REPLACE FUNCTION update_blog_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE blogs SET likes_count = likes_count + 1 WHERE id = NEW.blog_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE blogs SET likes_count = likes_count - 1 WHERE id = OLD.blog_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_blog_likes_count
  AFTER INSERT OR DELETE ON blog_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_likes_count();

-- 创建触发器：更新群组成员数
CREATE OR REPLACE FUNCTION update_group_members_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE groups SET members_count = members_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE groups SET members_count = members_count - 1 WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_group_members_count
  AFTER INSERT OR DELETE ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_group_members_count();

-- 创建触发器：更新群组动态数
CREATE OR REPLACE FUNCTION update_group_posts_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE groups SET posts_count = posts_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE groups SET posts_count = posts_count - 1 WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_group_posts_count
  AFTER INSERT OR DELETE ON group_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_group_posts_count();
