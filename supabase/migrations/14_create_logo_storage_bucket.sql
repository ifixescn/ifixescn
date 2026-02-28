/*
# 创建LOGO图片存储桶

## 1. 新建存储桶
- 桶名称: `app-7fshtpomqha9_logos`
- 用途: 存储网站LOGO图片
- 文件大小限制: 1MB
- 允许的文件类型: image/png, image/jpeg, image/jpg, image/svg+xml, image/webp

## 2. 安全策略
- 所有人可以读取LOGO图片
- 仅管理员可以上传和删除LOGO图片

## 3. 初始化设置
- 在site_settings表中添加site_logo配置项
*/

-- 创建存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-7fshtpomqha9_logos',
  'app-7fshtpomqha9_logos',
  true,
  1048576,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 允许所有人读取LOGO图片
CREATE POLICY "所有人可以查看LOGO图片"
ON storage.objects FOR SELECT
USING (bucket_id = 'app-7fshtpomqha9_logos');

-- 允许管理员上传LOGO图片
CREATE POLICY "管理员可以上传LOGO图片"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'app-7fshtpomqha9_logos' 
  AND is_admin(auth.uid())
);

-- 允许管理员删除LOGO图片
CREATE POLICY "管理员可以删除LOGO图片"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'app-7fshtpomqha9_logos' 
  AND is_admin(auth.uid())
);

-- 在site_settings表中添加site_logo配置项
INSERT INTO site_settings (key, value, description)
VALUES ('site_logo', '', '网站LOGO图片URL')
ON CONFLICT (key) DO NOTHING;
