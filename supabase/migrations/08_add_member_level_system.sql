/*
# 添加会员等级系统

## 1. 新增内容
- 创建member_level枚举类型（guest, member, premium, svip）
- 在profiles表添加member_level字段
- 更新默认值为member

## 2. 会员等级说明
- guest: 游客（未登录或未激活）
- member: 普通会员
- premium: 高级会员
- svip: SVIP会员

## 3. 权限设计
- 所有会员可以查看自己的等级
- 管理员可以修改会员等级
- 会员等级影响投稿等功能权限

## 4. 注意事项
- member_level与role字段独立
- role控制系统权限（admin/editor/user）
- member_level控制会员权益
*/

-- 创建会员等级枚举类型
CREATE TYPE member_level AS ENUM ('guest', 'member', 'premium', 'svip');

-- 在profiles表添加member_level字段
ALTER TABLE profiles ADD COLUMN member_level member_level DEFAULT 'member'::member_level NOT NULL;

-- 创建索引以提高查询性能
CREATE INDEX idx_profiles_member_level ON profiles(member_level);

-- 更新现有用户为普通会员
UPDATE profiles SET member_level = 'member'::member_level WHERE member_level IS NULL;

-- 添加注释
COMMENT ON COLUMN profiles.member_level IS '会员等级：guest-游客，member-普通会员，premium-高级会员，svip-SVIP会员';
