#!/bin/bash

# ============================================
# Docker 镜像构建脚本
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
IMAGE_NAME="ifixes-cms"
IMAGE_TAG="${1:-latest}"
REGISTRY="${DOCKER_REGISTRY:-}"
FULL_IMAGE_NAME="${REGISTRY:+$REGISTRY/}${IMAGE_NAME}:${IMAGE_TAG}"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  iFixes CMS Docker 镜像构建${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# 显示构建信息
echo -e "${YELLOW}构建信息：${NC}"
echo -e "  镜像名称: ${GREEN}${IMAGE_NAME}${NC}"
echo -e "  镜像标签: ${GREEN}${IMAGE_TAG}${NC}"
echo -e "  完整名称: ${GREEN}${FULL_IMAGE_NAME}${NC}"
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker 未安装${NC}"
    exit 1
fi

# 检查 .env 文件
if [ ! -f .env ]; then
    echo -e "${YELLOW}警告: .env 文件不存在${NC}"
    echo -e "${YELLOW}将使用默认环境变量${NC}"
fi

# 清理旧的构建缓存（可选）
read -p "是否清理 Docker 构建缓存？(y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}清理 Docker 构建缓存...${NC}"
    docker builder prune -f
fi

# 构建镜像
echo -e "${BLUE}开始构建 Docker 镜像...${NC}"
docker build \
    --tag "${IMAGE_NAME}:${IMAGE_TAG}" \
    --tag "${IMAGE_NAME}:latest" \
    --file Dockerfile \
    --build-arg NODE_ENV=production \
    --progress=plain \
    .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker 镜像构建成功！${NC}"
    echo ""
    
    # 显示镜像信息
    echo -e "${BLUE}镜像信息：${NC}"
    docker images "${IMAGE_NAME}" | head -2
    echo ""
    
    # 显示镜像大小
    IMAGE_SIZE=$(docker images "${IMAGE_NAME}:${IMAGE_TAG}" --format "{{.Size}}")
    echo -e "${GREEN}镜像大小: ${IMAGE_SIZE}${NC}"
    echo ""
    
    # 询问是否推送到镜像仓库
    if [ -n "$REGISTRY" ]; then
        read -p "是否推送镜像到仓库 ${REGISTRY}？(y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}推送镜像到仓库...${NC}"
            docker tag "${IMAGE_NAME}:${IMAGE_TAG}" "${FULL_IMAGE_NAME}"
            docker push "${FULL_IMAGE_NAME}"
            
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✓ 镜像推送成功！${NC}"
            else
                echo -e "${RED}✗ 镜像推送失败${NC}"
                exit 1
            fi
        fi
    fi
    
    # 询问是否运行容器
    read -p "是否立即运行容器？(y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}启动容器...${NC}"
        docker-compose up -d
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ 容器启动成功！${NC}"
            echo -e "${GREEN}访问地址: http://localhost${NC}"
        else
            echo -e "${RED}✗ 容器启动失败${NC}"
            exit 1
        fi
    fi
    
    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}  构建完成！${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo -e "${YELLOW}使用说明：${NC}"
    echo -e "  运行容器: ${BLUE}docker-compose up -d${NC}"
    echo -e "  停止容器: ${BLUE}docker-compose down${NC}"
    echo -e "  查看日志: ${BLUE}docker-compose logs -f${NC}"
    echo -e "  查看状态: ${BLUE}docker-compose ps${NC}"
    echo ""
    
else
    echo -e "${RED}✗ Docker 镜像构建失败${NC}"
    exit 1
fi
