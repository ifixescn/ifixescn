
-- 翊鸢化工产品表
CREATE TABLE IF NOT EXISTS yiyuan_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_zh TEXT,
  description_en TEXT,
  image_url TEXT,
  specifications_zh TEXT,
  specifications_en TEXT,
  features_zh TEXT[],
  features_en TEXT[],
  applications_zh TEXT[],
  applications_en TEXT[],
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 翊鸢化工页面内容表（支持多语言）
CREATE TABLE IF NOT EXISTS yiyuan_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE,
  title_zh TEXT,
  title_en TEXT,
  content_zh TEXT,
  content_en TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 翊鸢化工防伪验证说明表（支持多语言）
CREATE TABLE IF NOT EXISTS yiyuan_verification_guide (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_number INTEGER NOT NULL,
  title_zh TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_zh TEXT,
  description_en TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_yiyuan_products_order ON yiyuan_products(display_order);
CREATE INDEX IF NOT EXISTS idx_yiyuan_products_active ON yiyuan_products(is_active);
CREATE INDEX IF NOT EXISTS idx_yiyuan_verification_order ON yiyuan_verification_guide(display_order);

-- 插入初始数据
INSERT INTO yiyuan_content (section_key, title_zh, title_en, content_zh, content_en) VALUES
('hero', '翊鸢化工', 'Yiyuan Chemical', '专业化工产品供应商，致力于为客户提供高品质的化工产品和解决方案', 'Professional chemical product supplier, committed to providing high-quality chemical products and solutions to customers'),
('about', '关于我们', 'About Us', '翊鸢化工是一家专注于化工产品研发、生产和销售的现代化企业。我们拥有先进的生产设备和专业的技术团队，为客户提供优质的产品和服务。', 'Yiyuan Chemical is a modern enterprise focusing on the research, production and sales of chemical products. We have advanced production equipment and professional technical team to provide customers with high-quality products and services.'),
('verification_intro', '产品防伪验证', 'Product Anti-counterfeiting Verification', '为保障您的权益，我们为每件产品提供唯一的防伪码。请按照以下步骤进行验证：', 'To protect your rights, we provide a unique anti-counterfeiting code for each product. Please follow the steps below to verify:')
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO yiyuan_verification_guide (step_number, title_zh, title_en, description_zh, description_en, display_order) VALUES
(1, '找到防伪标签', 'Find the Anti-counterfeiting Label', '在产品包装上找到防伪标签，标签上印有唯一的防伪码', 'Find the anti-counterfeiting label on the product packaging, which has a unique anti-counterfeiting code', 1),
(2, '刮开涂层', 'Scratch the Coating', '轻轻刮开防伪标签上的涂层，露出防伪码', 'Gently scratch the coating on the anti-counterfeiting label to reveal the anti-counterfeiting code', 2),
(3, '输入验证码', 'Enter the Verification Code', '在验证页面输入防伪码，点击验证按钮', 'Enter the anti-counterfeiting code on the verification page and click the verify button', 3),
(4, '查看验证结果', 'View Verification Result', '系统将显示产品信息和验证结果，首次验证显示"正品"，多次验证请谨慎', 'The system will display product information and verification results. The first verification shows "Genuine", please be cautious about multiple verifications', 4);

INSERT INTO yiyuan_products (name_zh, name_en, description_zh, description_en, specifications_zh, specifications_en, features_zh, features_en, applications_zh, applications_en, display_order) VALUES
('工业级乙醇', 'Industrial Grade Ethanol', '高纯度工业级乙醇，适用于各种工业应用', 'High purity industrial grade ethanol, suitable for various industrial applications', '纯度：≥99.5%
包装：200L/桶
储存：阴凉干燥处', 'Purity: ≥99.5%
Packaging: 200L/drum
Storage: Cool and dry place', 
ARRAY['高纯度', '低杂质', '稳定性好', '符合国家标准'], 
ARRAY['High purity', 'Low impurity', 'Good stability', 'Meets national standards'],
ARRAY['溶剂', '清洗剂', '化工原料', '医药中间体'],
ARRAY['Solvent', 'Cleaning agent', 'Chemical raw material', 'Pharmaceutical intermediate'],
1),
('精细化工助剂', 'Fine Chemical Additives', '专业的化工助剂产品，提升产品性能', 'Professional chemical additive products to improve product performance', '类型：多功能助剂
包装：25kg/袋
有效期：12个月', 'Type: Multifunctional additive
Packaging: 25kg/bag
Shelf life: 12 months',
ARRAY['高效能', '环保型', '易使用', '性价比高'],
ARRAY['High efficiency', 'Environmentally friendly', 'Easy to use', 'Cost-effective'],
ARRAY['涂料', '塑料', '橡胶', '纺织'],
ARRAY['Coatings', 'Plastics', 'Rubber', 'Textiles'],
2);

-- 设置 RLS 策略
ALTER TABLE yiyuan_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE yiyuan_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE yiyuan_verification_guide ENABLE ROW LEVEL SECURITY;

-- 公开读取权限
CREATE POLICY "Allow public read yiyuan_products" ON yiyuan_products FOR SELECT USING (true);
CREATE POLICY "Allow public read yiyuan_content" ON yiyuan_content FOR SELECT USING (true);
CREATE POLICY "Allow public read yiyuan_verification_guide" ON yiyuan_verification_guide FOR SELECT USING (true);

-- 管理员完全权限
CREATE POLICY "Allow admin all yiyuan_products" ON yiyuan_products FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Allow admin all yiyuan_content" ON yiyuan_content FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Allow admin all yiyuan_verification_guide" ON yiyuan_verification_guide FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
