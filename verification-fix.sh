#!/bin/bash

# 验证文件访问问题 - 自动诊断和修复脚本
# 使用方法：sudo bash verification-fix.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
DOMAIN="ifixescn.com"
WWW_DOMAIN="www.ifixescn.com"
NGINX_CONFIG="/etc/nginx/sites-available/ifixescn.com"
WEB_ROOT="/var/www/html"
VERIFICATION_FILE="ByteDanceVerify.html"
EDGE_FUNCTION_URL="https://backend.appmiaoda.com/projects/supabase245084004091473920/functions/v1/verification-file"
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoyMDc3ODU5NzgwLCJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwic3ViIjoiYW5vbiJ9.-KT3648Gqgvq1jyvJBU3MMsO-1P5OE0lTzib2Yvjdsc"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_section() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# 检查是否以root权限运行
check_root() {
    if [ "$EUID" -ne 0 ]; then 
        log_error "请使用 sudo 运行此脚本"
        exit 1
    fi
}

# 步骤1：测试Edge Function
test_edge_function() {
    log_section "步骤1：测试Edge Function"
    
    log_info "正在测试Edge Function..."
    
    EDGE_RESPONSE=$(curl -s -w "\n%{http_code}" "${EDGE_FUNCTION_URL}/${VERIFICATION_FILE}" \
        -H "apikey: ${API_KEY}" 2>/dev/null)
    
    EDGE_BODY=$(echo "$EDGE_RESPONSE" | head -n -1)
    EDGE_CODE=$(echo "$EDGE_RESPONSE" | tail -n 1)
    
    if [ "$EDGE_CODE" = "200" ]; then
        log_success "Edge Function正常 (HTTP $EDGE_CODE)"
        log_info "返回内容: $EDGE_BODY"
        return 0
    else
        log_error "Edge Function异常 (HTTP $EDGE_CODE)"
        log_error "返回内容: $EDGE_BODY"
        return 1
    fi
}

# 步骤2：检查Nginx配置文件
check_nginx_config() {
    log_section "步骤2：检查Nginx配置文件"
    
    if [ ! -f "$NGINX_CONFIG" ]; then
        log_error "Nginx配置文件不存在: $NGINX_CONFIG"
        return 1
    fi
    
    log_success "配置文件存在: $NGINX_CONFIG"
    
    # 检查是否包含验证文件规则
    if grep -q "verification-file" "$NGINX_CONFIG"; then
        log_success "配置文件包含验证文件规则"
        
        # 显示验证文件规则
        log_info "当前验证文件规则："
        grep -A 15 "location.*txt.*html" "$NGINX_CONFIG" | head -20
        
        return 0
    else
        log_warning "配置文件不包含验证文件规则"
        return 1
    fi
}

# 步骤3：检查location规则顺序
check_location_order() {
    log_section "步骤3：检查location规则顺序"
    
    log_info "检查location规则顺序..."
    
    # 获取所有location的行号
    LOCATIONS=$(grep -n "^\s*location" "$NGINX_CONFIG" | head -10)
    
    echo "$LOCATIONS"
    
    # 检查验证文件规则是否在第一位
    FIRST_LOCATION=$(echo "$LOCATIONS" | head -1)
    
    if echo "$FIRST_LOCATION" | grep -q "txt.*html"; then
        log_success "验证文件规则在第一位（正确）"
        return 0
    else
        log_warning "验证文件规则不在第一位（可能被其他规则覆盖）"
        return 1
    fi
}

# 步骤4：备份并修复Nginx配置
fix_nginx_config() {
    log_section "步骤4：修复Nginx配置"
    
    # 备份原配置
    BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    log_info "备份原配置到: $BACKUP_FILE"
    cp "$NGINX_CONFIG" "$BACKUP_FILE"
    log_success "备份完成"
    
    # 检查是否已有验证文件规则
    if grep -q "verification-file" "$NGINX_CONFIG"; then
        log_info "配置文件已包含验证文件规则，检查位置..."
        
        # 检查规则是否在正确位置
        FIRST_LOCATION_LINE=$(grep -n "^\s*location" "$NGINX_CONFIG" | head -1 | cut -d: -f1)
        VERIFICATION_LINE=$(grep -n "verification-file" "$NGINX_CONFIG" | head -1 | cut -d: -f1)
        
        if [ "$VERIFICATION_LINE" -lt "$FIRST_LOCATION_LINE" ] || [ "$VERIFICATION_LINE" -eq "$FIRST_LOCATION_LINE" ]; then
            log_success "验证文件规则位置正确"
            return 0
        else
            log_warning "验证文件规则位置不正确，需要移动到最前面"
            # 这里需要手动调整，因为自动移动可能破坏配置
            log_error "请手动编辑配置文件，将验证文件规则移动到所有其他location之前"
            return 1
        fi
    else
        log_info "配置文件不包含验证文件规则，正在添加..."
        
        # 查找server块中第一个location的位置
        FIRST_LOCATION_LINE=$(grep -n "^\s*location" "$NGINX_CONFIG" | head -1 | cut -d: -f1)
        
        if [ -z "$FIRST_LOCATION_LINE" ]; then
            log_error "无法找到location规则，请手动添加配置"
            return 1
        fi
        
        # 在第一个location之前插入验证文件规则
        VERIFICATION_RULE="
    # ========================================
    # 验证文件重写规则（自动添加 - $(date))
    # ========================================
    location ~ ^/[^/]+\.(txt|html)$ {
        set \$filename \$uri;
        if (\$filename ~ ^/(.+)$) {
            set \$filename \$1;
        }
        
        proxy_pass ${EDGE_FUNCTION_URL}/\$filename;
        proxy_set_header Host backend.appmiaoda.com;
        proxy_set_header apikey ${API_KEY};
        
        proxy_connect_timeout 10s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
        
        proxy_cache_valid 200 1h;
        add_header X-Cache-Status \$upstream_cache_status;
        
        access_log /var/log/nginx/verification-files.log;
    }
"
        
        # 创建临时文件
        TEMP_FILE=$(mktemp)
        
        # 在第一个location之前插入规则
        head -n $((FIRST_LOCATION_LINE - 1)) "$NGINX_CONFIG" > "$TEMP_FILE"
        echo "$VERIFICATION_RULE" >> "$TEMP_FILE"
        tail -n +$FIRST_LOCATION_LINE "$NGINX_CONFIG" >> "$TEMP_FILE"
        
        # 替换原配置
        mv "$TEMP_FILE" "$NGINX_CONFIG"
        
        log_success "验证文件规则已添加"
        return 0
    fi
}

# 步骤5：测试Nginx配置语法
test_nginx_syntax() {
    log_section "步骤5：测试Nginx配置语法"
    
    log_info "测试Nginx配置语法..."
    
    if nginx -t 2>&1 | tee /tmp/nginx_test.log; then
        log_success "Nginx配置语法正确"
        return 0
    else
        log_error "Nginx配置语法错误："
        cat /tmp/nginx_test.log
        log_error "请检查配置文件: $NGINX_CONFIG"
        log_info "可以恢复备份: cp $BACKUP_FILE $NGINX_CONFIG"
        return 1
    fi
}

# 步骤6：重启Nginx
reload_nginx() {
    log_section "步骤6：重启Nginx"
    
    log_info "重新加载Nginx配置..."
    
    if systemctl reload nginx; then
        log_success "Nginx重新加载成功"
        sleep 2
        return 0
    else
        log_error "Nginx重新加载失败"
        log_info "尝试完全重启..."
        
        if systemctl restart nginx; then
            log_success "Nginx重启成功"
            sleep 2
            return 0
        else
            log_error "Nginx重启失败"
            systemctl status nginx
            return 1
        fi
    fi
}

# 步骤7：测试本地访问
test_local_access() {
    log_section "步骤7：测试本地访问"
    
    log_info "测试本地HTTP访问..."
    LOCAL_RESPONSE=$(curl -s -w "\n%{http_code}" "http://localhost/${VERIFICATION_FILE}" 2>/dev/null)
    LOCAL_BODY=$(echo "$LOCAL_RESPONSE" | head -n -1)
    LOCAL_CODE=$(echo "$LOCAL_RESPONSE" | tail -n 1)
    
    if [ "$LOCAL_CODE" = "200" ]; then
        log_success "本地访问成功 (HTTP $LOCAL_CODE)"
        log_info "返回内容: $LOCAL_BODY"
        return 0
    else
        log_error "本地访问失败 (HTTP $LOCAL_CODE)"
        log_error "返回内容: $LOCAL_BODY"
        return 1
    fi
}

# 步骤8：测试HTTPS访问
test_https_access() {
    log_section "步骤8：测试HTTPS访问"
    
    # 测试不带www
    log_info "测试 https://${DOMAIN}/${VERIFICATION_FILE} ..."
    HTTPS_RESPONSE=$(curl -s -w "\n%{http_code}" "https://${DOMAIN}/${VERIFICATION_FILE}" 2>/dev/null)
    HTTPS_BODY=$(echo "$HTTPS_RESPONSE" | head -n -1)
    HTTPS_CODE=$(echo "$HTTPS_RESPONSE" | tail -n 1)
    
    if [ "$HTTPS_CODE" = "200" ]; then
        log_success "HTTPS访问成功 (HTTP $HTTPS_CODE)"
        log_info "返回内容: $HTTPS_BODY"
    else
        log_error "HTTPS访问失败 (HTTP $HTTPS_CODE)"
        log_error "返回内容: $HTTPS_BODY"
    fi
    
    # 测试带www
    log_info "测试 https://${WWW_DOMAIN}/${VERIFICATION_FILE} ..."
    WWW_RESPONSE=$(curl -s -w "\n%{http_code}" "https://${WWW_DOMAIN}/${VERIFICATION_FILE}" 2>/dev/null)
    WWW_BODY=$(echo "$WWW_RESPONSE" | head -n -1)
    WWW_CODE=$(echo "$WWW_RESPONSE" | tail -n 1)
    
    if [ "$WWW_CODE" = "200" ]; then
        log_success "HTTPS访问成功 (HTTP $WWW_CODE)"
        log_info "返回内容: $WWW_BODY"
        return 0
    else
        log_error "HTTPS访问失败 (HTTP $WWW_CODE)"
        log_error "返回内容: $WWW_BODY"
        return 1
    fi
}

# 步骤9：查看错误日志
check_error_logs() {
    log_section "步骤9：查看错误日志"
    
    log_info "查看最近的Nginx错误日志..."
    
    if [ -f /var/log/nginx/error.log ]; then
        log_info "最后20条错误日志："
        tail -20 /var/log/nginx/error.log | grep -i "ByteDanceVerify\|verification\|404\|error" || log_info "无相关错误"
    else
        log_warning "错误日志文件不存在"
    fi
    
    log_info ""
    log_info "查看最近的访问日志..."
    
    if [ -f /var/log/nginx/access.log ]; then
        log_info "最后10条访问日志（包含ByteDanceVerify）："
        tail -100 /var/log/nginx/access.log | grep "ByteDanceVerify" | tail -10 || log_info "无相关访问记录"
    else
        log_warning "访问日志文件不存在"
    fi
}

# 步骤10：提供静态文件备用方案
provide_static_fallback() {
    log_section "步骤10：静态文件备用方案"
    
    log_warning "如果Nginx配置方案无法解决，可以使用静态文件方案"
    
    read -p "是否使用静态文件方案？(y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "下载验证文件到Web根目录..."
        
        curl -s "${EDGE_FUNCTION_URL}/${VERIFICATION_FILE}" \
            -H "apikey: ${API_KEY}" \
            -o "${WEB_ROOT}/${VERIFICATION_FILE}"
        
        if [ -f "${WEB_ROOT}/${VERIFICATION_FILE}" ]; then
            chown www-data:www-data "${WEB_ROOT}/${VERIFICATION_FILE}"
            chmod 644 "${WEB_ROOT}/${VERIFICATION_FILE}"
            
            log_success "静态文件已创建: ${WEB_ROOT}/${VERIFICATION_FILE}"
            log_info "文件内容:"
            cat "${WEB_ROOT}/${VERIFICATION_FILE}"
            
            # 测试访问
            log_info "测试静态文件访问..."
            STATIC_RESPONSE=$(curl -s -w "\n%{http_code}" "https://${WWW_DOMAIN}/${VERIFICATION_FILE}" 2>/dev/null)
            STATIC_BODY=$(echo "$STATIC_RESPONSE" | head -n -1)
            STATIC_CODE=$(echo "$STATIC_RESPONSE" | tail -n 1)
            
            if [ "$STATIC_CODE" = "200" ]; then
                log_success "静态文件访问成功！"
                log_info "返回内容: $STATIC_BODY"
                return 0
            else
                log_error "静态文件访问失败 (HTTP $STATIC_CODE)"
                return 1
            fi
        else
            log_error "静态文件创建失败"
            return 1
        fi
    else
        log_info "跳过静态文件方案"
        return 1
    fi
}

# 主函数
main() {
    log_section "验证文件访问问题 - 自动诊断和修复"
    log_info "域名: ${WWW_DOMAIN}"
    log_info "验证文件: ${VERIFICATION_FILE}"
    log_info "开始时间: $(date)"
    
    # 检查root权限
    check_root
    
    # 步骤1：测试Edge Function
    if ! test_edge_function; then
        log_error "Edge Function异常，无法继续"
        log_info "请检查Edge Function是否已部署"
        exit 1
    fi
    
    # 步骤2：检查Nginx配置
    CONFIG_EXISTS=0
    if check_nginx_config; then
        CONFIG_EXISTS=1
    fi
    
    # 步骤3：检查location规则顺序
    ORDER_CORRECT=0
    if [ $CONFIG_EXISTS -eq 1 ]; then
        if check_location_order; then
            ORDER_CORRECT=1
        fi
    fi
    
    # 如果配置不存在或顺序不正确，尝试修复
    if [ $CONFIG_EXISTS -eq 0 ] || [ $ORDER_CORRECT -eq 0 ]; then
        log_warning "需要修复Nginx配置"
        
        read -p "是否自动修复Nginx配置？(y/n) " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if ! fix_nginx_config; then
                log_error "自动修复失败，请手动配置"
                exit 1
            fi
            
            # 步骤5：测试配置语法
            if ! test_nginx_syntax; then
                log_error "配置语法错误，请检查配置文件"
                exit 1
            fi
            
            # 步骤6：重启Nginx
            if ! reload_nginx; then
                log_error "Nginx重启失败"
                exit 1
            fi
        else
            log_info "跳过自动修复"
        fi
    else
        log_success "Nginx配置正确"
        
        # 仍然重启Nginx以确保配置生效
        log_info "重新加载Nginx以确保配置生效..."
        reload_nginx
    fi
    
    # 步骤7：测试本地访问
    test_local_access
    
    # 步骤8：测试HTTPS访问
    if test_https_access; then
        log_section "✅ 配置成功！"
        log_success "验证文件可以正常访问"
        log_success "URL: https://${WWW_DOMAIN}/${VERIFICATION_FILE}"
        exit 0
    else
        log_section "⚠️ HTTPS访问仍然失败"
        
        # 步骤9：查看错误日志
        check_error_logs
        
        # 步骤10：提供静态文件备用方案
        if provide_static_fallback; then
            log_section "✅ 静态文件方案成功！"
            log_success "验证文件可以正常访问（使用静态文件）"
            log_warning "注意：每次更新验证文件都需要手动上传"
            exit 0
        else
            log_section "❌ 所有方案都失败"
            log_error "请联系技术支持，并提供以下信息："
            log_info "1. Edge Function测试结果"
            log_info "2. Nginx配置文件: $NGINX_CONFIG"
            log_info "3. Nginx错误日志: /var/log/nginx/error.log"
            log_info "4. 本脚本的完整输出"
            exit 1
        fi
    fi
}

# 运行主函数
main
