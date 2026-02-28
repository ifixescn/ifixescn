/*
# 添加产品推荐功能

## 说明
为产品表添加推荐标记字段，支持在后台管理中设置推荐产品

## 更新内容
1. 添加is_featured字段到products表
   - is_featured (boolean, 默认: false) - 是否为推荐产品

## 功能说明
- 管理员可以在后台将产品标记为推荐
- 推荐产品可以在首页或特殊位置展示
- 默认所有产品不是推荐产品
*/

-- 添加is_featured字段到products表
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false NOT NULL;

-- 创建索引以提高推荐产品查询性能
CREATE INDEX IF NOT EXISTS idx_products_featured 
ON products(is_featured) 
WHERE is_featured = true;

-- 添加注释
COMMENT ON COLUMN products.is_featured IS '是否为推荐产品';
