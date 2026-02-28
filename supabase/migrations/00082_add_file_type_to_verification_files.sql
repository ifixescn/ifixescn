-- 为 verification_files 表添加 file_type 字段，支持 txt 和 html 格式
ALTER TABLE verification_files 
ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT 'txt' CHECK (file_type IN ('txt', 'html'));

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_verification_files_file_type ON verification_files(file_type);

-- 添加注释
COMMENT ON COLUMN verification_files.file_type IS '文件类型：txt 或 html';

-- 更新表注释，扩展支持范围
COMMENT ON TABLE verification_files IS '搜索引擎验证文件表，支持Google、Bing、Baidu、360、Sogou等所有搜索引擎';
COMMENT ON COLUMN verification_files.filename IS '文件名（例如：google123456.html、MP_verify_xxxxx.txt、BingSiteAuth.xml等）';
