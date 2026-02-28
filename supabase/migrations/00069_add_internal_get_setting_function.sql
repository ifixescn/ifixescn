/*
# 添加内部配置获取函数

## 说明
- 创建 get_system_setting_internal 函数供 Edge Function 使用
- 不需要权限检查，因为 Edge Function 使用 service_role
- 保留原有的 get_system_setting 函数供前端使用
*/

-- 创建内部配置获取函数（供 Edge Function 使用）
CREATE OR REPLACE FUNCTION get_system_setting_internal(p_setting_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_setting_value jsonb;
BEGIN
  -- 不检查权限，因为 Edge Function 使用 service_role 调用
  SELECT setting_value INTO v_setting_value
  FROM system_settings
  WHERE setting_key = p_setting_key;

  RETURN COALESCE(v_setting_value, 'null'::jsonb);
END;
$$;

-- 添加注释
COMMENT ON FUNCTION get_system_setting_internal IS '内部配置获取函数，供 Edge Function 使用，不检查权限';
