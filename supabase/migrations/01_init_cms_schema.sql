/*
# CMS Content Management System - Initialize Database Structure

## 1. New Tables

### 1.1 User Role Enum
- `user_role`: User role types (admin=Administrator, editor=Editor, member=Member, visitor=Visitor)

### 1.2 profiles table - User Information
- `id` (uuid, primary key, references auth.users)
- `username` (text, unique, username)
- `email` (text, unique, email address)
- `phone` (text, phone number)
- `avatar_url` (text, avatar URL)
- `role` (user_role, default: 'member', user role)
- `created_at` (timestamptz, creation time)
- `updated_at` (timestamptz, update time)

### 1.3 categories table - Categories
- `id` (uuid, primary key)
- `name` (text, category name)
- `slug` (text, unique, URL slug)
- `type` (text, category type: article/product/question)
- `description` (text, description)
- `created_at` (timestamptz, creation time)

### 1.4 articles table - Articles
- `id` (uuid, primary key)
- `title` (text, title)
- `slug` (text, unique, URL slug)
- `content` (text, content)
- `excerpt` (text, excerpt)
- `cover_image` (text, cover image)
- `category_id` (uuid, category ID)
- `author_id` (uuid, author ID)
- `status` (text, status: draft/published/offline)
- `view_count` (int, view count)
- `created_at` (timestamptz, creation time)
- `updated_at` (timestamptz, update time)
- `published_at` (timestamptz, publish time)

### 1.5 products table - Products
- `id` (uuid, primary key)
- `name` (text, product name)
- `slug` (text, unique, URL slug)
- `description` (text, product description)
- `content` (text, detailed content)
- `price` (numeric, price)
- `category_id` (uuid, category ID)
- `status` (text, status: draft/published/offline)
- `view_count` (int, view count)
- `created_at` (timestamptz, creation time)
- `updated_at` (timestamptz, update time)

### 1.6 product_images table - Product Images
- `id` (uuid, primary key)
- `product_id` (uuid, product ID)
- `image_url` (text, image URL)
- `sort_order` (int, sort order)
- `created_at` (timestamptz, creation time)

### 1.7 questions table - Questions
- `id` (uuid, primary key)
- `title` (text, question title)
- `content` (text, question content)
- `category_id` (uuid, category ID)
- `author_id` (uuid, author ID)
- `status` (text, status: pending/approved/rejected)
- `view_count` (int, view count)
- `created_at` (timestamptz, creation time)
- `updated_at` (timestamptz, update time)

### 1.8 answers table - Answers
- `id` (uuid, primary key)
- `question_id` (uuid, question ID)
- `content` (text, answer content)
- `author_id` (uuid, author ID)
- `is_accepted` (boolean, is accepted)
- `created_at` (timestamptz, creation time)
- `updated_at` (timestamptz, update time)

### 1.9 site_settings table - Site Settings
- `id` (uuid, primary key)
- `key` (text, unique, setting key)
- `value` (text, setting value)
- `description` (text, description)
- `updated_at` (timestamptz, update time)

### 1.10 analytics table - Visit Statistics
- `id` (uuid, primary key)
- `page_path` (text, page path)
- `visitor_id` (text, visitor ID)
- `user_id` (uuid, user ID, nullable)
- `created_at` (timestamptz, visit time)

## 2. Security Policies
- profiles table: Enable RLS, admins have full access, users can view and edit their own info (cannot change role)
- categories table: Public read, admins and editors can write
- articles table: Public read for published articles, authors and admins can manage
- products table: Public read for published products, admins can manage
- product_images table: Public read, admins can manage
- questions table: Public read for approved questions, members can ask, admins and editors can manage
- answers table: Public read, members can answer, admins and editors can manage
- site_settings table: Public read, only admins can modify
- analytics table: Public write, only admins can read

## 3. Triggers
- Automatically set first registered user as admin
- Automatically update updated_at field

## 4. Storage Buckets
- cms_images: Store image files (max 1MB)
- cms_videos: Store video files
- cms_audios: Store audio files
*/

-- Create user role enum
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'member', 'visitor');

-- Create content status enum
CREATE TYPE content_status AS ENUM ('draft', 'published', 'offline');

-- Create question status enum
CREATE TYPE question_status AS ENUM ('pending', 'approved', 'rejected');

-- 1. profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  email text UNIQUE,
  phone text,
  avatar_url text,
  role user_role DEFAULT 'member'::user_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('article', 'product', 'question')),
  description text,
  created_at timestamptz DEFAULT now()
);

-- 3. articles table
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL,
  excerpt text,
  cover_image text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status content_status DEFAULT 'draft'::content_status NOT NULL,
  view_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz
);

-- 4. products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  content text,
  price numeric(10, 2),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  status content_status DEFAULT 'draft'::content_status NOT NULL,
  view_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. product_images table
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 6. questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status question_status DEFAULT 'pending'::question_status NOT NULL,
  view_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. answers table
CREATE TABLE IF NOT EXISTS answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  content text NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  is_accepted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- 9. analytics table
CREATE TABLE IF NOT EXISTS analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path text NOT NULL,
  visitor_id text NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_category ON articles(category_id);
CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_questions_author ON questions(author_id);
CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_analytics_page ON analytics(page_path);
CREATE INDEX idx_analytics_created ON analytics(created_at);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Create helper functions
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

CREATE OR REPLACE FUNCTION is_editor_or_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role IN ('admin'::user_role, 'editor'::user_role)
  );
$$;

-- profiles table policies
CREATE POLICY "管理员可查看所有用户" ON profiles
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "用户可查看自己的信息" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "用户可更新自己的信息但不能改角色" ON profiles
  FOR UPDATE USING (auth.uid() = id) 
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()));

CREATE POLICY "管理员可更新所有用户" ON profiles
  FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

-- categories table policies
CREATE POLICY "所有人可查看分类" ON categories FOR SELECT USING (true);
CREATE POLICY "管理员和编辑可管理分类" ON categories FOR ALL TO authenticated USING (is_editor_or_admin(auth.uid()));

-- articles table policies
CREATE POLICY "所有人可查看已发布文章" ON articles 
  FOR SELECT USING (status = 'published'::content_status);

CREATE POLICY "作者可查看自己的文章" ON articles 
  FOR SELECT TO authenticated USING (author_id = auth.uid());

CREATE POLICY "管理员和编辑可查看所有文章" ON articles 
  FOR SELECT TO authenticated USING (is_editor_or_admin(auth.uid()));

CREATE POLICY "作者可创建文章" ON articles 
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());

CREATE POLICY "作者可更新自己的文章" ON articles 
  FOR UPDATE TO authenticated USING (author_id = auth.uid());

CREATE POLICY "管理员和编辑可管理所有文章" ON articles 
  FOR ALL TO authenticated USING (is_editor_or_admin(auth.uid()));

CREATE POLICY "作者可删除自己的文章" ON articles 
  FOR DELETE TO authenticated USING (author_id = auth.uid());

-- products table policies
CREATE POLICY "所有人可查看已发布产品" ON products 
  FOR SELECT USING (status = 'published'::content_status);

CREATE POLICY "管理员可管理所有产品" ON products 
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- product_images table policies
CREATE POLICY "所有人可查看产品图片" ON product_images FOR SELECT USING (true);
CREATE POLICY "管理员可管理产品图片" ON product_images FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- questions table policies
CREATE POLICY "所有人可查看已审核问题" ON questions 
  FOR SELECT USING (status = 'approved'::question_status);

CREATE POLICY "提问者可查看自己的问题" ON questions 
  FOR SELECT TO authenticated USING (author_id = auth.uid());

CREATE POLICY "管理员和编辑可查看所有问题" ON questions 
  FOR SELECT TO authenticated USING (is_editor_or_admin(auth.uid()));

CREATE POLICY "会员可提问" ON questions 
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());

CREATE POLICY "提问者可更新自己的问题" ON questions 
  FOR UPDATE TO authenticated USING (author_id = auth.uid());

CREATE POLICY "管理员和编辑可管理所有问题" ON questions 
  FOR ALL TO authenticated USING (is_editor_or_admin(auth.uid()));

-- answers table policies
CREATE POLICY "所有人可查看回答" ON answers FOR SELECT USING (true);

CREATE POLICY "会员可回答问题" ON answers 
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());

CREATE POLICY "回答者可更新自己的回答" ON answers 
  FOR UPDATE TO authenticated USING (author_id = auth.uid());

CREATE POLICY "管理员和编辑可管理所有回答" ON answers 
  FOR ALL TO authenticated USING (is_editor_or_admin(auth.uid()));

-- site_settings table policies
CREATE POLICY "所有人可查看网站设置" ON site_settings FOR SELECT USING (true);
CREATE POLICY "管理员可管理网站设置" ON site_settings FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- analytics table policies
CREATE POLICY "所有人可写入访问统计" ON analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "管理员可查看访问统计" ON analytics FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- Create trigger function: auto update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON answers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create trigger: first user becomes admin automatically
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
BEGIN
  -- 只在用户经过验证后再插入profiles
  IF OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL THEN
    -- 判断 profiles 表里有多少用户
    SELECT COUNT(*) INTO user_count FROM profiles;
    -- 插入 profiles，首位用户给 admin 角色
    INSERT INTO profiles (id, username, email, phone, role)
    VALUES (
      NEW.id,
      COALESCE(SPLIT_PART(NEW.email, '@', 1), ''),
      NEW.email,
      NEW.phone,
      CASE WHEN user_count = 0 THEN 'admin'::user_role ELSE 'member'::user_role END
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('app-7fshtpomqha9_cms_images', 'app-7fshtpomqha9_cms_images', true, 1048576, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']),
  ('app-7fshtpomqha9_cms_videos', 'app-7fshtpomqha9_cms_videos', true, 52428800, ARRAY['video/mp4', 'video/webm', 'video/ogg']),
  ('app-7fshtpomqha9_cms_audios', 'app-7fshtpomqha9_cms_audios', true, 10485760, ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg'])
ON CONFLICT (id) DO NOTHING;

-- Storage bucket policy: public read
CREATE POLICY "所有人可查看图片" ON storage.objects FOR SELECT USING (bucket_id = 'app-7fshtpomqha9_cms_images');
CREATE POLICY "所有人可查看视频" ON storage.objects FOR SELECT USING (bucket_id = 'app-7fshtpomqha9_cms_videos');
CREATE POLICY "所有人可查看音频" ON storage.objects FOR SELECT USING (bucket_id = 'app-7fshtpomqha9_cms_audios');

-- Storage bucket policy: admins and editors can upload
CREATE POLICY "管理员和编辑可上传图片" ON storage.objects 
  FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'app-7fshtpomqha9_cms_images' AND is_editor_or_admin(auth.uid()));

CREATE POLICY "管理员和编辑可上传视频" ON storage.objects 
  FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'app-7fshtpomqha9_cms_videos' AND is_editor_or_admin(auth.uid()));

CREATE POLICY "管理员和编辑可上传音频" ON storage.objects 
  FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'app-7fshtpomqha9_cms_audios' AND is_editor_or_admin(auth.uid()));

-- 存储桶策略: 管理员可删除
CREATE POLICY "管理员可删除图片" ON storage.objects 
  FOR DELETE TO authenticated 
  USING (bucket_id = 'app-7fshtpomqha9_cms_images' AND is_admin(auth.uid()));

CREATE POLICY "管理员可删除视频" ON storage.objects 
  FOR DELETE TO authenticated 
  USING (bucket_id = 'app-7fshtpomqha9_cms_videos' AND is_admin(auth.uid()));

CREATE POLICY "管理员可删除音频" ON storage.objects 
  FOR DELETE TO authenticated 
  USING (bucket_id = 'app-7fshtpomqha9_cms_audios' AND is_admin(auth.uid()));

-- 插入默认网站设置
INSERT INTO site_settings (key, value, description) VALUES
  ('site_name', 'CMS内容管理系统', '网站名称'),
  ('site_description', '基于现代技术栈的内容管理系统', '网站描述'),
  ('site_keywords', 'CMS,内容管理,产品展示,问答系统', '网站关键词'),
  ('seo_title', 'CMS内容管理系统 - 专业的内容管理平台', 'SEO标题'),
  ('contact_email', 'contact@cms.com', '联系邮箱')
ON CONFLICT (key) DO NOTHING;

-- 插入默认分类
INSERT INTO categories (name, slug, type, description) VALUES
  ('技术文章', 'tech', 'article', '技术相关的文章'),
  ('产品动态', 'product-news', 'article', '产品相关的动态'),
  ('企业服务', 'enterprise', 'product', '企业级服务产品'),
  ('个人工具', 'personal', 'product', '个人使用的工具产品'),
  ('技术问答', 'tech-qa', 'question', '技术相关的问答'),
  ('产品咨询', 'product-qa', 'question', '产品相关的咨询')
ON CONFLICT (slug) DO NOTHING;
