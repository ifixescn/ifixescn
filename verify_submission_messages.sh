#!/bin/bash

echo "=========================================="
echo "验证提交提示语更新"
echo "=========================================="
echo ""

# 定义期望的提示语
EXPECTED_MESSAGE="Your submission has been received and is pending administrator approval. Thank you for your support!"

echo "📋 检查项目："
echo "1. Questions.tsx - 提交问题提示"
echo "2. MyArticles.tsx - 创建/编辑文章提示"
echo "3. QuestionDetail.tsx - 提交回答提示"
echo ""

# 检查Questions.tsx
echo "🔍 检查 Questions.tsx..."
if grep -q "$EXPECTED_MESSAGE" src/pages/Questions.tsx; then
    echo "✅ Questions.tsx - 提示语正确"
else
    echo "❌ Questions.tsx - 提示语不正确"
fi

# 检查MyArticles.tsx
echo "🔍 检查 MyArticles.tsx..."
COUNT=$(grep -c "$EXPECTED_MESSAGE" src/pages/MyArticles.tsx)
if [ "$COUNT" -eq 2 ]; then
    echo "✅ MyArticles.tsx - 提示语正确（2处）"
else
    echo "❌ MyArticles.tsx - 提示语不正确（期望2处，实际${COUNT}处）"
fi

# 检查QuestionDetail.tsx
echo "🔍 检查 QuestionDetail.tsx..."
if grep -q "$EXPECTED_MESSAGE" src/pages/QuestionDetail.tsx; then
    echo "✅ QuestionDetail.tsx - 提示语正确"
else
    echo "❌ QuestionDetail.tsx - 提示语不正确"
fi

echo ""
echo "=========================================="
echo "验证完成！"
echo "=========================================="
echo ""
echo "📝 提示语内容："
echo "$EXPECTED_MESSAGE"
echo ""
echo "🎯 测试建议："
echo "1. 访问 /questions 页面提交问题"
echo "2. 访问 /my-articles 页面创建文章"
echo "3. 访问问题详情页提交回答"
echo "4. 验证是否显示正确的英文提示"
echo ""
echo "🔐 测试账号："
echo "用户名: anthonyibennett"
echo "密码: lun123456"
