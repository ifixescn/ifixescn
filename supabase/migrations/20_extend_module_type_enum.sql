/*
# 扩展module_type枚举类型

## 说明
为module_type枚举添加download和video类型，以支持下载和视频模块的设置管理

## 更新内容
- 添加'download'到module_type枚举
- 添加'video'到module_type枚举
*/

-- 扩展module_type枚举类型，添加download和video
ALTER TYPE module_type ADD VALUE IF NOT EXISTS 'download';
ALTER TYPE module_type ADD VALUE IF NOT EXISTS 'video';
