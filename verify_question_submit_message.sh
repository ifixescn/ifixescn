#!/bin/bash

echo "=========================================="
echo "验证问题提交成功提示信息修复"
echo "=========================================="
echo ""

echo "🔍 检查修改内容..."
echo ""

# 检查新的提示信息
if grep -q "Your question has been submitted and is awaiting administrator approval. Thank you for your support!" src/pages/Questions.tsx; then
    echo "✅ 新提示信息已正确设置"
    echo "   内容：Your question has been submitted and is awaiting administrator approval. Thank you for your support!"
else
    echo "❌ 新提示信息未找到"
fi

echo ""

# 检查是否还有旧的提示信息
if grep -q "Your submission has been received and is pending administrator approval" src/pages/Questions.tsx; then
    echo "⚠️  旧提示信息仍然存在"
else
    echo "✅ 旧提示信息已移除"
fi

echo ""
echo "=========================================="
echo "提示信息详情"
echo "=========================================="
echo ""

echo "📝 新提示信息："
echo "   标题：Success"
echo "   内容：Your question has been submitted and is awaiting administrator approval. Thank you for your support!"
echo ""

echo "🎯 信息含义："
echo "   ✅ 您的问题已经提交"
echo "   ⏳ 等待管理员审核通过后将显示"
echo "   💖 感谢您的支持"
echo ""

echo "=========================================="
echo "测试建议"
echo "=========================================="
echo ""

echo "📋 测试步骤："
echo "1. 访问问答页面：http://localhost:5173/questions"
echo "2. 点击 'Ask a Question' 按钮"
echo "3. 填写问题表单："
echo "   - 标题：Test Question"
echo "   - 内容：This is a test question"
echo "   - 分类：选择一个分类（可选）"
echo "4. 点击 'Submit Question' 按钮"
echo "5. 验证成功提示信息"
echo ""

echo "✅ 预期结果："
echo "- 显示绿色成功提示框"
echo "- 标题显示 'Success'"
echo "- 内容显示新的提示信息"
echo "- 对话框自动关闭"
echo "- 表单内容清空"
echo ""

echo "=========================================="
echo "验证完成！"
echo "=========================================="
