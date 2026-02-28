#!/bin/bash

# ============================================
# Docker 容器运行脚本
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
CONTAINER_NAME="ifixes-cms-frontend"
PORT="${1:-80}"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  iFixes CMS Docker 容器运行${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker 未安装${NC}"
    exit 1
fi

# 检查镜像是否存在
if ! docker images "${IMAGE_NAME}" | grep -q "${IMAGE_NAME}"; then
    echo -e "${RED}错误: 镜像 ${IMAGE_NAME} 不存在${NC}"
    echo -e "${YELLOW}请先运行构建脚本: ./docker-build.sh${NC}"
    exit 1
fi

# 检查容器是否已经运行
if docker ps | grep -q "${CONTAINER_NAME}"; then
    echo -e "${YELLOW}容器 ${CONTAINER_NAME} 已经在运行${NC}"
    read -p "是否重启容器？(y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}停止并删除旧容器...${NC}"
        docker stop "${CONTAINER_NAME}"
        docker rm "${CONTAINER_NAME}"
    else
        echo -e "${GREEN}保持当前容器运行${NC}"
        exit 0
    fi
fi

# 检查端口是否被占用
if lsof -Pi :${PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}错误: 端口 ${PORT} 已被占用${NC}"
    echo -e "${YELLOW}请使用其他端口或停止占用该端口的进程${NC}"
    exit 1
fi

# 加载环境变量
if [ -f .env ]; then
    echo -e "${GREEN}加载环境变量...${NC}"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${YELLOW}警告: .env 文件不存在，使用默认配置${NC}"
fi

# 运行容器
echo -e "${BLUE}启动容器...${NC}"
docker run -d \
    --name "${CONTAINER_NAME}" \
    --restart unless-stopped \
    -p ${PORT}:80 \
    -e NODE_ENV=production \
    -e VITE_APP_ID="${VITE_APP_ID:-app-7fshtpomqha9}" \
    -e VITE_SUPABASE_URL="${VITE_SUPABASE_URL}" \
    -e VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY}" \
    "${IMAGE_NAME}:latest"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 容器启动成功！${NC}"
    echo ""
    
    # 等待容器启动
    echo -e "${BLUE}等待容器就绪...${NC}"
    sleep 3
    
    # 检查容器状态
    if docker ps | grep -q "${CONTAINER_NAME}"; then
        echo -e "${GREEN}✓ 容器运行正常${NC}"
        echo ""
        
        # 显示容器信息
        echo -e "${BLUE}容器信息：${NC}"
        docker ps | grep "${CONTAINER_NAME}"
        echo ""
        
        # 显示访问地址
        echo -e "${GREEN}============================================${NC}"
        echo -e "${GREEN}  应用已启动！${NC}"
        echo -e "${GREEN}============================================${NC}"
        echo ""
        echo -e "${YELLOW}访问地址：${NC}"
        echo -e "  本地访问: ${BLUE}http://localhost:${PORT}${NC}"
        echo -e "  容器名称: ${BLUE}${CONTAINER_NAME}${NC}"
        echo ""
        echo -e "${YELLOW}常用命令：${NC}"
        echo -e "  查看日志: ${BLUE}docker logs -f ${CONTAINER_NAME}${NC}"
        echo -e "  停止容器: ${BLUE}docker stop ${CONTAINER_NAME}${NC}"
        echo -e "  重启容器: ${BLUE}docker restart ${CONTAINER_NAME}${NC}"
        echo -e "  删除容器: ${BLUE}docker rm -f ${CONTAINER_NAME}${NC}"
        echo -e "  进入容器: ${BLUE}docker exec -it ${CONTAINER_NAME} sh${NC}"
        echo ""
        
        # 健康检查
        echo -e "${BLUE}执行健康检查...${NC}"
        sleep 2
        if curl -f http://localhost:${PORT}/ > /dev/null 2>&1; then
            echo -e "${GREEN}✓ 健康检查通过${NC}"
        else
            echo -e "${YELLOW}⚠ 健康检查失败，请查看日志${NC}"
        fi
        
    else
        echo -e "${RED}✗ 容器启动失败${NC}"
        echo -e "${YELLOW}查看日志: docker logs ${CONTAINER_NAME}${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ 容器启动失败${NC}"
    exit 1
fi
