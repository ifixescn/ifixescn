/*
# 添加编辑角色权限

## 问题说明
编辑角色无法保存产品，因为RLS策略只允许管理员操作

## 解决方案
1. 创建 is_admin_or_editor() 函数
2. 更新products表的RLS策略
3. 更新product_images表的RLS策略

## 变更内容
- 新增函数：is_admin_or_editor()
- 更新策略：允许编辑角色管理产品和产品图片
*/

-- 创建检查是否是管理员或编辑的函数
CREATE OR REPLACE FUNCTION is_admin_or_editor(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role IN ('admin'::user_role, 'editor'::user_role)
  );
$$;

-- 删除旧的产品管理策略
DROP POLICY IF EXISTS "管理员可管理所有产品" ON products;

-- 创建新的产品管理策略（管理员和编辑都可以）
CREATE POLICY "管理员和编辑可管理所有产品" ON products
  FOR ALL TO authenticated 
  USING (is_admin_or_editor(auth.uid()))
  WITH CHECK (is_admin_or_editor(auth.uid()));

-- 删除旧的产品图片管理策略
DROP POLICY IF EXISTS "管理员可管理产品图片" ON product_images;

-- 创建新的产品图片管理策略（管理员和编辑都可以）
CREATE POLICY "管理员和编辑可管理产品图片" ON product_images
  FOR ALL TO authenticated 
  USING (is_admin_or_editor(auth.uid()))
  WITH CHECK (is_admin_or_editor(auth.uid()));

-- 添加注释
COMMENT ON FUNCTION is_admin_or_editor(uuid) IS '检查用户是否是管理员或编辑角色';
