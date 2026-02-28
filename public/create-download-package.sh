#!/bin/bash

# 翊鸢化工静态页面打包脚本

echo "🎉 开始创建翊鸢化工静态页面下载包..."

# 创建临时目录
TEMP_DIR="yiyuan-static-package"
mkdir -p "$TEMP_DIR"

# 复制文件
echo "📦 复制文件..."
cp yiyuan-static.html "$TEMP_DIR/"
cp README_YIYUAN_STATIC.md "$TEMP_DIR/README.md"

# 创建使用说明
cat > "$TEMP_DIR/使用说明.txt" << 'USAGE'
翊鸢化工静态页面使用说明
================================

📋 文件列表：
- yiyuan-static.html - 翊鸢化工静态页面（主文件）
- README.md - 详细使用说明文档
- 使用说明.txt - 本文件

🚀 快速开始：
1. 双击打开 yiyuan-static.html 文件
2. 使用浏览器查看页面
3. 点击右上角的语言选择器切换语言

✨ 功能特性：
- 支持25种国际语言
- 完整的产品信息展示
- 防伪验证指南
- 响应式设计，支持手机和电脑

📱 浏览器要求：
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

📞 技术支持：
- 邮箱：dps@ifixes.com.cn
- 网站：www.ifixes.com.cn

© 2026 翊鸢化工 | Yiyuan Chemical
USAGE

# 创建压缩包
echo "🗜️  创建压缩包..."
zip -r yiyuan-static-package.zip "$TEMP_DIR"

# 清理临时目录
echo "🧹 清理临时文件..."
rm -rf "$TEMP_DIR"

echo "✅ 完成！下载包已创建：yiyuan-static-package.zip"
echo ""
echo "📦 包含文件："
echo "  - yiyuan-static.html"
echo "  - README.md"
echo "  - 使用说明.txt"
echo ""
echo "📊 文件大小："
ls -lh yiyuan-static-package.zip | awk '{print "  " $5}'
echo ""
echo "🎉 您可以将此压缩包分享给用户！"
