
-- 为百度翻译添加第二个密钥字段（Secret Key），同时保留 api_key（APP ID）
ALTER TABLE translation_engine_settings
  ADD COLUMN api_secret text NOT NULL DEFAULT '';
