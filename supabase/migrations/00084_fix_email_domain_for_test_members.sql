
-- 修复邮箱域名：将 @miaodaicom 改回 @miaoda.com
-- 只修复那些域名被错误替换的账号

-- 更新profiles表
UPDATE profiles
SET 
  email = REPLACE(email, '@miaodaicom', '@miaoda.com'),
  updated_at = now()
WHERE email LIKE '%@miaodaicom';

-- 更新auth.users表
UPDATE auth.users
SET 
  email = REPLACE(email, '@miaodaicom', '@miaoda.com'),
  updated_at = now()
WHERE email LIKE '%@miaodaicom';

-- 验证修复结果
DO $$
DECLARE
  v_fixed_count int;
  v_remaining_wrong int;
BEGIN
  -- 统计修复的账号数量
  SELECT COUNT(*) INTO v_fixed_count
  FROM profiles
  WHERE email LIKE '%@miaoda.com' AND username LIKE '%i%';
  
  -- 检查是否还有错误的域名
  SELECT COUNT(*) INTO v_remaining_wrong
  FROM profiles
  WHERE email LIKE '%@miaodaicom';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 邮箱域名修复完成！';
  RAISE NOTICE '- 正确邮箱数量: %', v_fixed_count;
  RAISE NOTICE '- 错误邮箱数量: %', v_remaining_wrong;
  RAISE NOTICE '========================================';
END $$;
