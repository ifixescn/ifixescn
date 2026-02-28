/*
# 创建下载和视频模块

## 1. 新增表

### downloads 表
- `id` (uuid, 主键)
- `title` (text, 标题, 必填)
- `description` (text, 描述)
- `content` (text, 详细内容)
- `category_id` (uuid, 分类ID, 外键)
- `file_url` (text, 文件URL, 必填)
- `file_name` (text, 文件名)
- `file_size` (bigint, 文件大小，字节)
- `file_type` (text, 文件类型)
- `cover_image` (text, 封面图)
- `download_count` (integer, 下载次数, 默认0)
- `require_member` (boolean, 是否需要会员, 默认true)
- `is_published` (boolean, 是否发布, 默认false)
- `author_id` (uuid, 作者ID, 外键)
- `created_at` (timestamptz, 创建时间)
- `updated_at` (timestamptz, 更新时间)

### videos 表
- `id` (uuid, 主键)
- `title` (text, 标题, 必填)
- `description` (text, 描述)
- `content` (text, 详细内容)
- `category_id` (uuid, 分类ID, 外键)
- `video_url` (text, 视频URL, 必填)
- `cover_image` (text, 封面图)
- `duration` (integer, 时长，秒)
- `view_count` (integer, 观看次数, 默认0)
- `is_published` (boolean, 是否发布, 默认false)
- `author_id` (uuid, 作者ID, 外键)
- `created_at` (timestamptz, 创建时间)
- `updated_at` (timestamptz, 更新时间)

## 2. 存储桶
- `app-7fshtpomqha9_downloads`: 存储下载文件（最大50MB）
- `app-7fshtpomqha9_videos`: 存储视频文件（最大500MB）
- `app-7fshtpomqha9_video_covers`: 存储视频封面图（最大2MB）

## 3. 安全策略
- downloads表：公开可读已发布内容，管理员和编辑可管理
- videos表：公开可读已发布内容，管理员和编辑可管理
- 存储桶：公开可读，管理员和编辑可上传/删除

## 4. RPC函数
- increment_download_count: 增加下载次数
- increment_video_view_count: 增加视频观看次数
*/

-- 修改categories表的type约束，添加download和video类型
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_type_check;
ALTER TABLE categories ADD CONSTRAINT categories_type_check 
  CHECK (type IN ('article', 'product', 'question', 'download', 'video'));

-- 创建downloads表
CREATE TABLE IF NOT EXISTS downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  content text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  file_url text NOT NULL,
  file_name text,
  file_size bigint,
  file_type text,
  cover_image text,
  download_count integer DEFAULT 0,
  require_member boolean DEFAULT true,
  is_published boolean DEFAULT false,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建videos表
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  content text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  video_url text NOT NULL,
  cover_image text,
  duration integer,
  view_count integer DEFAULT 0,
  is_published boolean DEFAULT false,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_downloads_category ON downloads(category_id);
CREATE INDEX IF NOT EXISTS idx_downloads_author ON downloads(author_id);
CREATE INDEX IF NOT EXISTS idx_downloads_published ON downloads(is_published);
CREATE INDEX IF NOT EXISTS idx_downloads_created ON downloads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category_id);
CREATE INDEX IF NOT EXISTS idx_videos_author ON videos(author_id);
CREATE INDEX IF NOT EXISTS idx_videos_published ON videos(is_published);
CREATE INDEX IF NOT EXISTS idx_videos_created ON videos(created_at DESC);

-- 启用RLS
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- downloads表策略
CREATE POLICY "公开可读已发布的下载" ON downloads
  FOR SELECT USING (is_published = true);

CREATE POLICY "管理员和编辑可查看所有下载" ON downloads
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "管理员和编辑可创建下载" ON downloads
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "管理员和编辑可更新下载" ON downloads
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "管理员和编辑可删除下载" ON downloads
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- videos表策略
CREATE POLICY "公开可读已发布的视频" ON videos
  FOR SELECT USING (is_published = true);

CREATE POLICY "管理员和编辑可查看所有视频" ON videos
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "管理员和编辑可创建视频" ON videos
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "管理员和编辑可更新视频" ON videos
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "管理员和编辑可删除视频" ON videos
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- 创建存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('app-7fshtpomqha9_downloads', 'app-7fshtpomqha9_downloads', true, 52428800, ARRAY['application/pdf', 'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain']),
  ('app-7fshtpomqha9_videos', 'app-7fshtpomqha9_videos', true, 524288000, ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']),
  ('app-7fshtpomqha9_video_covers', 'app-7fshtpomqha9_video_covers', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 存储桶策略 - downloads
CREATE POLICY "公开可查看下载文件" ON storage.objects
  FOR SELECT USING (bucket_id = 'app-7fshtpomqha9_downloads');

CREATE POLICY "管理员和编辑可上传下载文件" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'app-7fshtpomqha9_downloads'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "管理员和编辑可删除下载文件" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'app-7fshtpomqha9_downloads'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- 存储桶策略 - videos
CREATE POLICY "公开可查看视频文件" ON storage.objects
  FOR SELECT USING (bucket_id = 'app-7fshtpomqha9_videos');

CREATE POLICY "管理员和编辑可上传视频文件" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'app-7fshtpomqha9_videos'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "管理员和编辑可删除视频文件" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'app-7fshtpomqha9_videos'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- 存储桶策略 - video_covers
CREATE POLICY "公开可查看视频封面" ON storage.objects
  FOR SELECT USING (bucket_id = 'app-7fshtpomqha9_video_covers');

CREATE POLICY "管理员和编辑可上传视频封面" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'app-7fshtpomqha9_video_covers'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "管理员和编辑可删除视频封面" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'app-7fshtpomqha9_video_covers'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- 创建RPC函数：增加下载次数
CREATE OR REPLACE FUNCTION increment_download_count(download_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE downloads
  SET download_count = download_count + 1
  WHERE id = download_id;
END;
$$;

-- 创建RPC函数：增加视频观看次数
CREATE OR REPLACE FUNCTION increment_video_view_count(video_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE videos
  SET view_count = view_count + 1
  WHERE id = video_id;
END;
$$;

-- 插入示例下载分类
INSERT INTO categories (name, slug, type, description)
VALUES 
  ('软件工具', 'software-tools', 'download', '各类软件和工具下载'),
  ('文档资料', 'documents', 'download', '文档、教程等资料下载'),
  ('源码模板', 'source-code', 'download', '源代码和模板下载')
ON CONFLICT DO NOTHING;

-- 插入示例视频分类
INSERT INTO categories (name, slug, type, description)
VALUES 
  ('教程视频', 'tutorial-videos', 'video', '各类教程和培训视频'),
  ('产品演示', 'product-demos', 'video', '产品功能演示视频'),
  ('活动回顾', 'event-reviews', 'video', '活动和会议回顾视频')
ON CONFLICT DO NOTHING;

-- 插入示例下载数据
INSERT INTO downloads (title, description, content, file_url, file_name, file_size, file_type, require_member, is_published, category_id)
SELECT 
  '示例下载文件',
  '这是一个示例下载文件，仅供会员下载',
  '<p>这是一个示例下载文件的详细说明。</p><p>包含以下内容：</p><ul><li>功能介绍</li><li>使用说明</li><li>注意事项</li></ul>',
  'https://example.com/sample.pdf',
  'sample.pdf',
  1024000,
  'application/pdf',
  true,
  true,
  id
FROM categories WHERE name = '文档资料' AND type = 'download'
LIMIT 1;

-- 插入示例视频数据
INSERT INTO videos (title, description, content, video_url, cover_image, duration, is_published, category_id)
SELECT 
  '示例教程视频',
  '这是一个示例教程视频',
  '<p>这是一个示例教程视频的详细介绍。</p><p>视频内容包括：</p><ul><li>基础知识讲解</li><li>实战演示</li><li>常见问题解答</li></ul>',
  'https://example.com/sample.mp4',
  'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=800',
  1800,
  true,
  id
FROM categories WHERE name = '教程视频' AND type = 'video'
LIMIT 1;
