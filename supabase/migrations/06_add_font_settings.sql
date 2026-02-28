/*
# 添加字体设置

1. 新增设置项
  - `site_font` - 网站字体设置
  - 默认值：Inter（现代、清晰、适合UI）

2. 支持的字体列表
  - Inter：现代、清晰、专业，适合UI界面
  - Poppins：几何、友好、现代感强
  - Roboto：经典、专业、可读性强
  - Montserrat：都市、时尚、大气
  - Open Sans：人文主义、友好、通用性强
  - Lato：温暖、稳定、企业级
  - Raleway：优雅、精致、高端
  - Nunito：圆润、友好、现代

3. 字体加载
  - 使用Google Fonts CDN
  - 支持动态切换
  - 自动应用到全站
*/

-- 插入默认字体设置
INSERT INTO site_settings (key, value, description)
VALUES 
  ('site_font', 'Inter', 'Website font family')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description;
