-- 删除现有的RLS策略
DROP POLICY IF EXISTS "管理员可以查看所有验证文件" ON verification_files;
DROP POLICY IF EXISTS "管理员可以插入验证文件" ON verification_files;
DROP POLICY IF EXISTS "管理员可以更新验证文件" ON verification_files;
DROP POLICY IF EXISTS "管理员可以删除验证文件" ON verification_files;

-- 创建新的策略：公开读取，管理员管理
CREATE POLICY "任何人都可以读取验证文件"
  ON verification_files
  FOR SELECT
  TO public
  USING (true);

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