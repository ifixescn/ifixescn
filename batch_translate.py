#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量翻译CMS系统中的所有中文文本为英文
"""

import os
import re

# 完整的翻译字典
TRANSLATIONS = {
    # 基础UI文本
    "文章": "Articles",
    "产品": "Products", 
    "问答": "Q&A",
    "下载": "Downloads",
    "视频": "Videos",
    "分类": "Category",
    "类别": "Category",
    "标签": "Tags",
    "作者": "Author",
    "发布时间": "Published",
    "更新时间": "Updated",
    "浏览量": "Views",
    "点击量": "Clicks",
    "下载量": "Downloads",
    "回答": "Answers",
    "提问": "Ask",
    "评论": "Comments",
    "内容": "Content",
    "标题": "Title",
    "描述": "Description",
    "简介": "Summary",
    "详情": "Details",
    "列表": "List",
    
    # 用户角色
    "游客": "Guest",
    "会员": "Member",
    "普通会员": "Regular Member",
    "高级会员": "Premium Member",
    "管理员": "Administrator",
    "编辑": "Editor",
    
    # 动作
    "登录": "Login",
    "注册": "Register",
    "退出": "Logout",
    "退出登录": "Logout",
    "保存": "Save",
    "取消": "Cancel",
    "删除": "Delete",
    "编辑": "Edit",
    "修改": "Modify",
    "添加": "Add",
    "新增": "Add",
    "搜索": "Search",
    "查询": "Query",
    "提交": "Submit",
    "发布": "Publish",
    "审核": "Review",
    "通过": "Approve",
    "拒绝": "Reject",
    "返回": "Back",
    "查看": "View",
    "查看更多": "View More",
    "加载更多": "Load More",
    "刷新": "Refresh",
    "重置": "Reset",
    "确认": "Confirm",
    "关闭": "Close",
    "打开": "Open",
    "展开": "Expand",
    "收起": "Collapse",
    
    # 状态
    "草稿": "Draft",
    "待审核": "Pending",
    "已发布": "Published",
    "已下线": "Offline",
    "已删除": "Deleted",
    "启用": "Enabled",
    "禁用": "Disabled",
    "正常": "Normal",
    "异常": "Abnormal",
    
    # 消息提示
    "成功": "Success",
    "失败": "Failed",
    "错误": "Error",
    "警告": "Warning",
    "提示": "Info",
    "通知": "Notification",
    "加载中": "Loading",
    "加载中...": "Loading...",
    "处理中": "Processing",
    "请稍候": "Please wait",
    
    # 成功消息
    "保存成功": "Saved successfully",
    "删除成功": "Deleted successfully",
    "更新成功": "Updated successfully",
    "提交成功": "Submitted successfully",
    "发布成功": "Published successfully",
    "登录成功": "Login successful",
    "注册成功": "Registration successful",
    "操作成功": "Operation successful",
    
    # 失败消息
    "加载失败": "Failed to load",
    "保存失败": "Failed to save",
    "删除失败": "Failed to delete",
    "更新失败": "Failed to update",
    "提交失败": "Failed to submit",
    "发布失败": "Failed to publish",
    "登录失败": "Login failed",
    "注册失败": "Registration failed",
    "操作失败": "Operation failed",
    
    # 常用短语
    "全部": "All",
    "最新": "Latest",
    "热门": "Popular",
    "推荐": "Recommended",
    "精选": "Featured",
    "置顶": "Pinned",
    "没有更多": "No more",
    "暂无数据": "No data",
    "暂无内容": "No content",
    "空": "Empty",
    
    # 权限相关
    "请先登录": "Please login first",
    "需要登录": "Login required",
    "权限不足": "Insufficient permissions",
    "无权访问": "Access denied",
    "仅限会员": "Members only",
    
    # 验证消息
    "不能为空": "Cannot be empty",
    "内容不能为空": "Content cannot be empty",
    "标题不能为空": "Title cannot be empty",
    "请输入": "Please enter",
    "请选择": "Please select",
    "格式不正确": "Invalid format",
    "长度不符": "Invalid length",
    
    # 确认消息
    "确定要删除": "Are you sure you want to delete",
    "确定删除": "Confirm delete",
    "确认操作": "Confirm operation",
    "不可恢复": "Cannot be recovered",
    
    # 页面标题
    "首页": "Home",
    "个人中心": "Profile",
    "我的文章": "My Articles",
    "搜索结果": "Search Results",
    "未找到": "Not Found",
    "页面不存在": "Page Not Found",
    
    # 特定短语 - 文章
    "文章不存在": "Article not found",
    "文章列表": "Article List",
    "文章详情": "Article Details",
    "文章分类": "Article Categories",
    "全部文章": "All Articles",
    "最新文章": "Latest Articles",
    "热门文章": "Popular Articles",
    "相关文章": "Related Articles",
    "返回文章列表": "Back to Article List",
    "文章Category": "Article Categories",
    "篇文章": "articles",
    "加载文章失败": "Failed to load article",
    "文章已更新，等待审核": "Article updated, pending review",
    "文章已提交，等待审核": "Article submitted, pending review",
    "文章已删除": "Article deleted",
    "文章Content不能为空": "Article content cannot be empty",
    "确定要删除这篇文章吗": "Are you sure you want to delete this article",
    
    # 特定短语 - 产品
    "产品不存在": "Product not found",
    "产品列表": "Product List",
    "产品详情": "Product Details",
    "产品分类": "Product Categories",
    "全部产品": "All Products",
    "最新产品": "Latest Products",
    "热门产品": "Popular Products",
    "相关产品": "Related Products",
    "返回产品列表": "Back to Product List",
    "产品Category": "Product Categories",
    "个产品": "products",
    "加载产品失败": "Failed to load product",
    
    # 特定短语 - 问答
    "问题不存在": "Question not found",
    "问答列表": "Q&A List",
    "问题详情": "Question Details",
    "问答分类": "Q&A Categories",
    "全部问答": "All Q&A",
    "最新问答": "Latest Q&A",
    "热门问答": "Popular Q&A",
    "相关问答": "Related Q&A",
    "返回问答列表": "Back to Q&A List",
    "问答Category": "Q&A Categories",
    "个问题": "questions",
    "加载问题失败": "Failed to load question",
    "提交问题": "Submit Question",
    "我要提问": "Ask Question",
    "回答问题": "Answer Question",
    "提交回答": "Submit Answer",
    "回答成功": "Answer submitted",
    "您的回答已提交": "Your answer has been submitted",
    "提交回答失败": "Failed to submit answer",
    "请先登录后再回答问题": "Please login before answering questions",
    "请输入回答内容": "Please enter answer content",
    "您的问题已提交，等待管理员审核后将显示在列表中": "Your question has been submitted and will be displayed after admin review",
    "提交问题失败，请重试": "Failed to submit question, please try again",
    
    # 特定短语 - 下载
    "下载资源不存在": "Download resource not found",
    "下载列表": "Download List",
    "下载详情": "Download Details",
    "下载分类": "Download Categories",
    "全部下载": "All Downloads",
    "最新下载": "Latest Downloads",
    "热门下载": "Popular Downloads",
    "相关下载": "Related Downloads",
    "返回下载列表": "Back to Download List",
    "下载Category": "Download Categories",
    "个下载": "downloads",
    "加载下载失败": "Failed to load download",
    "下载文件": "Download File",
    "开始下载": "Start Download",
    "下载开始": "Download started",
    "文件下载已开始": "File download has started",
    "下载失败": "Download failed",
    "无法下载文件，请重试": "Unable to download file, please try again",
    "请先登录后再下载": "Please login before downloading",
    "此资源仅限会员下载，请升级会员后再试": "This resource is for members only, please upgrade your membership",
    "检查模块权限设置：是否需要登录才能下载": "Check module permission settings: login required for download",
    "检查会员权限": "Check member permissions",
    "触发下载": "Trigger download",
    
    # 特定短语 - 视频
    "视频不存在": "Video not found",
    "视频列表": "Video List",
    "视频详情": "Video Details",
    "视频分类": "Video Categories",
    "全部视频": "All Videos",
    "最新视频": "Latest Videos",
    "热门视频": "Popular Videos",
    "相关视频": "Related Videos",
    "返回视频列表": "Back to Video List",
    "视频Category": "Video Categories",
    "个视频": "videos",
    "加载视频失败": "Failed to load video",
    
    # 特定短语 - 用户
    "欢迎回来": "Welcome back",
    "欢迎加入": "Welcome",
    "正在跳转": "Redirecting",
    "欢迎回来！": "Welcome back!",
    "欢迎加入！正在跳转...": "Welcome! Redirecting...",
    "已退出": "Logged out",
    "您已成功退出登录": "You have successfully logged out",
    "个人资料": "Profile",
    "修改资料": "Edit Profile",
    "用户名": "Username",
    "密码": "Password",
    "确认密码": "Confirm Password",
    "昵称": "Nickname",
    "邮箱": "Email",
    "手机": "Phone",
    "头像": "Avatar",
    
    # 特定短语 - 搜索
    "搜索关键词": "Search keyword",
    "搜索结果": "Search Results",
    "搜索失败": "Search failed",
    "记录搜索关键词": "Record search keyword",
    "没有找到相关内容": "No results found",
    
    # 特定短语 - 分类
    "分类管理": "Category Management",
    "添加分类": "Add Category",
    "编辑分类": "Edit Category",
    "删除分类": "Delete Category",
    "分类名称": "Category Name",
    "分类描述": "Category Description",
    
    # 特定短语 - 统计
    "总计": "Total",
    "共": "Total",
    "条": "items",
    "页": "pages",
    "第": "Page",
    "上一页": "Previous",
    "下一页": "Next",
    "首页": "First",
    "尾页": "Last",
    
    # 特定短语 - 时间
    "刚刚": "Just now",
    "分钟前": "minutes ago",
    "小时前": "hours ago",
    "天前": "days ago",
    "周前": "weeks ago",
    "月前": "months ago",
    "年前": "years ago",
    
    # 特定短语 - 其他
    "探索精彩内容,获取最新资讯": "Explore exciting content and get the latest information",
    "发现优质产品,满足您的需求": "Discover quality products to meet your needs",
    "获取实用资源,提升工作效率": "Get practical resources to improve work efficiency",
    "观看精彩视频,学习新知识": "Watch exciting videos and learn new knowledge",
    "提出您的问题,获得专业解答": "Ask your questions and get professional answers",
    
    # Console.log 消息
    "加载数据失败": "Failed to load data",
    "保存数据失败": "Failed to save data",
    "删除数据失败": "Failed to delete data",
    
    # 注释
    "左侧边栏": "Left sidebar",
    "右侧边栏": "Right sidebar",
    "主要内容": "Main content",
    "顶部导航": "Top navigation",
    "底部信息": "Footer",
    "加载状态": "Loading state",
    "错误状态": "Error state",
    "空状态": "Empty state",
    "等待一下让触发器创建profile": "Wait for trigger to create profile",
    "处理各种登录错误": "Handle various login errors",
    "处理各种错误情况": "Handle various error cases",
    "注册用户": "Register user",
    "重新加载问题以显示新回答": "Reload question to display new answer",
}

def translate_content(content):
    """翻译内容中的中文文本"""
    # 按照长度从长到短排序，避免短词替换影响长词
    sorted_translations = sorted(TRANSLATIONS.items(), key=lambda x: len(x[0]), reverse=True)
    
    for chinese, english in sorted_translations:
        content = content.replace(chinese, english)
    
    return content

def translate_file(filepath):
    """翻译文件中的中文文本"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        translated_content = translate_content(original_content)
        
        # 只有内容发生变化时才写入
        if translated_content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(translated_content)
            return True
        return False
    except Exception as e:
        print(f"✗ 翻译文件出错 {filepath}: {e}")
        return False

def main():
    """主函数：翻译所有文件"""
    src_dir = "/workspace/app-7fshtpomqha9/src"
    
    translated_files = []
    unchanged_files = []
    
    # 遍历所有 .tsx 和 .ts 文件
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith(('.tsx', '.ts')) and not file.endswith('.d.ts'):
                filepath = os.path.join(root, file)
                relative_path = os.path.relpath(filepath, src_dir)
                
                if translate_file(filepath):
                    translated_files.append(relative_path)
                    print(f"✓ 已翻译: {relative_path}")
                else:
                    unchanged_files.append(relative_path)
    
    print(f"\n{'='*70}")
    print(f"翻译完成！")
    print(f"总文件数: {len(translated_files) + len(unchanged_files)}")
    print(f"已翻译文件: {len(translated_files)}")
    print(f"未变化文件: {len(unchanged_files)}")
    print(f"{'='*70}\n")
    
    if translated_files:
        print("已翻译的文件列表:")
        for f in translated_files[:20]:  # 只显示前20个
            print(f"  - {f}")
        if len(translated_files) > 20:
            print(f"  ... 还有 {len(translated_files) - 20} 个文件")

if __name__ == "__main__":
    main()
