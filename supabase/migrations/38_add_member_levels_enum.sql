/*
# 添加新的会员等级枚举值

## 1. 新增会员等级
- bronze: 铜牌会员（注册即可获得）
- silver: 银牌会员（邮箱验证后升级）
- gold: 金牌会员（高级会员）

## 2. 注意事项
- 枚举值添加后需要在新事务中使用
*/

-- 添加新的会员等级枚举值
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'bronze' AND enumtypid = 'member_level'::regtype) THEN
    ALTER TYPE member_level ADD VALUE 'bronze';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'silver' AND enumtypid = 'member_level'::regtype) THEN
    ALTER TYPE member_level ADD VALUE 'silver';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'gold' AND enumtypid = 'member_level'::regtype) THEN
    ALTER TYPE member_level ADD VALUE 'gold';
  END IF;
END $$;
