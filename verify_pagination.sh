#!/bin/bash

echo "=========================================="
echo "验证问答模块分页功能"
echo "=========================================="
echo ""

echo "📋 检查项目："
echo "1. Questions.tsx - 问答列表页面分页"
echo "2. QuestionsByCategory.tsx - 分类问答页面分页"
echo ""

# 检查Questions.tsx
echo "🔍 检查 Questions.tsx..."
echo ""

# 检查是否导入了Pagination组件
if grep -q "import.*Pagination.*from.*@/components/ui/pagination" src/pages/Questions.tsx; then
    echo "✅ Pagination组件已导入"
else
    echo "❌ Pagination组件未导入"
fi

# 检查每页条数设置
if grep -q "itemsPerPage = 7" src/pages/Questions.tsx; then
    echo "✅ 每页条数设置为7条"
else
    echo "❌ 每页条数未设置为7条"
fi

# 检查是否有分页状态
if grep -q "currentPage.*useState" src/pages/Questions.tsx && grep -q "totalPages.*useState" src/pages/Questions.tsx; then
    echo "✅ 分页状态已添加"
else
    echo "❌ 分页状态未添加"
fi

# 检查是否使用了Pagination组件
if grep -q "<Pagination>" src/pages/Questions.tsx; then
    echo "✅ Pagination组件已使用"
else
    echo "❌ Pagination组件未使用"
fi

echo ""
echo "🔍 检查 QuestionsByCategory.tsx..."
echo ""

# 检查是否导入了Pagination组件
if grep -q "import.*Pagination.*from.*@/components/ui/pagination" src/pages/QuestionsByCategory.tsx; then
    echo "✅ Pagination组件已导入"
else
    echo "❌ Pagination组件未导入"
fi

# 检查每页条数设置
if grep -q "itemsPerPage = 7" src/pages/QuestionsByCategory.tsx; then
    echo "✅ 每页条数设置为7条"
else
    echo "❌ 每页条数未设置为7条"
fi

# 检查是否使用了Pagination组件
if grep -q "<Pagination>" src/pages/QuestionsByCategory.tsx; then
    echo "✅ Pagination组件已使用"
else
    echo "❌ Pagination组件未使用"
fi

echo ""
echo "=========================================="
echo "验证完成！"
echo "=========================================="
echo ""
echo "📝 分页功能说明："
echo "- 每页显示：7条问答"
echo "- 分页样式：使用shadcn/ui Pagination组件"
echo "- 页码显示：智能显示（第一页、最后一页、当前页±1）"
echo "- 翻页效果：平滑滚动到顶部"
echo "- UI语言：英文（Previous/Next）"
echo ""
echo "🎯 测试建议："
echo "1. 访问 /questions 页面查看分页"
echo "2. 访问 /questions/category/{categoryId} 查看分类分页"
echo "3. 点击页码测试翻页功能"
echo "4. 验证每页显示7条问答"
echo "5. 测试Previous/Next按钮"
echo ""
