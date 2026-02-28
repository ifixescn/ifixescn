/*
# 修复member_status类型错误

## 问题描述
用户登录时出现错误：
"error update user's last_sign_in field: ERROR: type "member_status" does not exist (SQLSTATE 42704)"

## 根本原因
handle_new_user()函数中使用了不存在的member_status枚举类型。
实际上profiles表的status字段是text类型，不是枚举类型。

## 解决方案
更新handle_new_user()函数，将'active'::member_status改为'active'（text类型）

## 影响范围
- 修复用户注册流程
- 修复用户登录流程
*/

-- 重新创建handle_new_user函数，修复member_status类型错误
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
    'active',  -- status是text类型，不是member_status枚举
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

COMMENT ON FUNCTION public.handle_new_user() IS '当新用户注册时自动创建profile记录，支持邮箱注册。status字段使用text类型。';
