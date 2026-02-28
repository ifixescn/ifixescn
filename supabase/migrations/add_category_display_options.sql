/*
# 为分类表添加显示选项字段

## 1. 新增字段
为 `categories` 表添加以下显示选项字段：
- `show_author` (boolean, default true) - 是否显示作者
- `show_date` (boolean, default true) - 是否显示日期
- `show_category` (boolean, default true) - 是否显示分类

## 2. 说明
这些字段用于控制分类列表页中内容的显示选项
*/

-- 添加显示选项字段
ALTER TABLE categories ADD COLUMN IF NOT EXISTS show_author boolean DEFAULT true NOT NULL;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS show_date boolean DEFAULT true NOT NULL;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS show_category boolean DEFAULT true NOT NULL;

-- 添加注释
COMMENT ON COLUMN categories.show_author IS '是否显示作者';
COMMENT ON COLUMN categories.show_date IS '是否显示日期';
COMMENT ON COLUMN categories.show_category IS '是否显示分类';
