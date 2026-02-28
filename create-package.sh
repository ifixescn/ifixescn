#!/bin/bash

# CMS 内容管理系统 - 打包脚本
# 用途：创建可分发的部署包

set -e

echo "========================================="
echo "  CMS 内容管理系统 - 打包脚本"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 包名和版本
PACKAGE_NAME="cms-content-management"
VERSION="1.0.0"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE_DIR="${PACKAGE_NAME}_${VERSION}_${TIMESTAMP}"
PACKAGE_FILE="${PACKAGE_DIR}.tar.gz"

echo "包名称: $PACKAGE_NAME"
echo "版本: $VERSION"
echo "时间戳: $TIMESTAMP"
echo ""

# 创建临时目录
echo "创建打包目录..."
mkdir -p "$PACKAGE_DIR"

# 复制必要文件
echo "复制项目文件..."

# 源代码
cp -r src "$PACKAGE_DIR/"
cp -r public "$PACKAGE_DIR/"

# 配置文件
cp package.json "$PACKAGE_DIR/"
cp package-lock.json "$PACKAGE_DIR/" 2>/dev/null || true
cp tsconfig.json "$PACKAGE_DIR/"
cp tsconfig.check.json "$PACKAGE_DIR/"
cp vite.config.ts "$PACKAGE_DIR/"
cp tailwind.config.ts "$PACKAGE_DIR/"
cp postcss.config.js "$PACKAGE_DIR/"
cp components.json "$PACKAGE_DIR/"
cp index.html "$PACKAGE_DIR/"

# 部署相关文件
cp .env.example "$PACKAGE_DIR/"
cp Dockerfile "$PACKAGE_DIR/"
cp docker-compose.yml "$PACKAGE_DIR/"
cp nginx.conf "$PACKAGE_DIR/"
cp deploy.sh "$PACKAGE_DIR/"
chmod +x "$PACKAGE_DIR/deploy.sh"

# 数据库迁移文件
if [ -d "supabase" ]; then
    cp -r supabase "$PACKAGE_DIR/"
fi

# 文档
cp 部署说明.md "$PACKAGE_DIR/"
cp README.md "$PACKAGE_DIR/" 2>/dev/null || true

# 创建安装说明
cat > "$PACKAGE_DIR/安装说明.txt" << 'EOF'
========================================
  CMS 内容管理系统 - 安装说明
========================================

一、系统要求
-----------
1. Node.js 18+ 
2. npm 或 yarn
3. Supabase 账号（免费）

二、快速安装步骤
--------------
1. 解压此压缩包到目标目录

2. 配置环境变量
   - 复制 .env.example 为 .env
   - 填写 Supabase 凭证（见下文）

3. 运行部署脚本
   chmod +x deploy.sh
   ./deploy.sh

4. 按照提示选择部署方式

三、获取 Supabase 凭证
--------------------
1. 访问 https://supabase.com
2. 创建新项目（或使用现有项目）
3. 在项目设置中获取：
   - Project URL (VITE_SUPABASE_URL)
   - Anon Key (VITE_SUPABASE_ANON_KEY)

4. 在 SQL Editor 中执行 supabase/migrations/ 目录下的所有 SQL 文件

四、部署方式
-----------
方式 1: 本地开发测试
   npm install
   npm run dev

方式 2: 生产构建
   npm install
   npm run build
   # 将 dist 目录部署到 Web 服务器

方式 3: Docker 部署
   docker-compose up -d

方式 4: 使用部署脚本（推荐）
   ./deploy.sh

五、详细文档
-----------
请查看 部署说明.md 文件获取完整的部署指南

六、技术支持
-----------
如有问题，请参考：
- Supabase 文档: https://supabase.com/docs
- React 文档: https://react.dev
- Vite 文档: https://vitejs.dev

========================================
版本: 1.0.0
更新日期: 2025-11-15
========================================
EOF

echo -e "${GREEN}✓ 文件复制完成${NC}"
echo ""

# 创建 .gitignore（避免打包不必要的文件）
cat > "$PACKAGE_DIR/.gitignore" << 'EOF'
# 依赖
node_modules/
.pnp
.pnp.js

# 构建输出
dist/
build/

# 环境变量
.env
.env.local
.env.production

# 日志
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 编辑器
.vscode/
.idea/
*.swp
*.swo
*~

# 操作系统
.DS_Store
Thumbs.db

# 临时文件
*.tmp
*.temp
EOF

# 创建 README
cat > "$PACKAGE_DIR/README.md" << 'EOF'
# CMS 内容管理系统

## 简介

基于 React + TypeScript + Supabase 开发的现代化内容管理系统。

## 特性

- ✅ 文章管理
- ✅ 产品展示
- ✅ 问答系统
- ✅ 下载中心
- ✅ 视频管理
- ✅ 用户权限管理
- ✅ 数据分析看板
- ✅ SEO 优化
- ✅ 响应式设计

## 技术栈

- **前端**: React 18 + TypeScript
- **构建工具**: Vite
- **UI 框架**: Tailwind CSS + shadcn/ui
- **后端服务**: Supabase
- **路由**: React Router
- **表单**: React Hook Form + Zod
- **富文本编辑器**: Quill

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_ID=your_app_id
```

### 3. 初始化数据库

在 Supabase SQL Editor 中执行 `supabase/migrations/` 目录下的所有 SQL 文件。

### 4. 启动开发服务器

```bash
npm run dev
```

### 5. 构建生产版本

```bash
npm run build
```

## 部署

详细部署说明请查看 `部署说明.md` 文件。

### 快速部署

使用提供的部署脚本：

```bash
chmod +x deploy.sh
./deploy.sh
```

### Docker 部署

```bash
docker-compose up -d
```

## 文档

- [部署说明](./部署说明.md) - 完整的部署指南
- [安装说明](./安装说明.txt) - 快速安装步骤

## 许可证

MIT License

## 版本

1.0.0 (2025-11-15)
EOF

echo "创建压缩包..."
tar -czf "$PACKAGE_FILE" "$PACKAGE_DIR"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 压缩包创建成功${NC}"
    
    # 获取文件大小
    PACKAGE_SIZE=$(du -sh "$PACKAGE_FILE" | cut -f1)
    
    echo ""
    echo "========================================="
    echo "  打包完成！"
    echo "========================================="
    echo "包文件: $PACKAGE_FILE"
    echo "文件大小: $PACKAGE_SIZE"
    echo ""
    echo "包含内容:"
    echo "  - 完整源代码"
    echo "  - 部署脚本"
    echo "  - Docker 配置"
    echo "  - 数据库迁移文件"
    echo "  - 安装和部署文档"
    echo ""
    echo "使用方法:"
    echo "  1. 将 $PACKAGE_FILE 上传到目标服务器"
    echo "  2. 解压: tar -xzf $PACKAGE_FILE"
    echo "  3. 进入目录: cd $PACKAGE_DIR"
    echo "  4. 查看 安装说明.txt"
    echo "  5. 运行 ./deploy.sh"
    echo ""
else
    echo -e "${RED}错误: 压缩包创建失败${NC}"
    exit 1
fi

# 清理临时目录
echo "清理临时文件..."
rm -rf "$PACKAGE_DIR"
echo -e "${GREEN}✓ 清理完成${NC}"

echo ""
echo "========================================="
echo "  打包流程完成"
echo "========================================="
echo ""
