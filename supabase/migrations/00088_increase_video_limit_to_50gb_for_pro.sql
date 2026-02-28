-- 将视频存储桶大小限制提升到 50GB（Supabase PRO 版支持）
-- PRO 版实际支持最大 50GB 单文件上传

-- 更新视频存储桶大小限制到 50GB
UPDATE storage.buckets 
SET file_size_limit = 53687091200  -- 50GB = 50 * 1024 * 1024 * 1024 bytes
WHERE id = 'app-7fshtpomqha9_videos';

-- 同时提升 CMS 视频存储桶到 50GB
UPDATE storage.buckets 
SET file_size_limit = 53687091200  -- 50GB
WHERE id = 'app-7fshtpomqha9_cms_videos';

-- 添加注释
COMMENT ON TABLE storage.buckets IS '存储桶配置 - PRO 版支持最大 50GB 单文件';

-- 验证更新
SELECT 
  id,
  ROUND(file_size_limit::numeric / 1024 / 1024 / 1024, 2) as "大小限制(GB)"
FROM storage.buckets 
WHERE id LIKE '%video%'
ORDER BY id;