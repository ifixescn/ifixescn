-- 创建翊鸢化工生产商信息表
CREATE TABLE IF NOT EXISTS yiyuan_manufacturer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_zh TEXT NOT NULL DEFAULT '符合行业标准',
  standard_en TEXT NOT NULL DEFAULT 'Complies with industry standards',
  origin_zh TEXT NOT NULL DEFAULT '广东·深圳',
  origin_en TEXT NOT NULL DEFAULT 'Shenzhen, Guangdong',
  company_name_zh TEXT NOT NULL DEFAULT '义乌市颂祝浔礼文化创意有限公司',
  company_name_en TEXT NOT NULL DEFAULT 'Yiwu Songzhuxunli Cultural Creative Co., Ltd.',
  address_zh TEXT NOT NULL DEFAULT '浙江省义乌市甘三里街道春潮路11号3楼',
  address_en TEXT NOT NULL DEFAULT '3rd Floor, No. 11 Chunchao Road, Gansanli Street, Yiwu City, Zhejiang Province',
  website TEXT NOT NULL DEFAULT 'www.ifixes.com.cn',
  email TEXT NOT NULL DEFAULT 'dps@ifixes.com.cn',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入默认数据（只保留一条记录）
INSERT INTO yiyuan_manufacturer (
  standard_zh, standard_en,
  origin_zh, origin_en,
  company_name_zh, company_name_en,
  address_zh, address_en,
  website, email
) VALUES (
  '符合行业标准', 'Complies with industry standards',
  '广东·深圳', 'Shenzhen, Guangdong',
  '义乌市颂祝浔礼文化创意有限公司', 'Yiwu Songzhuxunli Cultural Creative Co., Ltd.',
  '浙江省义乌市甘三里街道春潮路11号3楼', '3rd Floor, No. 11 Chunchao Road, Gansanli Street, Yiwu City, Zhejiang Province',
  'www.ifixes.com.cn', 'dps@ifixes.com.cn'
);

-- 创建 RLS 策略
ALTER TABLE yiyuan_manufacturer ENABLE ROW LEVEL SECURITY;

-- 允许所有人查看
CREATE POLICY "允许所有人查看生产商信息"
  ON yiyuan_manufacturer
  FOR SELECT
  TO public
  USING (true);

-- 只允许管理员修改
CREATE POLICY "只允许管理员修改生产商信息"
  ON yiyuan_manufacturer
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 添加注释
COMMENT ON TABLE yiyuan_manufacturer IS '翊鸢化工生产商信息表';
COMMENT ON COLUMN yiyuan_manufacturer.standard_zh IS '执行标准（中文）';
COMMENT ON COLUMN yiyuan_manufacturer.standard_en IS '执行标准（英文）';
COMMENT ON COLUMN yiyuan_manufacturer.origin_zh IS '产地（中文）';
COMMENT ON COLUMN yiyuan_manufacturer.origin_en IS '产地（英文）';
COMMENT ON COLUMN yiyuan_manufacturer.company_name_zh IS '公司名称（中文）';
COMMENT ON COLUMN yiyuan_manufacturer.company_name_en IS '公司名称（英文）';
COMMENT ON COLUMN yiyuan_manufacturer.address_zh IS '地址（中文）';
COMMENT ON COLUMN yiyuan_manufacturer.address_en IS '地址（英文）';
COMMENT ON COLUMN yiyuan_manufacturer.website IS '网址';
COMMENT ON COLUMN yiyuan_manufacturer.email IS '邮箱';