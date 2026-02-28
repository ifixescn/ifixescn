-- 创建微信配置表
CREATE TABLE IF NOT EXISTS wechat_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('miniprogram', 'official_account')),
  name TEXT NOT NULL,
  app_id TEXT NOT NULL,
  app_secret TEXT NOT NULL,
  token TEXT,
  encoding_aes_key TEXT,
  config_data JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(type, app_id)
);

-- 添加注释
COMMENT ON TABLE wechat_configs IS '微信配置表 - 存储小程序和公众号配置';
COMMENT ON COLUMN wechat_configs.type IS '类型: miniprogram=小程序, official_account=公众号';
COMMENT ON COLUMN wechat_configs.name IS '配置名称';
COMMENT ON COLUMN wechat_configs.app_id IS '微信 AppID';
COMMENT ON COLUMN wechat_configs.app_secret IS '微信 AppSecret';
COMMENT ON COLUMN wechat_configs.token IS '微信 Token';
COMMENT ON COLUMN wechat_configs.encoding_aes_key IS '消息加密密钥';
COMMENT ON COLUMN wechat_configs.config_data IS '其他配置数据(JSON)';
COMMENT ON COLUMN wechat_configs.is_active IS '是否启用';

-- 创建索引
CREATE INDEX idx_wechat_configs_type ON wechat_configs(type);
CREATE INDEX idx_wechat_configs_is_active ON wechat_configs(is_active);
CREATE INDEX idx_wechat_configs_created_at ON wechat_configs(created_at DESC);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_wechat_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_wechat_configs_updated_at
  BEFORE UPDATE ON wechat_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_wechat_configs_updated_at();

-- RLS 策略
ALTER TABLE wechat_configs ENABLE ROW LEVEL SECURITY;

-- 只有 admin 可以查看
CREATE POLICY "Admin can view wechat configs"
  ON wechat_configs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 只有 admin 可以插入
CREATE POLICY "Admin can insert wechat configs"
  ON wechat_configs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 只有 admin 可以更新
CREATE POLICY "Admin can update wechat configs"
  ON wechat_configs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 只有 admin 可以删除
CREATE POLICY "Admin can delete wechat configs"
  ON wechat_configs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 插入示例数据
INSERT INTO wechat_configs (type, name, app_id, app_secret, token, encoding_aes_key, config_data, is_active)
VALUES 
  (
    'miniprogram',
    '主小程序',
    'wx1234567890abcdef',
    'your_miniprogram_secret_here',
    'your_token_here',
    'your_encoding_aes_key_here',
    '{
      "description": "主要的微信小程序配置",
      "version": "1.0.0",
      "permissions": ["userInfo", "location", "payment"]
    }'::jsonb,
    true
  ),
  (
    'official_account',
    '主公众号',
    'wx0987654321fedcba',
    'your_official_account_secret_here',
    'your_token_here',
    'your_encoding_aes_key_here',
    '{
      "description": "主要的微信公众号配置",
      "type": "service",
      "verified": true,
      "permissions": ["message", "menu", "user"]
    }'::jsonb,
    true
  )
ON CONFLICT (type, app_id) DO NOTHING;