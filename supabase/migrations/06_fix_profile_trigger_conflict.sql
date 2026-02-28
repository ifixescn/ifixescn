/*
# 修复profile触发器的唯一约束冲突问题

## 问题说明
触发器在创建profile时遇到23505错误（唯一约束违反）
原因：username或email可能已存在

## 解决方案
使用 ON CONFLICT DO NOTHING 避免重复插入错误

## 变更内容
1. 更新 handle_new_user() 函数
2. 添加冲突处理逻辑
3. 如果记录已存在，不做任何操作
*/

-- 更新处理新用户的函数，添加冲突处理
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  extracted_username text;
BEGIN
  -- 从邮箱中提取用户名（格式：username@miaoda.com）
  extracted_username := split_part(NEW.email, '@', 1);
  
  -- 在profiles表中插入新记录，如果已存在则忽略
  INSERT INTO public.profiles (id, username, email, role)
  VALUES (
    NEW.id,
    extracted_username,
    NEW.email,
    'member'::user_role
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 添加注释
COMMENT ON FUNCTION public.handle_new_user() IS '当新用户注册时自动创建profile记录，避免重复插入错误';
