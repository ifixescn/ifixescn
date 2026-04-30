-- 为翻译引擎设置表添加优先级列
ALTER TABLE translation_engine_settings ADD COLUMN priority integer NOT NULL DEFAULT 99;

-- 设置各引擎优先级：百度最高(1)，其次Google(2)、DeepL(3)、MyMemory(4)、browser_detection最低(99)
UPDATE translation_engine_settings SET priority = 1 WHERE engine_key = 'baidu';
UPDATE translation_engine_settings SET priority = 2 WHERE engine_key = 'google';
UPDATE translation_engine_settings SET priority = 3 WHERE engine_key = 'deepl';
UPDATE translation_engine_settings SET priority = 4 WHERE engine_key = 'mymemory';
UPDATE translation_engine_settings SET priority = 99 WHERE engine_key = 'browser_detection';