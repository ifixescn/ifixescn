/*
# 修复登录时的23505错误（唯一约束违反）

## 问题描述
用户登录时出现23505错误，这是因为handle_new_user触发器尝试插入已存在的profile记录。

## 解决方案
1. 更新handle_new_user函数，使用ON CONFLICT DO NOTHING避免重复插入
2. 确保所有现有用户的confirmed_at字段都已设置
3. 添加额外的安全检查，确保不会重复创建profile
*/

-- ============================================
-- 1. 更新handle_new_user函数，添加ON CONFLICT处理
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
  profile_exists boolean;
BEGIN
  -- 检查profile是否已存在
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = NEW.id) INTO profile_exists;
  
  -- 如果profile已存在，直接返回
  IF profile_exists THEN
    RETURN NEW;
  END IF;
  
  -- 只在用户经过验证后再插入profiles
  IF OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL THEN
    -- 判断 profiles 表里有多少用户
    SELECT COUNT(*) INTO user_count FROM profiles;
    
    -- 插入 profiles，首位用户给 admin 角色
    -- 使用 ON CONFLICT DO NOTHING 避免重复插入
    INSERT INTO profiles (
      id, 
      username, 
      email, 
      phone, 
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
      COALESCE(SPLIT_PART(NEW.email, '@', 1), ''),
      NEW.email,
      NEW.phone,
      CASE WHEN user_count = 0 THEN 'admin'::user_role ELSE 'member'::user_role END,
      'active',
      1,
      0,
      0,
      0,
      0
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================
-- 2. 说明
-- ============================================

-- confirmed_at是Supabase自动管理的字段，不需要手动设置
-- 触发器已经添加了profile_exists检查，可以安全处理已存在的profile

-- ============================================
-- 3. 添加注释
-- ============================================

COMMENT ON FUNCTION handle_new_user() IS '处理新用户注册，自动创建profile记录。使用ON CONFLICT避免重复插入导致的23505错误。';
