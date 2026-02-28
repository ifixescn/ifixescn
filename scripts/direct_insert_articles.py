#!/usr/bin/env python3
"""
直接通过Python插入100篇手机维修文章
绕过RLS策略
"""
import os
import sys
import time
import re
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_ANON_KEY')

def read_sql_statements(filename):
    """读取SQL文件并提取INSERT语句"""
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 使用正则表达式匹配完整的INSERT语句
    pattern = r"INSERT INTO articles.*?VALUES.*?;(?=\s*(?:INSERT INTO|$))"
    statements = re.findall(pattern, content, re.DOTALL)
    
    return statements

def parse_insert_statement(sql):
    """解析INSERT语句，提取字段值"""
    # 提取VALUES部分
    match = re.search(r"VALUES\s*\((.*)\);", sql, re.DOTALL)
    if not match:
        return None
    
    values_str = match.group(1)
    
    # 手动解析值（处理嵌套的引号和逗号）
    values = []
    current_value = ''
    in_string = False
    escape_next = False
    paren_count = 0
    
    for char in values_str:
        if escape_next:
            current_value += char
            escape_next = False
            continue
            
        if char == '\\':
            escape_next = True
            current_value += char
            continue
            
        if char == "'" and not escape_next:
            in_string = not in_string
            current_value += char
            continue
            
        if char == ',' and not in_string and paren_count == 0:
            values.append(current_value.strip())
            current_value = ''
            continue
            
        if char == '(' and not in_string:
            paren_count += 1
        elif char == ')' and not in_string:
            paren_count -= 1
            
        current_value += char
    
    if current_value.strip():
        values.append(current_value.strip())
    
    # 清理值
    cleaned_values = []
    for v in values:
        v = v.strip()
        if v.startswith("'") and v.endswith("'"):
            v = v[1:-1]  # 移除外层引号
            v = v.replace("''", "'")  # 反转义单引号
        cleaned_values.append(v)
    
    if len(cleaned_values) < 11:
        return None
    
    return {
        'title': cleaned_values[0],
        'slug': cleaned_values[1],
        'content': cleaned_values[2],
        'excerpt': cleaned_values[3],
        'cover_image': cleaned_values[4],
        'category_id': cleaned_values[5],
        'author_id': cleaned_values[6],
        'status': cleaned_values[7],
        'view_count': int(cleaned_values[8]) if cleaned_values[8].isdigit() else 100,
        'language': cleaned_values[9]
    }

def insert_via_sql(sql_statement):
    """通过SQL直接插入"""
    import requests
    
    # 使用Supabase的SQL执行端点（如果存在）
    url = f"{SUPABASE_URL}/rest/v1/rpc/execute_sql"
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }
    
    data = {'query': sql_statement}
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)
        if response.status_code in [200, 201, 204]:
            return True, None
        else:
            return False, f"HTTP {response.status_code}"
    except Exception as e:
        return False, str(e)

def main():
    print('=' * 70)
    print('批量插入100篇手机维修英文文章')
    print('=' * 70)
    print()
    
    sql_file = 'insert-phone-repair-articles.sql'
    
    if not os.path.exists(sql_file):
        print(f'❌ 错误: 找不到文件 {sql_file}')
        sys.exit(1)
    
    print(f'📖 读取SQL文件: {sql_file}')
    statements = read_sql_statements(sql_file)
    print(f'✅ 找到 {len(statements)} 条INSERT语句\n')
    
    print('开始插入文章...\n')
    print('注意: 由于RLS策略限制，需要使用管理员权限执行')
    print('建议: 在Supabase Dashboard的SQL Editor中执行这些语句\n')
    
    # 将所有语句合并成一个文件，方便在Dashboard中执行
    output_file = 'articles_insert_for_dashboard.sql'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('-- 批量插入100篇手机维修英文文章\n')
        f.write('-- 请在Supabase Dashboard的SQL Editor中执行此文件\n')
        f.write('-- 生成时间: ' + time.strftime('%Y-%m-%d %H:%M:%S') + '\n\n')
        
        for i, stmt in enumerate(statements, 1):
            f.write(f'-- 文章 {i}\n')
            f.write(stmt)
            f.write('\n\n')
    
    print(f'✅ 已生成SQL文件: {output_file}')
    print(f'📝 文件包含 {len(statements)} 条INSERT语句')
    print()
    print('执行步骤:')
    print('1. 登录 Supabase Dashboard')
    print('2. 进入 SQL Editor')
    print(f'3. 复制 {output_file} 的内容')
    print('4. 粘贴到SQL Editor并执行')
    print()
    print('或者使用命令行:')
    print(f'   cat {output_file} | psql <your-database-url>')
    print()

if __name__ == '__main__':
    main()
