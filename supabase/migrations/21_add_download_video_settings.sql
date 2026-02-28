/*
# 添加下载和视频模块设置

## 说明
为下载和视频模块添加模块设置，包括权限控制功能

## 更新内容
1. 创建下载模块设置，添加require_login_to_download权限控制
2. 创建视频模块设置，添加require_login_to_watch权限控制

## 默认设置
- 默认不需要登录即可下载和观看（false）
- 管理员可以在后台修改这些设置
*/

-- 如果下载模块不存在，则创建
INSERT INTO module_settings (
  module_type,
  display_name,
  seo_title,
  seo_keywords,
  seo_description,
  is_enabled,
  sort_order,
  items_per_page,
  show_author,
  show_date,
  show_category,
  allow_comments,
  custom_settings
)
VALUES (
  'download',
  '下载中心',
  '下载中心 - 资源下载',
  '下载,资源,文件',
  '提供各类资源文件下载',
  true,
  3,
  12,
  true,
  true,
  true,
  false,
  '{"require_login_to_download": false}'::jsonb
)
ON CONFLICT (module_type) DO UPDATE
SET custom_settings = jsonb_set(
  COALESCE(module_settings.custom_settings, '{}'::jsonb),
  '{require_login_to_download}',
  'false'::jsonb
);

-- 如果视频模块不存在，则创建
INSERT INTO module_settings (
  module_type,
  display_name,
  seo_title,
  seo_keywords,
  seo_description,
  is_enabled,
  sort_order,
  items_per_page,
  show_author,
  show_date,
  show_category,
  allow_comments,
  custom_settings
)
VALUES (
  'video',
  '视频中心',
  '视频中心 - 在线视频',
  '视频,在线观看,教程',
  '提供各类视频在线观看',
  true,
  4,
  12,
  true,
  true,
  true,
  false,
  '{"require_login_to_watch": false}'::jsonb
)
ON CONFLICT (module_type) DO UPDATE
SET custom_settings = jsonb_set(
  COALESCE(module_settings.custom_settings, '{}'::jsonb),
  '{require_login_to_watch}',
  'false'::jsonb
);
