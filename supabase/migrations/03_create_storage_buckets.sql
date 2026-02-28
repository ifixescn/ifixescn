/*
# 创建存储桶用于文件上传

## 1. 新建存储桶
- `app-7fshtpomqha9_cms_images` - 用于存储CMS系统的所有图片文件
  - 支持的文件类型: image/jpeg, image/png, image/gif, image/webp, image/avif
  - 最大文件大小: 1MB
  - 公开访问: 是

- `app-7fshtpomqha9_cms_files` - 用于存储其他类型的文件
  - 支持的文件类型: 所有类型
  - 最大文件大小: 5MB
  - 公开访问: 是

## 2. 安全策略
- 所有用户都可以上传文件（因为系统没有强制登录）
- 所有用户都可以读取文件
- 只有管理员可以删除文件

## 3. 注意事项
- 文件名必须只包含英文字母和数字
- 图片超过1MB会自动压缩
*/

-- 创建图片存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-7fshtpomqha9_cms_images',
  'app-7fshtpomqha9_cms_images',
  true,
  1048576,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']
) ON CONFLICT (id) DO NOTHING;

-- 创建文件存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-7fshtpomqha9_cms_files',
  'app-7fshtpomqha9_cms_files',
  true,
  5242880,
  NULL
) ON CONFLICT (id) DO NOTHING;

-- 允许所有用户上传图片
CREATE POLICY "允许所有用户上传图片" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'app-7fshtpomqha9_cms_images');

-- 允许所有用户读取图片
CREATE POLICY "允许所有用户读取图片" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'app-7fshtpomqha9_cms_images');

-- 允许所有用户上传文件
CREATE POLICY "允许所有用户上传文件" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'app-7fshtpomqha9_cms_files');

-- 允许所有用户读取文件
CREATE POLICY "允许所有用户读取文件" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'app-7fshtpomqha9_cms_files');

-- 只允许管理员删除图片
CREATE POLICY "只允许管理员删除图片" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'app-7fshtpomqha9_cms_images' 
    AND is_admin(auth.uid())
  );

-- 只允许管理员删除文件
CREATE POLICY "只允许管理员删除文件" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'app-7fshtpomqha9_cms_files' 
    AND is_admin(auth.uid())
  );
