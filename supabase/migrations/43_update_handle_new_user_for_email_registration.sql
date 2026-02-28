/*
# 更新用户注册触发器以支持邮箱注册

## 概述
更新handle_new_user函数，使其能够正确处理邮箱注册：
1. 从auth.users的raw_user_meta_data中获取username和email
2. 将邮箱保存到profiles表
3. 设置email_verified为false（需要用户验证）

## 变更
- 更新handle_new_user()函数
- 从metadata中读取username和email
- 确保邮箱正确保存到profiles表
*/

-- 更新handle_new_user函数以支持邮箱注册
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  extracted_username text;
  user_email text;
BEGIN
  -- 从raw_user_meta_data中获取username
  extracted_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  
  -- 从raw_user_meta_data中获取email，如果没有则使用NEW.email
  user_email := COALESCE(
    NEW.raw_user_meta_data->>'email',
    NEW.email
  );
  
  -- 在profiles表中插入新记录
  INSERT INTO public.profiles (
    id, 
    username, 
    email,
    email_verified,
    role, 
    status, 
    level, 
    points,
    member_level,
    total_articles,
    total_questions,
    total_answers,
    following_count,
    follower_count,
    post_count
  )
  VALUES (
    NEW.id,
    extracted_username,
    user_email,
    false,  -- 默认未验证
    'member'::user_role,
    'active',  -- status是text类型
    1,  -- 默认等级1
    0,  -- 初始积分0
    'bronze'::member_level,  -- 默认Bronze会员
    0,
    0,
    0,
    0,
    0,
    0
  )
  ON CONFLICT (id) DO NOTHING;  -- 如果已存在则忽略
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS '当新用户注册时自动创建profile记录，支持邮箱注册';
