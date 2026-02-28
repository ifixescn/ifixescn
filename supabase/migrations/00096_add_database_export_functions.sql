-- 创建获取表统计信息的RPC函数
CREATE OR REPLACE FUNCTION get_table_statistics()
RETURNS TABLE (
  table_name TEXT,
  row_count BIGINT,
  total_size TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    COALESCE(s.n_live_tup, 0) as row_count,
    pg_size_pretty(pg_total_relation_size(quote_ident(t.schemaname) || '.' || quote_ident(t.tablename)))::TEXT as total_size
  FROM pg_tables t
  LEFT JOIN pg_stat_user_tables s ON t.tablename = s.relname
  WHERE t.schemaname = 'public'
  ORDER BY t.tablename;
END;
$$;

-- 创建获取表结构的RPC函数
CREATE OR REPLACE FUNCTION get_table_structure(table_name_param TEXT)
RETURNS TABLE (
  create_statement TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'CREATE TABLE ' || table_name_param || ' (' || E'\n  ' ||
    string_agg(
      column_name || ' ' || 
      CASE 
        WHEN data_type = 'character varying' THEN 
          'VARCHAR' || COALESCE('(' || character_maximum_length::TEXT || ')', '')
        WHEN data_type = 'timestamp with time zone' THEN 'TIMESTAMPTZ'
        WHEN data_type = 'timestamp without time zone' THEN 'TIMESTAMP'
        WHEN data_type = 'USER-DEFINED' THEN UPPER(udt_name)
        WHEN data_type = 'integer' THEN 'INTEGER'
        WHEN data_type = 'bigint' THEN 'BIGINT'
        WHEN data_type = 'boolean' THEN 'BOOLEAN'
        WHEN data_type = 'text' THEN 'TEXT'
        WHEN data_type = 'uuid' THEN 'UUID'
        WHEN data_type = 'numeric' THEN 'NUMERIC'
        WHEN data_type = 'date' THEN 'DATE'
        WHEN data_type = 'jsonb' THEN 'JSONB'
        WHEN data_type = 'json' THEN 'JSON'
        WHEN data_type = 'ARRAY' THEN udt_name
        ELSE UPPER(data_type)
      END ||
      CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
      CASE 
        WHEN column_default IS NOT NULL AND column_default NOT LIKE 'nextval%' 
        THEN ' DEFAULT ' || column_default 
        ELSE '' 
      END,
      ',' || E'\n  ' ORDER BY ordinal_position
    ) || E'\n);' as create_statement
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = table_name_param
  GROUP BY table_name;
END;
$$;

-- 授予执行权限
GRANT EXECUTE ON FUNCTION get_table_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_structure(TEXT) TO authenticated;

-- 添加注释
COMMENT ON FUNCTION get_table_statistics() IS '获取所有表的统计信息（行数、大小）';
COMMENT ON FUNCTION get_table_structure(TEXT) IS '获取指定表的CREATE TABLE语句';
