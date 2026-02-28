# ============================================
# 多阶段构建 - 生产环境 Docker 镜像
# ============================================

# -------------------- 构建阶段 --------------------
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装 pnpm（应用使用 pnpm 作为包管理器）
RUN npm install -g pnpm

# 复制 package 文件和 lock 文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 安装依赖（使用 pnpm）
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 复制环境变量文件（如果存在）
# 注意：生产环境建议使用运行时环境变量注入
COPY .env* ./

# 构建应用
# 注意：由于 package.json 中 build 命令被禁用，我们直接使用 vite build
RUN pnpm exec vite build

# 验证构建产物
RUN ls -la /app/dist

# -------------------- 生产阶段 --------------------
FROM nginx:alpine

# 安装必要的工具
RUN apk add --no-cache bash curl

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 复制构建文件到 nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 设置正确的权限
RUN chown -R nodejs:nodejs /usr/share/nginx/html && \
    chown -R nodejs:nodejs /var/cache/nginx && \
    chown -R nodejs:nodejs /var/log/nginx && \
    chown -R nodejs:nodejs /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nodejs:nodejs /var/run/nginx.pid

# 创建健康检查脚本
RUN echo '#!/bin/sh' > /healthcheck.sh && \
    echo 'curl -f http://localhost/ || exit 1' >> /healthcheck.sh && \
    chmod +x /healthcheck.sh

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD /healthcheck.sh

# 暴露端口
EXPOSE 80

# 添加标签
LABEL maintainer="iFixes Team" \
      version="1.0.0" \
      description="iFixes CMS - Mobile Phone Repair Resource Platform" \
      app.name="ifixes-cms" \
      app.version="v201"

# 切换到非 root 用户（可选，某些环境可能需要 root）
# USER nodejs

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
