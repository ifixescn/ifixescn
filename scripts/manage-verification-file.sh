#!/bin/bash

# 微信验证文件管理脚本
# 用途：简化微信公众号域名验证文件的上传和管理

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="/workspace/app-7fshtpomqha9"
PUBLIC_DIR="$PROJECT_ROOT/public"
DIST_DIR="$PROJECT_ROOT/dist"

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# 显示帮助信息
show_help() {
    cat << EOF
微信验证文件管理脚本

用法:
    $0 <命令> [参数]

命令:
    list                列出所有验证文件
    add <文件路径>      添加验证文件
    remove <文件名>     删除验证文件
    test <文件名>       测试验证文件访问
    deploy              构建并部署
    help                显示此帮助信息

示例:
    # 列出所有验证文件
    $0 list

    # 添加验证文件
    $0 add ~/Downloads/MP_verify_abc123.txt

    # 删除验证文件
    $0 remove MP_verify_abc123.txt

    # 测试文件访问
    $0 test MP_verify_abc123.txt

    # 构建并部署
    $0 deploy

EOF
}

# 列出所有验证文件
list_files() {
    print_info "正在查找验证文件..."
    echo ""
    
    # 查找public目录中的验证文件
    if ls "$PUBLIC_DIR"/MP_verify_*.txt 1> /dev/null 2>&1; then
        print_success "在 public 目录中找到以下验证文件："
        echo ""
        for file in "$PUBLIC_DIR"/MP_verify_*.txt; do
            filename=$(basename "$file")
            size=$(du -h "$file" | cut -f1)
            modified=$(stat -c %y "$file" | cut -d' ' -f1,2 | cut -d'.' -f1)
            echo "  📄 $filename"
            echo "     大小: $size"
            echo "     修改时间: $modified"
            echo ""
        done
    else
        print_warning "在 public 目录中未找到验证文件"
        echo ""
    fi
    
    # 查找dist目录中的验证文件（如果存在）
    if [ -d "$DIST_DIR" ]; then
        if ls "$DIST_DIR"/MP_verify_*.txt 1> /dev/null 2>&1; then
            print_success "在 dist 目录中找到以下验证文件（已构建）："
            echo ""
            for file in "$DIST_DIR"/MP_verify_*.txt; do
                filename=$(basename "$file")
                size=$(du -h "$file" | cut -f1)
                echo "  📦 $filename ($size)"
            done
            echo ""
        fi
    fi
}

# 添加验证文件
add_file() {
    local source_file="$1"
    
    if [ -z "$source_file" ]; then
        print_error "请指定要添加的文件路径"
        echo "用法: $0 add <文件路径>"
        exit 1
    fi
    
    if [ ! -f "$source_file" ]; then
        print_error "文件不存在: $source_file"
        exit 1
    fi
    
    local filename=$(basename "$source_file")
    
    # 验证文件名格式
    if [[ ! "$filename" =~ ^MP_verify_.*\.txt$ ]]; then
        print_error "文件名格式不正确"
        echo "文件名必须以 MP_verify_ 开头，以 .txt 结尾"
        echo "例如: MP_verify_abc123.txt"
        exit 1
    fi
    
    # 复制文件
    print_info "正在复制文件到 public 目录..."
    cp "$source_file" "$PUBLIC_DIR/$filename"
    
    # 设置权限
    chmod 644 "$PUBLIC_DIR/$filename"
    
    print_success "验证文件已添加: $filename"
    echo ""
    
    # 显示文件内容（前3行）
    print_info "文件内容预览:"
    head -n 3 "$PUBLIC_DIR/$filename" | sed 's/^/  /'
    echo ""
    
    print_warning "下一步: 运行 '$0 deploy' 来构建并部署"
}

# 删除验证文件
remove_file() {
    local filename="$1"
    
    if [ -z "$filename" ]; then
        print_error "请指定要删除的文件名"
        echo "用法: $0 remove <文件名>"
        exit 1
    fi
    
    local filepath="$PUBLIC_DIR/$filename"
    
    if [ ! -f "$filepath" ]; then
        print_error "文件不存在: $filename"
        exit 1
    fi
    
    # 确认删除
    read -p "确定要删除 $filename 吗? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "已取消删除"
        exit 0
    fi
    
    # 删除文件
    rm "$filepath"
    print_success "验证文件已删除: $filename"
}

# 测试文件访问
test_file() {
    local filename="$1"
    
    if [ -z "$filename" ]; then
        print_error "请指定要测试的文件名"
        echo "用法: $0 test <文件名>"
        exit 1
    fi
    
    # 检查本地文件是否存在
    if [ ! -f "$PUBLIC_DIR/$filename" ]; then
        print_error "本地文件不存在: $filename"
        exit 1
    fi
    
    print_success "本地文件存在: $filename"
    echo ""
    
    # 提示输入域名
    read -p "请输入你的域名（例如: example.com）: " domain
    
    if [ -z "$domain" ]; then
        print_error "域名不能为空"
        exit 1
    fi
    
    # 测试HTTP访问
    print_info "测试 HTTP 访问..."
    local http_url="http://$domain/$filename"
    if curl -s -o /dev/null -w "%{http_code}" "$http_url" | grep -q "200"; then
        print_success "HTTP 访问成功: $http_url"
    else
        print_warning "HTTP 访问失败: $http_url"
    fi
    echo ""
    
    # 测试HTTPS访问
    print_info "测试 HTTPS 访问..."
    local https_url="https://$domain/$filename"
    if curl -s -o /dev/null -w "%{http_code}" "$https_url" | grep -q "200"; then
        print_success "HTTPS 访问成功: $https_url"
        echo ""
        print_info "文件内容:"
        curl -s "$https_url" | head -n 5 | sed 's/^/  /'
    else
        print_warning "HTTPS 访问失败: $https_url"
    fi
    echo ""
    
    print_info "验证地址: $https_url"
}

# 构建并部署
deploy() {
    print_info "开始构建项目..."
    echo ""
    
    cd "$PROJECT_ROOT"
    
    # 构建
    if npm run build; then
        print_success "构建成功"
        echo ""
        
        # 检查验证文件是否包含在构建输出中
        if ls "$DIST_DIR"/MP_verify_*.txt 1> /dev/null 2>&1; then
            print_success "验证文件已包含在构建输出中:"
            for file in "$DIST_DIR"/MP_verify_*.txt; do
                filename=$(basename "$file")
                echo "  ✓ $filename"
            done
            echo ""
        else
            print_warning "构建输出中未找到验证文件"
            echo ""
        fi
        
        print_info "构建完成！"
        echo ""
        print_warning "下一步: 使用你的部署方式部署应用"
        echo "  例如: docker-compose up -d --build"
        echo "  或: ./deploy.sh"
    else
        print_error "构建失败"
        exit 1
    fi
}

# 主函数
main() {
    local command="$1"
    shift || true
    
    case "$command" in
        list)
            list_files
            ;;
        add)
            add_file "$@"
            ;;
        remove)
            remove_file "$@"
            ;;
        test)
            test_file "$@"
            ;;
        deploy)
            deploy
            ;;
        help|--help|-h|"")
            show_help
            ;;
        *)
            print_error "未知命令: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"
