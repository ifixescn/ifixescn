/*
# 创建模块设置表

## 1. 新增枚举类型
- `module_type` - 模块类型枚举（articles, products, questions）

## 2. 新增表
- `module_settings` - 模块设置表
  - `id` (uuid, primary key) - 主键
  - `module_type` (module_type, unique, not null) - 模块类型
  - `display_name` (text, not null) - 模块显示名称
  - `banner_image` (text) - 栏目图片URL
  - `seo_title` (text) - SEO标题
  - `seo_keywords` (text) - SEO关键词
  - `seo_description` (text) - SEO描述
  - `is_enabled` (boolean, default true) - 是否启用
  - `sort_order` (integer, default 0) - 排序
  - `items_per_page` (integer, default 12) - 每页显示数量
  - `show_author` (boolean, default true) - 是否显示作者
  - `show_date` (boolean, default true) - 是否显示日期
  - `show_category` (boolean, default true) - 是否显示分类
  - `allow_comments` (boolean, default false) - 是否允许评论
  - `custom_settings` (jsonb) - 自定义设置
  - `updated_at` (timestamptz, default now()) - 更新时间
  - `created_at` (timestamptz, default now()) - 创建时间

## 3. 索引
- 模块类型唯一索引

## 4. 初始数据
- 插入三个模块的默认设置

## 5. 安全策略
- 公开表，所有用户可读
- 仅管理员可写
*/

-- 创建模块类型枚举
CREATE TYPE module_type AS ENUM ('articles', 'products', 'questions');

-- 创建模块设置表
CREATE TABLE IF NOT EXISTS module_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_type module_type UNIQUE NOT NULL,
  display_name text NOT NULL,
  banner_image text,
  seo_title text,
  seo_keywords text,
  seo_description text,
  is_enabled boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  items_per_page integer DEFAULT 12 NOT NULL,
  show_author boolean DEFAULT true NOT NULL,
  show_date boolean DEFAULT true NOT NULL,
  show_category boolean DEFAULT true NOT NULL,
  allow_comments boolean DEFAULT false NOT NULL,
  custom_settings jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 创建索引
CREATE INDEX idx_module_settings_type ON module_settings(module_type);
CREATE INDEX idx_module_settings_enabled ON module_settings(is_enabled);

-- 启用RLS
ALTER TABLE module_settings ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取
CREATE POLICY "Anyone can read module settings" ON module_settings
  FOR SELECT TO public USING (true);

-- 仅管理员可以修改
CREATE POLICY "Admins can update module settings" ON module_settings
  FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

-- 插入默认设置
INSERT INTO module_settings (module_type, display_name, seo_title, seo_keywords, seo_description, items_per_page, show_author, show_date, show_category)
VALUES 
  (
    'articles'::module_type,
    '文章',
    '文章列表 - CMS内容管理系统',
    '文章,博客,内容,资讯',
    '浏览我们的文章列表，获取最新资讯和深度内容',
    12,
    true,
    true,
    true
  ),
  (
    'products'::module_type,
    '产品',
    '产品展示 - CMS内容管理系统',
    '产品,服务,解决方案',
    '查看我们的产品和服务，找到适合您的解决方案',
    12,
    false,
    true,
    true
  ),
  (
    'questions'::module_type,
    '问答',
    '问答社区 - CMS内容管理系统',
    '问答,社区,帮助,支持',
    '在问答社区中提问和回答，获取帮助和分享知识',
    20,
    true,
    true,
    true
  )
ON CONFLICT (module_type) DO NOTHING;

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_module_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_module_settings_updated_at
  BEFORE UPDATE ON module_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_module_settings_updated_at();

-- 添加注释
COMMENT ON TABLE module_settings IS '模块设置表';
COMMENT ON COLUMN module_settings.module_type IS '模块类型';
COMMENT ON COLUMN module_settings.display_name IS '模块显示名称';
COMMENT ON COLUMN module_settings.banner_image IS '栏目图片URL';
COMMENT ON COLUMN module_settings.seo_title IS 'SEO标题';
COMMENT ON COLUMN module_settings.seo_keywords IS 'SEO关键词';
COMMENT ON COLUMN module_settings.seo_description IS 'SEO描述';
COMMENT ON COLUMN module_settings.is_enabled IS '是否启用';
COMMENT ON COLUMN module_settings.sort_order IS '排序';
COMMENT ON COLUMN module_settings.items_per_page IS '每页显示数量';
COMMENT ON COLUMN module_settings.show_author IS '是否显示作者';
COMMENT ON COLUMN module_settings.show_date IS '是否显示日期';
COMMENT ON COLUMN module_settings.show_category IS '是否显示分类';
COMMENT ON COLUMN module_settings.allow_comments IS '是否允许评论';
COMMENT ON COLUMN module_settings.custom_settings IS '自定义设置JSON';
