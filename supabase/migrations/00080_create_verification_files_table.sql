-- 创建验证文件表
CREATE TABLE IF NOT EXISTS verification_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_verification_files_filename ON verification_files(filename);
CREATE INDEX IF NOT EXISTS idx_verification_files_created_at ON verification_files(created_at DESC);

-- 启用RLS
ALTER TABLE verification_files ENABLE ROW LEVEL SECURITY;

-- 创建策略（仅管理员可访问）
CREATE POLICY "管理员可以查看所有验证文件"
  ON verification_files
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "管理员可以插入验证文件"
  ON verification_files
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "管理员可以更新验证文件"
  ON verification_files
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "管理员可以删除验证文件"
  ON verification_files
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 添加注释
COMMENT ON TABLE verification_files IS '微信公众号域名验证文件表';
COMMENT ON COLUMN verification_files.filename IS '文件名（例如：MP_verify_xxxxx.txt）';
COMMENT ON COLUMN verification_files.content IS '文件内容';
COMMENT ON COLUMN verification_files.created_by IS '创建者';
COMMENT ON COLUMN verification_files.updated_at IS '更新时间';