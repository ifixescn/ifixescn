-- 将视频存储桶大小限制提升到最大值 5GB
-- Supabase 支持的最大单文件大小为 5GB

-- 更新视频存储桶大小限制
UPDATE storage.buckets 
SET file_size_limit = 5368709120  -- 5GB = 5 * 1024 * 1024 * 1024 bytes
WHERE id = 'app-7fshtpomqha9_videos';

-- 添加注释说明
COMMENT ON TABLE storage.buckets IS '存储桶配置表 - 视频存储桶已设置为最大 5GB';

-- 验证更新
SELECT 
  id,
  ROUND(file_size_limit::numeric / 1024 / 1024 / 1024, 2) as size_limit_gb
FROM storage.buckets 
WHERE id = 'app-7fshtpomqha9_videos';