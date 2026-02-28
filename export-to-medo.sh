#!/bin/bash

# MeDo 平台导出脚本
echo "🚀 开始创建 MeDo 平台导出包..."

# 设置变量
PROJECT_DIR="."
EXPORT_DIR="medo-export-$(date +%Y%m%d-%H%M%S)"
EXPORT_FILE="ifixes-medo-$(date +%Y%m%d-%H%M%S)"

# 创建导出目录
echo "📁 创建导出目录..."
mkdir -p $EXPORT_DIR

# 复制源代码
echo "📦 复制源代码..."
cp -r src $EXPORT_DIR/
cp -r public $EXPORT_DIR/
cp -r supabase $EXPORT_DIR/

# 复制配置文件
echo "⚙️ 复制配置文件..."
cp package.json $EXPORT_DIR/
cp pnpm-lock.yaml $EXPORT_DIR/
cp vite.config.ts $EXPORT_DIR/
cp tsconfig*.json $EXPORT_DIR/
cp tailwind.config.mjs $EXPORT_DIR/
cp postcss.config.js $EXPORT_DIR/
cp index.html $EXPORT_DIR/
cp components.json $EXPORT_DIR/

# 复制部署配置
echo "🔧 复制部署配置..."
cp docker-compose.yml $EXPORT_DIR/ 2>/dev/null || true
cp Dockerfile $EXPORT_DIR/ 2>/dev/null || true
cp nginx.conf $EXPORT_DIR/ 2>/dev/null || true
cp vercel.json $EXPORT_DIR/ 2>/dev/null || true
cp netlify.toml $EXPORT_DIR/ 2>/dev/null || true

# 创建环境变量模板
echo "📝 创建环境变量模板..."
cat > $EXPORT_DIR/.env.example << 'ENVEOF'
# 应用配置
VITE_APP_ID=your-app-id

# Supabase 配置
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# API 配置
VITE_API_ENV=production

# 翻译服务配置（可选）
VITE_TRANSLATION_API_KEY=your-translation-api-key
ENVEOF

# 复制文档
echo "📚 复制文档..."
cp README.md $EXPORT_DIR/
cp 部署说明.md $EXPORT_DIR/ 2>/dev/null || true
cp 快速开始.md $EXPORT_DIR/ 2>/dev/null || true
cp 未备案域名绑定指南.md $EXPORT_DIR/ 2>/dev/null || true
cp 域名绑定实操指南.md $EXPORT_DIR/ 2>/dev/null || true
cp 一键部署指南.md $EXPORT_DIR/ 2>/dev/null || true

# 创建 MeDo 部署说明
echo "📖 创建 MeDo 部署说明..."
cat > $EXPORT_DIR/MEDO_DEPLOYMENT.md << 'DOCEOF'
# MeDo 平台部署指南

## 快速开始

### 1. 上传到 MeDo 平台
- 将此压缩包上传到 MeDo 平台
- 或连接 Git 仓库导入

### 2. 配置环境变量
```
VITE_APP_ID=your-app-id
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_ENV=production
```

### 3. 构建设置
```
构建命令: pnpm install && pnpm build
输出目录: dist
Node.js 版本: 18.x
包管理器: pnpm
```

### 4. 部署
点击部署按钮，等待构建完成。

## 详细说明
请参考 部署说明.md 和 快速开始.md

## 环境变量说明

### VITE_APP_ID
应用唯一标识符，用于区分不同的应用实例。

### VITE_SUPABASE_URL
Supabase 项目的 API URL，格式：https://xxx.supabase.co

### VITE_SUPABASE_ANON_KEY
Supabase 项目的匿名密钥，用于客户端访问。

### VITE_API_ENV
运行环境：development（开发）、staging（测试）、production（生产）

## 故障排查

### 构建失败
- 检查 Node.js 版本是否 >= 18.x
- 检查环境变量是否完整
- 查看构建日志

### 页面空白
- 检查浏览器控制台错误
- 验证 Supabase 连接
- 检查环境变量配置

### 数据库连接失败
- 验证 VITE_SUPABASE_URL 是否正确
- 验证 VITE_SUPABASE_ANON_KEY 是否正确
- 检查 Supabase 项目状态

## 技术支持
- 查看项目文档
- 访问 MeDo 平台帮助中心
- 联系技术支持团队
DOCEOF

# 创建 README
echo "📄 创建 README..."
cat > $EXPORT_DIR/README_MEDO.md << 'READMEEOF'
# iFixes - MeDo 平台部署包

## 应用信息
- **应用名称**: iFixes
- **应用描述**: Global leading mobile phone repair resource integration service provider
- **技术栈**: React + TypeScript + Supabase
- **版本**: v193

## 包含内容
- ✅ 完整源代码
- ✅ 配置文件
- ✅ 数据库迁移文件
- ✅ 部署文档
- ✅ 环境变量模板

## 技术栈
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Supabase

## 部署要求
- Node.js >= 18.x
- pnpm 包管理器
- Supabase 账号

## 快速部署
1. 上传到 MeDo 平台
2. 配置环境变量
3. 设置构建命令：`pnpm install && pnpm build`
4. 设置输出目录：`dist`
5. 点击部署

## 详细说明
请查看 MEDO_DEPLOYMENT.md 获取完整部署指南。

## 功能特性
- ✅ 用户认证系统
- ✅ 内容管理系统
- ✅ 产品展示系统
- ✅ 问答社区
- ✅ 会员中心
- ✅ 文章发布
- ✅ 图片上传
- ✅ SEO 优化
- ✅ 响应式设计
- ✅ 多语言支持

## 技术支持
如有问题，请查看项目文档或联系技术支持。
READMEEOF

# 创建部署检查清单
echo "✅ 创建部署检查清单..."
cat > $EXPORT_DIR/DEPLOYMENT_CHECKLIST.md << 'CHECKEOF'
# MeDo 平台部署检查清单

## 部署前检查
- [ ] 已准备 Supabase 项目
- [ ] 已获取 Supabase URL 和 Key
- [ ] 已准备应用 ID
- [ ] 已阅读部署文档

## 上传检查
- [ ] 代码已上传到 MeDo 平台
- [ ] 文件结构完整
- [ ] package.json 存在
- [ ] src 目录存在
- [ ] public 目录存在

## 配置检查
- [ ] 环境变量已配置
  - [ ] VITE_APP_ID
  - [ ] VITE_SUPABASE_URL
  - [ ] VITE_SUPABASE_ANON_KEY
  - [ ] VITE_API_ENV
- [ ] 构建命令已设置：`pnpm install && pnpm build`
- [ ] 输出目录已设置：`dist`
- [ ] Node.js 版本已选择：18.x

## 构建检查
- [ ] 构建成功
- [ ] 无错误信息
- [ ] dist 目录已生成
- [ ] 构建时间合理（3-5分钟）

## 部署检查
- [ ] 应用可以访问
- [ ] 首页正常显示
- [ ] 登录功能正常
- [ ] 注册功能正常
- [ ] 数据库连接正常
- [ ] 图片上传正常
- [ ] 文章发布正常
- [ ] 问答功能正常

## 性能检查
- [ ] 页面加载速度正常
- [ ] 图片加载正常
- [ ] API 响应速度正常
- [ ] 无明显卡顿

## 安全检查
- [ ] HTTPS 已启用
- [ ] 环境变量未泄露
- [ ] API 密钥安全
- [ ] 数据库权限正确

## 域名检查（可选）
- [ ] 自定义域名已添加
- [ ] DNS 记录已配置
- [ ] SSL 证书已生效
- [ ] 域名可以访问
- [ ] HTTPS 重定向正常

## 监控检查（可选）
- [ ] 错误追踪已配置
- [ ] 性能监控已启用
- [ ] 访问统计已设置
- [ ] 告警通知已配置

## 备份检查
- [ ] 数据库自动备份已启用
- [ ] 代码已推送到 Git
- [ ] 环境变量已备份
- [ ] 配置文件已保存

## 文档检查
- [ ] 部署文档已阅读
- [ ] 操作手册已准备
- [ ] 故障排查指南已了解
- [ ] 联系方式已记录
CHECKEOF

# 创建快速参考
echo "📖 创建快速参考..."
cat > $EXPORT_DIR/QUICK_REFERENCE.md << 'REFEOF'
# 快速参考

## 构建命令
```bash
pnpm install && pnpm build
```

## 输出目录
```
dist
```

## Node.js 版本
```
18.x
```

## 环境变量
```bash
VITE_APP_ID=your-app-id
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_ENV=production
```

## 本地开发
```bash
pnpm install
pnpm dev
```

## 本地构建测试
```bash
pnpm build
pnpm preview
```

## 常用命令
```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview

# 代码检查
pnpm lint

# 类型检查
pnpm type-check
```

## 目录结构
```
.
├── src/              # 源代码
├── public/           # 静态资源
├── supabase/         # 数据库迁移
├── package.json      # 依赖配置
├── vite.config.ts    # Vite 配置
└── tsconfig.json     # TypeScript 配置
```

## 重要文件
- `src/main.tsx` - 应用入口
- `src/App.tsx` - 主组件
- `src/routes.tsx` - 路由配置
- `src/db/supabase.ts` - 数据库配置
- `.env` - 环境变量（不要提交到 Git）

## 故障排查
1. 构建失败 → 检查 Node.js 版本和环境变量
2. 页面空白 → 检查浏览器控制台和环境变量
3. 数据库错误 → 检查 Supabase 配置
4. 图片无法显示 → 检查 Storage 权限

## 获取帮助
- 查看 MEDO_DEPLOYMENT.md
- 查看 部署说明.md
- 访问 MeDo 平台帮助中心
REFEOF

# 打包
echo "📦 打包导出文件..."
tar -czf ${EXPORT_FILE}.tar.gz $EXPORT_DIR/
zip -r ${EXPORT_FILE}.zip $EXPORT_DIR/ >/dev/null 2>&1

# 获取文件大小
TAR_SIZE=$(du -h ${EXPORT_FILE}.tar.gz | cut -f1)
ZIP_SIZE=$(du -h ${EXPORT_FILE}.zip | cut -f1)

# 清理临时目录
rm -rf $EXPORT_DIR

echo ""
echo "✅ MeDo 平台导出包创建完成！"
echo ""
echo "📦 导出文件:"
echo "   - ${EXPORT_FILE}.tar.gz (${TAR_SIZE})"
echo "   - ${EXPORT_FILE}.zip (${ZIP_SIZE})"
echo ""
echo "📋 包含内容:"
echo "   ✅ 完整源代码 (src/)"
echo "   ✅ 静态资源 (public/)"
echo "   ✅ 数据库迁移 (supabase/)"
echo "   ✅ 配置文件 (package.json, vite.config.ts, etc.)"
echo "   ✅ 部署文档 (MEDO_DEPLOYMENT.md)"
echo "   ✅ 环境变量模板 (.env.example)"
echo "   ✅ 部署检查清单 (DEPLOYMENT_CHECKLIST.md)"
echo "   ✅ 快速参考 (QUICK_REFERENCE.md)"
echo ""
echo "🚀 下一步:"
echo "   1. 将压缩包上传到 MeDo 平台"
echo "   2. 配置环境变量（参考 .env.example）"
echo "   3. 设置构建命令: pnpm install && pnpm build"
echo "   4. 设置输出目录: dist"
echo "   5. 选择 Node.js 版本: 18.x"
echo "   6. 点击部署"
echo ""
echo "📖 详细说明请查看压缩包中的 MEDO_DEPLOYMENT.md"
echo ""
echo "💡 提示:"
echo "   - 确保已准备好 Supabase 项目"
echo "   - 记得配置所有必需的环境变量"
echo "   - 部署前先阅读 DEPLOYMENT_CHECKLIST.md"
