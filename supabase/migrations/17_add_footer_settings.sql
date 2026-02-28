/*
# 添加页脚版权设置

## 说明
为网站添加页脚版权相关的配置项，包括：
- 公司名称
- 版权信息
- 关于我们
- 联系地址
- 联系电话
- 营业时间
- ICP备案号
- 公安备案号

## 新增设置项
- `company_name`: 公司/组织名称
- `copyright_text`: 版权文本（自动添加年份）
- `about_us`: 关于我们的简介
- `contact_address`: 联系地址
- `contact_phone`: 联系电话
- `business_hours`: 营业时间
- `icp_number`: ICP备案号
- `police_number`: 公安备案号
- `footer_links`: 页脚链接（JSON格式）

## 安全性
- 所有设置项公开可读
- 仅管理员可修改
*/

-- 插入页脚版权相关设置
INSERT INTO site_settings (key, value, description) VALUES
  ('company_name', 'CMS内容管理系统', '公司/组织名称'),
  ('copyright_text', 'CMS内容管理系统', '版权文本'),
  ('about_us', '我们致力于提供专业的内容管理解决方案，帮助企业和个人更好地管理和展示内容。', '关于我们简介'),
  ('contact_address', '', '联系地址'),
  ('contact_phone', '', '联系电话'),
  ('business_hours', '周一至周五 9:00-18:00', '营业时间'),
  ('icp_number', '', 'ICP备案号'),
  ('police_number', '', '公安备案号'),
  ('footer_links', '[]', '页脚链接（JSON格式）')
ON CONFLICT (key) DO UPDATE SET
  description = EXCLUDED.description;
