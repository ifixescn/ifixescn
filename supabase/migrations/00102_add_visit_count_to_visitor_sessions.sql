
-- 添加 visit_count 列（新版 record_page_view RPC 需要此字段）
ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS visit_count INTEGER DEFAULT 0;

-- 清理重复的 visitor_id 行，只保留最近的一条
DELETE FROM visitor_sessions
WHERE id NOT IN (
  SELECT DISTINCT ON (visitor_id) id
  FROM visitor_sessions
  ORDER BY visitor_id, last_visit DESC
);

-- 为 visitor_id 添加唯一约束，支持 ON CONFLICT (visitor_id)
ALTER TABLE visitor_sessions ADD CONSTRAINT visitor_sessions_visitor_id_unique UNIQUE (visitor_id);
