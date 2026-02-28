/*
# 创建幻灯片（Banner）表和存储桶

## 1. 新建表
- `banners` 表 - 首页幻灯片
  - `id` (uuid, 主键)
  - `title` (text, 标题)
  - `subtitle` (text, 副标题)
  - `image_url` (text, 图片URL)
  - `link_url` (text, 链接URL，可选)
  - `link_text` (text, 链接文字，可选)
  - `sort_order` (int, 排序，默认0)
  - `is_active` (boolean, 是否启用，默认true)
  - `created_at` (timestamptz, 创建时间)
  - `updated_at` (timestamptz, 更新时间)

## 2. 存储桶
- 桶名称: `app-7fshtpomqha9_banners`
- 用途: 存储幻灯片图片
- 文件大小限制: 2MB
- 允许的文件类型: image/png, image/jpeg, image/jpg, image/webp

## 3. 安全策略
- banners表: 所有人可读，仅管理员和编辑可管理
- 存储桶: 所有人可读，仅管理员和编辑可上传/删除
*/

-- 创建banners表
CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text NOT NULL,
  link_url text,
  link_text text,
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_banners_sort_order ON banners(sort_order);
CREATE INDEX idx_banners_is_active ON banners(is_active);

-- 创建更新时间触发器
CREATE TRIGGER update_banners_updated_at 
  BEFORE UPDATE ON banners
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

-- 启用RLS
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- 所有人可以查看启用的幻灯片
CREATE POLICY "所有人可查看启用的幻灯片" ON banners
  FOR SELECT USING (is_active = true);

-- 管理员和编辑可以查看所有幻灯片
CREATE POLICY "管理员和编辑可查看所有幻灯片" ON banners
  FOR SELECT TO authenticated
  USING (is_editor_or_admin(auth.uid()));

-- 管理员和编辑可以管理幻灯片
CREATE POLICY "管理员和编辑可管理幻灯片" ON banners
  FOR ALL TO authenticated
  USING (is_editor_or_admin(auth.uid()));

-- 创建存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-7fshtpomqha9_banners',
  'app-7fshtpomqha9_banners',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 允许所有人读取幻灯片图片
CREATE POLICY "所有人可以查看幻灯片图片"
ON storage.objects FOR SELECT
USING (bucket_id = 'app-7fshtpomqha9_banners');

-- 允许管理员和编辑上传幻灯片图片
CREATE POLICY "管理员和编辑可以上传幻灯片图片"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'app-7fshtpomqha9_banners' 
  AND is_editor_or_admin(auth.uid())
);

-- 允许管理员和编辑删除幻灯片图片
CREATE POLICY "管理员和编辑可以删除幻灯片图片"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'app-7fshtpomqha9_banners' 
  AND is_editor_or_admin(auth.uid())
);

-- 插入示例幻灯片数据
INSERT INTO banners (title, subtitle, image_url, link_url, link_text, sort_order, is_active) VALUES
('欢迎使用CMS内容管理系统', '专业的内容管理平台，集成文章发布、产品展示、问答系统等功能', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=400&fit=crop', '/articles', '浏览文章', 1, true),
('强大的产品展示功能', '支持多图展示、详细描述、分类管理等完整的产品管理功能', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=400&fit=crop', '/products', '查看产品', 2, true),
('互动问答社区', '会员可以提问，管理员和编辑可以回答，构建知识分享平台', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=400&fit=crop', '/questions', '参与问答', 3, true);
