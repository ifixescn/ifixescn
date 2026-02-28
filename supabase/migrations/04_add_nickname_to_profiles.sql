/*
# 添加昵称字段到用户资料表

## 变更说明
为profiles表添加nickname字段，允许用户设置显示昵称

## 表结构变更
- `profiles` 表
  - 新增 `nickname` (text, 可选) - 用户昵称

## 注意事项
- 昵称字段为可选，不影响现有数据
- 用户可以自由设置和修改昵称
*/

-- 添加昵称字段
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname text;

-- 添加注释
COMMENT ON COLUMN profiles.nickname IS '用户昵称';
