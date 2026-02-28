
-- 更新所有测试会员的密码为 lun123456
-- 只更新邮箱以@miaoda.com结尾的测试账号

-- 批量更新auth.users表中的密码
UPDATE auth.users
SET 
  encrypted_password = crypt('lun123456', gen_salt('bf')),
  updated_at = now()
WHERE email LIKE '%@miaoda.com' 
  AND email != 'ifixes@miaoda.com'
  AND id IN (
    SELECT id FROM profiles WHERE role = 'member'
  );

-- 记录更新日志
DO $$
DECLARE
  v_updated_count int;
BEGIN
  -- 统计更新的账号数量
  SELECT COUNT(*) INTO v_updated_count
  FROM auth.users
  WHERE email LIKE '%@miaoda.com' 
    AND email != 'ifixes@miaoda.com'
    AND id IN (
      SELECT id FROM profiles WHERE role = 'member'
    );
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 密码更新完成！';
  RAISE NOTICE '- 更新账号数量: %', v_updated_count;
  RAISE NOTICE '- 新密码: lun123456';
  RAISE NOTICE '- 用户名格式: 点号(.)已替换为字母i';
  RAISE NOTICE '========================================';
END $$;
