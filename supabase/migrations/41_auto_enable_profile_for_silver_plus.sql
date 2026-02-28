/*
# Auto-enable Profile for Silver+ Members

## Overview
Automatically enable profile settings for Silver and above members when they register or upgrade.

## Changes
1. Create trigger function to auto-enable profile settings
2. Add trigger on profiles table for INSERT and UPDATE operations
3. Set default profile_visibility to 'public' for Silver+ members

## Implementation Details
- When a new profile is created with member_level >= 'silver', automatically set:
  - profile_visibility = 'public'
  - show_articles = true
  - show_questions = true
  - show_sns = true
  - show_email = false (for privacy)
- When an existing profile is upgraded to Silver+, apply the same settings if not already configured

## Security
- Function runs with SECURITY DEFINER to ensure proper permissions
- Only affects profiles with member_level of 'silver', 'gold', 'premium', or 'svip'
*/

-- 创建自动开通个人主页的触发器函数
CREATE OR REPLACE FUNCTION auto_enable_profile_for_silver_plus()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 检查会员等级是否为Silver及以上
  IF NEW.member_level IN ('silver', 'gold', 'premium', 'svip') THEN
    -- 如果是新插入或等级升级，自动设置个人主页为公开
    IF (TG_OP = 'INSERT') OR 
       (TG_OP = 'UPDATE' AND OLD.member_level NOT IN ('silver', 'gold', 'premium', 'svip')) THEN
      
      -- 设置默认的个人主页配置
      NEW.profile_visibility := 'public';
      NEW.show_articles := true;
      NEW.show_questions := true;
      NEW.show_sns := true;
      NEW.show_email := COALESCE(NEW.show_email, false);
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_auto_enable_profile ON profiles;
CREATE TRIGGER trigger_auto_enable_profile
  BEFORE INSERT OR UPDATE OF member_level ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_enable_profile_for_silver_plus();

-- 为现有的Silver+会员更新个人主页设置（如果尚未设置）
UPDATE profiles
SET 
  profile_visibility = 'public',
  show_articles = true,
  show_questions = true,
  show_sns = true,
  show_email = COALESCE(show_email, false)
WHERE 
  member_level IN ('silver', 'gold', 'premium', 'svip')
  AND profile_visibility IS NULL;
