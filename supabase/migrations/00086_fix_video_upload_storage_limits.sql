-- 修复视频上传存储桶配置
-- 1. 更新视频封面存储桶大小限制从 2MB 到 5MB
UPDATE storage.buckets 
SET file_size_limit = 5242880  -- 5MB in bytes
WHERE id = 'app-7fshtpomqha9_video_covers';

-- 2. 确保视频存储桶支持更多视频格式
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'video/mp4', 
  'video/webm', 
  'video/ogg', 
  'video/quicktime',  -- MOV
  'video/x-msvideo',  -- AVI
  'video/x-matroska', -- MKV
  'video/mpeg',
  'video/3gpp',
  'video/x-flv'
]
WHERE id = 'app-7fshtpomqha9_videos';

-- 3. 确保封面存储桶支持更多图片格式
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'image/png', 
  'image/jpeg', 
  'image/jpg', 
  'image/webp',
  'image/gif',
  'image/bmp'
]
WHERE id = 'app-7fshtpomqha9_video_covers';

-- 添加注释
COMMENT ON TABLE storage.buckets IS '存储桶配置表';
COMMENT ON COLUMN storage.buckets.file_size_limit IS '文件大小限制（字节）';
COMMENT ON COLUMN storage.buckets.allowed_mime_types IS '允许的MIME类型数组';