#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查文件中是否还有中文字符
"""

import os
import re

def has_chinese(text):
    """检查文本中是否包含中文字符"""
    return bool(re.search(r'[\u4e00-\u9fa5]', text))

def check_file(filepath):
    """检查文件中的中文字符"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if has_chinese(content):
            lines = content.split('\n')
            chinese_lines = []
            for i, line in enumerate(lines, 1):
                if has_chinese(line):
                    chinese_lines.append((i, line.strip()))
            return chinese_lines
        return []
    except Exception as e:
        return []

def main():
    """主函数：检查所有文件"""
    src_dir = "/workspace/app-7fshtpomqha9/src"
    
    files_with_chinese = {}
    
    # 遍历所有 .tsx 和 .ts 文件
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith(('.tsx', '.ts')) and not file.endswith('.d.ts'):
                filepath = os.path.join(root, file)
                relative_path = os.path.relpath(filepath, src_dir)
                
                chinese_lines = check_file(filepath)
                if chinese_lines:
                    files_with_chinese[relative_path] = chinese_lines
    
    if files_with_chinese:
        print(f"发现 {len(files_with_chinese)} 个文件仍包含中文:\n")
        for filepath, lines in list(files_with_chinese.items())[:10]:
            print(f"\n文件: {filepath}")
            for line_num, line in lines[:5]:
                print(f"  行 {line_num}: {line[:100]}")
            if len(lines) > 5:
                print(f"  ... 还有 {len(lines) - 5} 行")
    else:
        print("✓ 所有文件已完成英文翻译！")

if __name__ == "__main__":
    main()
