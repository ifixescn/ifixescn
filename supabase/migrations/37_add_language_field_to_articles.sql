/*
# 为articles表添加language字段

## 说明
为articles表添加language字段，用于标识文章的语言。支持中文(zh)和英文(en)。

## 变更内容
1. 添加language字段到articles表
   - 类型：text
   - 默认值：'zh'（中文）
   - 可选值：'zh'（中文）、'en'（英文）

2. 为现有文章设置默认语言为中文

## 注意事项
- 现有文章将自动设置为中文
- 新创建的文章默认为中文，可以在创建时指定语言
*/

-- 添加language字段到articles表
ALTER TABLE articles ADD COLUMN IF NOT EXISTS language text DEFAULT 'zh' NOT NULL;

-- 为现有文章设置语言为中文
UPDATE articles SET language = 'zh' WHERE language IS NULL;

-- 添加注释
COMMENT ON COLUMN articles.language IS '文章语言：zh=中文, en=英文';
