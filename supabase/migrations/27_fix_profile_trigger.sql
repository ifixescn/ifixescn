/*
# 修复用户注册触发器 - 确保新用户有所有必需字段

## 更新内容
1. 更新handle_new_user函数，确保新用户有status、level等字段
2. 设置合理的默认值
*/

-- 更新处理新用户的函数
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
  
  -- 在profiles表中插入新记录，包含所有必需字段
  INSERT INTO public.profiles (
    id, 
    username, 
    email, 
    role, 
    status, 
    level, 
    points,
    total_articles,
    total_questions,
    total_answers
  )
  VALUES (
    NEW.id,
    extracted_username,
    NEW.email,
    'member'::user_role,
    'active',  -- 默认状态为活跃
    1,         -- 默认等级为1（Bronze）
    0,         -- 初始积分为0
    0,         -- 初始文章数为0
    0,         -- 初始提问数为0
    0          -- 初始回答数为0
  );
  
  RETURN NEW;
END;
$$;

-- 添加注释
COMMENT ON FUNCTION public.handle_new_user() IS '当新用户注册时自动创建profile记录，包含所有必需字段和默认值';
