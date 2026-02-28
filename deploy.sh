#!/bin/bash

# CMS 内容管理系统 - 部署脚本
# 用途：自动化构建和部署流程

set -e  # 遇到错误立即退出

echo "========================================="
echo "  CMS 内容管理系统 - 自动部署脚本"
echo "========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Node.js
echo "检查 Node.js 环境..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未找到 Node.js，请先安装 Node.js 18+${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}错误: Node.js 版本过低，需要 18+，当前版本: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js 版本: $(node -v)${NC}"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}错误: 未找到 npm${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm 版本: $(npm -v)${NC}"
echo ""

# 检查环境变量文件
echo "检查环境配置..."
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}警告: 未找到 .env 文件${NC}"
    echo "请从 .env.example 复制并配置环境变量"
    read -p "是否现在创建 .env 文件? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp .env.example .env
        echo -e "${GREEN}✓ 已创建 .env 文件，请编辑并填写正确的配置${NC}"
        echo "按任意键继续..."
        read -n 1 -s
    else
        echo -e "${RED}部署已取消${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ 环境配置文件存在${NC}"
echo ""

# 清理旧的构建文件
echo "清理旧的构建文件..."
if [ -d "dist" ]; then
    rm -rf dist
    echo -e "${GREEN}✓ 已清理 dist 目录${NC}"
fi

if [ -d "node_modules" ]; then
    echo -e "${YELLOW}发现 node_modules 目录${NC}"
    read -p "是否重新安装依赖? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf node_modules
        echo -e "${GREEN}✓ 已清理 node_modules 目录${NC}"
    fi
fi

echo ""

# 安装依赖
echo "安装项目依赖..."
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 依赖安装成功${NC}"
else
    echo -e "${RED}错误: 依赖安装失败${NC}"
    exit 1
fi

echo ""

# 构建项目
echo "开始构建项目..."
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 项目构建成功${NC}"
else
    echo -e "${RED}错误: 项目构建失败${NC}"
    exit 1
fi

echo ""

# 检查构建结果
if [ ! -d "dist" ]; then
    echo -e "${RED}错误: 构建目录 dist 不存在${NC}"
    exit 1
fi

DIST_SIZE=$(du -sh dist | cut -f1)
echo -e "${GREEN}✓ 构建文件大小: $DIST_SIZE${NC}"
echo ""

# 部署选项
echo "========================================="
echo "  选择部署方式"
echo "========================================="
echo "1. 本地预览（推荐先测试）"
echo "2. 复制到指定目录"
echo "3. 使用 Docker 部署"
echo "4. 仅构建，不部署"
echo "5. 退出"
echo ""

read -p "请选择 (1-5): " -n 1 -r
echo
echo ""

case $REPLY in
    1)
        echo "启动本地预览服务器..."
        echo "访问地址: http://localhost:4173"
        echo "按 Ctrl+C 停止服务器"
        npm run preview
        ;;
    2)
        read -p "请输入目标目录路径: " TARGET_DIR
        if [ -z "$TARGET_DIR" ]; then
            echo -e "${RED}错误: 目标目录不能为空${NC}"
            exit 1
        fi
        
        # 创建目标目录（如果不存在）
        mkdir -p "$TARGET_DIR"
        
        # 复制文件
        echo "复制文件到 $TARGET_DIR ..."
        cp -r dist/* "$TARGET_DIR/"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ 文件复制成功${NC}"
            echo ""
            echo "部署完成！"
            echo "目标目录: $TARGET_DIR"
        else
            echo -e "${RED}错误: 文件复制失败${NC}"
            exit 1
        fi
        ;;
    3)
        echo "使用 Docker 部署..."
        
        # 检查 Docker
        if ! command -v docker &> /dev/null; then
            echo -e "${RED}错误: 未找到 Docker，请先安装 Docker${NC}"
            exit 1
        fi
        
        # 检查 Docker Compose
        if ! command -v docker-compose &> /dev/null; then
            echo -e "${RED}错误: 未找到 Docker Compose，请先安装 Docker Compose${NC}"
            exit 1
        fi
        
        echo "构建 Docker 镜像..."
        docker-compose build
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Docker 镜像构建成功${NC}"
            echo ""
            echo "启动容器..."
            docker-compose up -d
            
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✓ 容器启动成功${NC}"
                echo ""
                echo "========================================="
                echo "  部署完成！"
                echo "========================================="
                echo "访问地址: http://localhost:3000"
                echo ""
                echo "常用命令:"
                echo "  查看日志: docker-compose logs -f"
                echo "  停止服务: docker-compose down"
                echo "  重启服务: docker-compose restart"
            else
                echo -e "${RED}错误: 容器启动失败${NC}"
                exit 1
            fi
        else
            echo -e "${RED}错误: Docker 镜像构建失败${NC}"
            exit 1
        fi
        ;;
    4)
        echo -e "${GREEN}构建完成，dist 目录已准备就绪${NC}"
        echo "您可以手动将 dist 目录的内容部署到服务器"
        ;;
    5)
        echo "退出部署脚本"
        exit 0
        ;;
    *)
        echo -e "${RED}无效的选择${NC}"
        exit 1
        ;;
esac

echo ""
echo "========================================="
echo "  部署流程完成"
echo "========================================="
echo ""
echo "提示："
echo "1. 确保 Supabase 数据库已正确配置"
echo "2. 确保所有环境变量已正确设置"
echo "3. 首次部署需要创建管理员账号"
echo ""
echo "详细说明请参考: 部署说明.md"
echo ""
