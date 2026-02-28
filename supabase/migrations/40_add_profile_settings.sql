/*
# 添加个人主页设置功能

1. 扩展profiles表
  - 添加 `profile_visibility` 字段：个人主页可见性（public/friends/private）
  - 添加 `show_email` 字段：是否显示邮箱
  - 添加 `show_articles` 字段：是否显示文章
  - 添加 `show_questions` 字段：是否显示问答
  - 添加 `show_sns` 字段：是否显示动态

2. 安全策略
  - 用户可以查看和编辑自己的个人主页设置
  - 管理员可以查看和管理所有用户的个人主页设置
*/

-- 创建个人主页可见性枚举类型
CREATE TYPE profile_visibility AS ENUM ('public', 'friends', 'private');

-- 添加个人主页设置字段
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_visibility profile_visibility DEFAULT 'public'::profile_visibility NOT NULL,
ADD COLUMN IF NOT EXISTS show_email boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS show_articles boolean DEFAULT true NOT NULL,
ADD COLUMN IF NOT EXISTS show_questions boolean DEFAULT true NOT NULL,
ADD COLUMN IF NOT EXISTS show_sns boolean DEFAULT true NOT NULL;

-- 创建个人主页访问权限检查函数
CREATE OR REPLACE FUNCTION can_view_profile(viewer_id uuid, profile_owner_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  visibility profile_visibility;
  is_friend boolean;
BEGIN
  -- 如果是查看自己的主页，总是允许
  IF viewer_id = profile_owner_id THEN
    RETURN true;
  END IF;

  -- 如果是管理员，总是允许
  IF is_admin(viewer_id) THEN
    RETURN true;
  END IF;

  -- 获取主页可见性设置
  SELECT profile_visibility INTO visibility
  FROM profiles
  WHERE id = profile_owner_id;

  -- 如果是公开的，允许访问
  IF visibility = 'public' THEN
    RETURN true;
  END IF;

  -- 如果是私密的，不允许访问
  IF visibility = 'private' THEN
    RETURN false;
  END IF;

  -- 如果是仅好友可见，检查是否是好友
  IF visibility = 'friends' THEN
    SELECT are_friends(viewer_id, profile_owner_id) INTO is_friend;
    RETURN is_friend;
  END IF;

  RETURN false;
END;
$$;

-- 创建个人主页管理表（用于管理后台）
CREATE TABLE IF NOT EXISTS profile_management_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  admin_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 为profile_management_logs表启用RLS
ALTER TABLE profile_management_logs ENABLE ROW LEVEL SECURITY;

-- 只有管理员可以查看和操作管理日志
CREATE POLICY "管理员可以查看所有管理日志" ON profile_management_logs
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "管理员可以创建管理日志" ON profile_management_logs
  FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_profile_management_logs_profile_id ON profile_management_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_management_logs_admin_id ON profile_management_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_profile_management_logs_created_at ON profile_management_logs(created_at DESC);
