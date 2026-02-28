/*
# 创建视频存储桶

## 说明
为问答模块和其他内容编辑功能创建视频文件存储桶，支持上传MP4、WebM、OGG格式的视频文件。

## 存储桶配置
- 名称：app-7fshtpomqha9_cms_videos
- 公开访问：是
- 文件大小限制：50MB
- 允许的MIME类型：video/mp4, video/webm, video/ogg

## 安全策略
- 所有认证用户可以上传视频
- 所有用户（包括匿名）可以查看视频
- 只有上传者可以删除自己的视频
*/

-- 创建视频存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-7fshtpomqha9_cms_videos',
  'app-7fshtpomqha9_cms_videos',
  true,
  52428800, -- 50MB in bytes
  ARRAY['video/mp4', 'video/webm', 'video/ogg']
)
ON CONFLICT (id) DO NOTHING;

-- 允许所有认证用户上传视频
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'app-7fshtpomqha9_cms_videos');

-- 允许所有用户查看视频
CREATE POLICY "Anyone can view videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'app-7fshtpomqha9_cms_videos');

-- 允许用户删除自己上传的视频
CREATE POLICY "Users can delete their own videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'app-7fshtpomqha9_cms_videos' AND auth.uid() = owner);
