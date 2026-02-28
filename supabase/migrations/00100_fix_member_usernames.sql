/*
# 修复AI生成的会员账号格式

将格式从 firstname_lastname_数字 改为更真实的格式：
- 去掉末尾的数字
- 使用更自然的用户名格式

修复策略：
1. 提取firstname和lastname
2. 生成新的username格式（firstname.lastname 或 firstname + 随机字母）
3. 更新username和email
*/

-- 创建临时函数来生成随机字母
CREATE OR REPLACE FUNCTION random_letters(length int) 
RETURNS text AS $$
DECLARE
  chars text := 'abcdefghijklmnopqrstuvwxyz';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 创建函数来修复用户名
CREATE OR REPLACE FUNCTION fix_member_username(old_username text)
RETURNS text AS $$
DECLARE
  parts text[];
  firstname text;
  lastname text;
  new_username text;
  suffix text;
  attempt int := 0;
BEGIN
  -- 分割用户名，提取firstname和lastname
  parts := string_to_array(old_username, '_');
  
  IF array_length(parts, 1) < 2 THEN
    RETURN old_username; -- 如果格式不符合预期，保持原样
  END IF;
  
  firstname := parts[1];
  lastname := parts[2];
  
  -- 尝试不同的格式，直到找到唯一的用户名
  LOOP
    IF attempt = 0 THEN
      -- 第一次尝试：firstname.lastname
      new_username := firstname || '.' || lastname;
    ELSIF attempt = 1 THEN
      -- 第二次尝试：firstname_lastname (不带数字)
      new_username := firstname || '_' || lastname;
    ELSIF attempt = 2 THEN
      -- 第三次尝试：firstnamelastname
      new_username := firstname || lastname;
    ELSIF attempt = 3 THEN
      -- 第四次尝试：firstname + lastname首字母
      new_username := firstname || substring(lastname, 1, 1);
    ELSIF attempt = 4 THEN
      -- 第五次尝试：firstname.lastname + 随机字母
      suffix := random_letters(2);
      new_username := firstname || '.' || lastname || suffix;
    ELSE
      -- 最后尝试：firstname.lastname + 随机字母（更长）
      suffix := random_letters(3);
      new_username := firstname || '.' || lastname || suffix;
    END IF;
    
    -- 检查是否已存在
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE username = new_username) THEN
      RETURN new_username;
    END IF;
    
    attempt := attempt + 1;
    
    -- 防止无限循环
    IF attempt > 10 THEN
      -- 使用原用户名 + 随机字母
      RETURN old_username || random_letters(4);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 更新所有符合格式的会员账号
DO $$
DECLARE
  profile_record RECORD;
  new_username text;
  new_email text;
  updated_count int := 0;
BEGIN
  -- 遍历所有包含数字后缀的用户名
  FOR profile_record IN 
    SELECT id, username, email 
    FROM profiles 
    WHERE username ~ '_[0-9]+$'  -- 匹配以下划线+数字结尾的用户名
    AND email LIKE '%@miaoda.com'  -- 只处理测试账号
  LOOP
    -- 生成新的用户名
    new_username := fix_member_username(profile_record.username);
    new_email := new_username || '@miaoda.com';
    
    -- 更新profile表
    UPDATE profiles 
    SET 
      username = new_username,
      email = new_email,
      updated_at = now()
    WHERE id = profile_record.id;
    
    updated_count := updated_count + 1;
    
    -- 每100条记录输出一次进度
    IF updated_count % 100 = 0 THEN
      RAISE NOTICE '已更新 % 个会员账号...', updated_count;
    END IF;
  END LOOP;
  
  RAISE NOTICE '修复完成！共更新 % 个会员账号', updated_count;
END $$;

-- 清理临时函数
DROP FUNCTION IF EXISTS random_letters(int);
DROP FUNCTION IF EXISTS fix_member_username(text);

-- 验证结果
SELECT 
  '修复后的用户名示例' as description,
  username,
  email
FROM profiles 
WHERE email LIKE '%@miaoda.com'
ORDER BY created_at DESC
LIMIT 20;
