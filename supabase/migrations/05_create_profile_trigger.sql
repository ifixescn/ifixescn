/*
# 创建用户注册时自动创建profile的触发器

## 功能说明
当新用户在auth.users表中注册时，自动在profiles表中创建对应的记录

## 变更内容
1. 创建触发器函数 handle_new_user()
2. 创建触发器 on_auth_user_created
3. 从用户邮箱中提取用户名（格式：username@ifixescn.com）

## 安全性
- 新用户默认角色为 'member'
- 自动提取用户名和邮箱
*/

-- 创建处理新用户的函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  extracted_username text;
BEGIN
  -- 从邮箱中提取用户名（格式：username@ifixescn.com）
  extracted_username := split_part(NEW.email, '@', 1);
  
  -- 在profiles表中插入新记录
  INSERT INTO public.profiles (id, username, email, role)
  VALUES (
    NEW.id,
    extracted_username,
    NEW.email,
    'member'::user_role
  );
  
  RETURN NEW;
END;
$$;

-- 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 添加注释
COMMENT ON FUNCTION public.handle_new_user() IS '当新用户注册时自动创建profile记录';
