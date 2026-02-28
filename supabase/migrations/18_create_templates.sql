/*
# 创建模版管理表

## 1. 新建表
- `templates`
  - `id` (uuid, 主键)
  - `name` (text, 模版名称, 必填)
  - `description` (text, 模版描述)
  - `file_path` (text, 文件路径, 必填, 唯一)
  - `content` (text, 模版源码内容, 必填)
  - `file_type` (text, 文件类型: tsx, css, json等)
  - `category` (text, 分类: page, component, style, config)
  - `is_active` (boolean, 是否启用, 默认true)
  - `created_at` (timestamptz, 创建时间)
  - `updated_at` (timestamptz, 更新时间)

## 2. 安全策略
- 不启用RLS，因为只有管理员通过后台访问
- 所有操作都在管理后台进行，由前端权限控制

## 3. 初始数据
- 添加一些默认模版文件供管理
*/

-- 创建模版表
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  file_path text NOT NULL UNIQUE,
  content text NOT NULL,
  file_type text NOT NULL DEFAULT 'tsx',
  category text NOT NULL DEFAULT 'page',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_is_active ON templates(is_active);
CREATE INDEX idx_templates_file_type ON templates(file_type);

-- 插入默认模版数据
INSERT INTO templates (name, description, file_path, content, file_type, category) VALUES
(
  '首页Banner模版',
  '首页顶部Banner区域的展示模版',
  'src/components/templates/HomeBanner.tsx',
  E'import { Link } from "react-router-dom";\nimport { Button } from "@/components/ui/button";\nimport { FileText, Package } from "lucide-react";\n\ninterface HomeBannerProps {\n  siteName: string;\n}\n\nexport default function HomeBanner({ siteName }: HomeBannerProps) {\n  return (\n    <section className="relative py-20 xl:py-32 px-4 overflow-hidden">\n      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background"></div>\n      <div className="container mx-auto relative z-10">\n        <div className="max-w-4xl mx-auto text-center space-y-6">\n          <h1 className="text-4xl xl:text-6xl font-bold tracking-tight">\n            <span className="gradient-text">{siteName}</span>\n          </h1>\n          <p className="text-xl xl:text-2xl text-muted-foreground">\n            专业的内容管理平台,集成文章发布、产品展示、问答系统等功能\n          </p>\n          <div className="flex flex-wrap gap-4 justify-center pt-4">\n            <Button size="lg" asChild>\n              <Link to="/articles">\n                <FileText className="mr-2 h-5 w-5" />\n                浏览文章\n              </Link>\n            </Button>\n            <Button size="lg" variant="outline" asChild>\n              <Link to="/products">\n                <Package className="mr-2 h-5 w-5" />\n                查看产品\n              </Link>\n            </Button>\n          </div>\n        </div>\n      </div>\n    </section>\n  );\n}',
  'tsx',
  'component'
),
(
  '文章卡片模版',
  '文章列表展示卡片组件模版',
  'src/components/templates/ArticleCard.tsx',
  E'import { Link } from "react-router-dom";\nimport { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";\nimport { Badge } from "@/components/ui/badge";\nimport { Calendar, User } from "lucide-react";\nimport type { ArticleWithAuthor } from "@/types";\n\ninterface ArticleCardProps {\n  article: ArticleWithAuthor;\n}\n\nexport default function ArticleCard({ article }: ArticleCardProps) {\n  return (\n    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">\n      <CardHeader>\n        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">\n          <Calendar className="h-4 w-4" />\n          <span>{new Date(article.created_at).toLocaleDateString()}</span>\n          <User className="h-4 w-4 ml-2" />\n          <span>{article.author?.username || "匿名"}</span>\n        </div>\n        <CardTitle className="line-clamp-2">\n          <Link to={`/articles/${article.id}`} className="hover:text-primary transition-colors">\n            {article.title}\n          </Link>\n        </CardTitle>\n      </CardHeader>\n      <CardContent className="flex-1 flex flex-col">\n        <CardDescription className="line-clamp-3 flex-1">\n          {article.summary || article.content.substring(0, 150)}\n        </CardDescription>\n        {article.category && (\n          <div className="mt-4">\n            <Badge variant="secondary">{article.category.name}</Badge>\n          </div>\n        )}\n      </CardContent>\n    </Card>\n  );\n}',
  'tsx',
  'component'
),
(
  '产品卡片模版',
  '产品列表展示卡片组件模版',
  'src/components/templates/ProductCard.tsx',
  E'import { Link } from "react-router-dom";\nimport { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";\nimport { Badge } from "@/components/ui/badge";\nimport type { ProductWithImages } from "@/types";\n\ninterface ProductCardProps {\n  product: ProductWithImages;\n}\n\nexport default function ProductCard({ product }: ProductCardProps) {\n  const mainImage = product.images?.[0]?.image_url;\n  \n  return (\n    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col overflow-hidden">\n      {mainImage && (\n        <div className="aspect-video w-full overflow-hidden bg-muted">\n          <img\n            src={mainImage}\n            alt={product.name}\n            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"\n          />\n        </div>\n      )}\n      <CardHeader>\n        <CardTitle className="line-clamp-2">\n          <Link to={`/products/${product.id}`} className="hover:text-primary transition-colors">\n            {product.name}\n          </Link>\n        </CardTitle>\n      </CardHeader>\n      <CardContent className="flex-1 flex flex-col">\n        <CardDescription className="line-clamp-3 flex-1">\n          {product.description}\n        </CardDescription>\n        <div className="mt-4 flex items-center justify-between">\n          {product.price && (\n            <span className="text-2xl font-bold text-primary">\n              ¥{product.price}\n            </span>\n          )}\n          {product.category && (\n            <Badge variant="secondary">{product.category.name}</Badge>\n          )}\n        </div>\n      </CardContent>\n    </Card>\n  );\n}',
  'tsx',
  'component'
),
(
  '自定义样式模版',
  '自定义CSS样式定义',
  'src/styles/custom.css',
  E'/* 自定义样式模版 */\n\n/* 渐变文字效果 */\n.gradient-text {\n  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)));\n  -webkit-background-clip: text;\n  background-clip: text;\n  -webkit-text-fill-color: transparent;\n  color: transparent;\n}\n\n/* 卡片悬停效果 */\n.card-hover {\n  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n}\n\n.card-hover:hover {\n  transform: translateY(-4px);\n  box-shadow: 0 10px 30px -10px hsl(var(--primary) / 0.3);\n}\n\n/* 按钮发光效果 */\n.button-glow {\n  box-shadow: 0 0 20px hsl(var(--primary) / 0.5);\n}\n\n/* 动画效果 */\n@keyframes fadeIn {\n  from {\n    opacity: 0;\n    transform: translateY(20px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n\n.animate-fade-in {\n  animation: fadeIn 0.6s ease-out;\n}',
  'css',
  'style'
);
