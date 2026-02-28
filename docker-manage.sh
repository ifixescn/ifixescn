#!/bin/bash

# ============================================
# Docker 容器管理脚本
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
CONTAINER_NAME="ifixes-cms-frontend"
IMAGE_NAME="ifixes-cms"

# 显示帮助信息
show_help() {
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}  iFixes CMS Docker 管理工具${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo ""
    echo -e "${YELLOW}使用方法：${NC}"
    echo -e "  $0 [命令]"
    echo ""
    echo -e "${YELLOW}可用命令：${NC}"
    echo -e "  ${GREEN}start${NC}      - 启动容器"
    echo -e "  ${GREEN}stop${NC}       - 停止容器"
    echo -e "  ${GREEN}restart${NC}    - 重启容器"
    echo -e "  ${GREEN}status${NC}     - 查看容器状态"
    echo -e "  ${GREEN}logs${NC}       - 查看容器日志"
    echo -e "  ${GREEN}shell${NC}      - 进入容器 Shell"
    echo -e "  ${GREEN}health${NC}     - 健康检查"
    echo -e "  ${GREEN}clean${NC}      - 清理容器和镜像"
    echo -e "  ${GREEN}rebuild${NC}    - 重新构建并启动"
    echo -e "  ${GREEN}help${NC}       - 显示帮助信息"
    echo ""
}

# 启动容器
start_container() {
    echo -e "${BLUE}启动容器...${NC}"
    if docker ps -a | grep -q "${CONTAINER_NAME}"; then
        docker start "${CONTAINER_NAME}"
        echo -e "${GREEN}✓ 容器已启动${NC}"
    else
        echo -e "${YELLOW}容器不存在，使用 docker-compose 启动...${NC}"
        docker-compose up -d
        echo -e "${GREEN}✓ 容器已创建并启动${NC}"
    fi
}

# 停止容器
stop_container() {
    echo -e "${BLUE}停止容器...${NC}"
    if docker ps | grep -q "${CONTAINER_NAME}"; then
        docker stop "${CONTAINER_NAME}"
        echo -e "${GREEN}✓ 容器已停止${NC}"
    else
        echo -e "${YELLOW}容器未运行${NC}"
    fi
}

# 重启容器
restart_container() {
    echo -e "${BLUE}重启容器...${NC}"
    if docker ps -a | grep -q "${CONTAINER_NAME}"; then
        docker restart "${CONTAINER_NAME}"
        echo -e "${GREEN}✓ 容器已重启${NC}"
    else
        echo -e "${YELLOW}容器不存在${NC}"
        start_container
    fi
}

# 查看容器状态
show_status() {
    echo -e "${BLUE}容器状态：${NC}"
    echo ""
    if docker ps -a | grep -q "${CONTAINER_NAME}"; then
        docker ps -a | grep "${CONTAINER_NAME}"
        echo ""
        echo -e "${BLUE}容器详细信息：${NC}"
        docker inspect "${CONTAINER_NAME}" --format='
容器 ID: {{.Id}}
状态: {{.State.Status}}
启动时间: {{.State.StartedAt}}
重启次数: {{.RestartCount}}
IP 地址: {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}
端口映射: {{range $p, $conf := .NetworkSettings.Ports}}{{$p}} -> {{(index $conf 0).HostPort}} {{end}}
'
    else
        echo -e "${YELLOW}容器不存在${NC}"
    fi
}

# 查看容器日志
show_logs() {
    echo -e "${BLUE}容器日志：${NC}"
    if docker ps -a | grep -q "${CONTAINER_NAME}"; then
        docker logs -f --tail=100 "${CONTAINER_NAME}"
    else
        echo -e "${YELLOW}容器不存在${NC}"
    fi
}

# 进入容器 Shell
enter_shell() {
    echo -e "${BLUE}进入容器 Shell...${NC}"
    if docker ps | grep -q "${CONTAINER_NAME}"; then
        docker exec -it "${CONTAINER_NAME}" sh
    else
        echo -e "${YELLOW}容器未运行${NC}"
    fi
}

# 健康检查
health_check() {
    echo -e "${BLUE}执行健康检查...${NC}"
    if docker ps | grep -q "${CONTAINER_NAME}"; then
        # 获取容器端口
        PORT=$(docker port "${CONTAINER_NAME}" 80 | cut -d':' -f2)
        
        # 检查 HTTP 响应
        if curl -f http://localhost:${PORT}/ > /dev/null 2>&1; then
            echo -e "${GREEN}✓ 健康检查通过${NC}"
            echo -e "${GREEN}应用正常运行在 http://localhost:${PORT}${NC}"
        else
            echo -e "${RED}✗ 健康检查失败${NC}"
            echo -e "${YELLOW}请查看日志: $0 logs${NC}"
        fi
        
        # 显示 Docker 健康状态
        HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "${CONTAINER_NAME}" 2>/dev/null || echo "no healthcheck")
        echo -e "${BLUE}Docker 健康状态: ${HEALTH}${NC}"
    else
        echo -e "${YELLOW}容器未运行${NC}"
    fi
}

# 清理容器和镜像
clean_all() {
    echo -e "${RED}警告: 此操作将删除容器和镜像${NC}"
    read -p "确认继续？(y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}清理容器...${NC}"
        if docker ps -a | grep -q "${CONTAINER_NAME}"; then
            docker rm -f "${CONTAINER_NAME}"
            echo -e "${GREEN}✓ 容器已删除${NC}"
        fi
        
        echo -e "${BLUE}清理镜像...${NC}"
        if docker images | grep -q "${IMAGE_NAME}"; then
            docker rmi -f $(docker images "${IMAGE_NAME}" -q)
            echo -e "${GREEN}✓ 镜像已删除${NC}"
        fi
        
        echo -e "${BLUE}清理未使用的资源...${NC}"
        docker system prune -f
        echo -e "${GREEN}✓ 清理完成${NC}"
    else
        echo -e "${YELLOW}已取消${NC}"
    fi
}

# 重新构建并启动
rebuild_all() {
    echo -e "${BLUE}重新构建并启动...${NC}"
    
    # 停止并删除容器
    if docker ps -a | grep -q "${CONTAINER_NAME}"; then
        echo -e "${BLUE}停止并删除旧容器...${NC}"
        docker rm -f "${CONTAINER_NAME}"
    fi
    
    # 重新构建
    echo -e "${BLUE}重新构建镜像...${NC}"
    ./docker-build.sh
    
    # 启动容器
    echo -e "${BLUE}启动新容器...${NC}"
    docker-compose up -d
    
    echo -e "${GREEN}✓ 重建完成${NC}"
}

# 主逻辑
case "${1:-help}" in
    start)
        start_container
        ;;
    stop)
        stop_container
        ;;
    restart)
        restart_container
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    shell)
        enter_shell
        ;;
    health)
        health_check
        ;;
    clean)
        clean_all
        ;;
    rebuild)
        rebuild_all
        ;;
    help|*)
        show_help
        ;;
esac
