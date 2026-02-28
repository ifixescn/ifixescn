#!/usr/bin/env python3
"""
批量插入100篇手机维修文章到数据库
"""
import os
import sys
import time
import requests
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_ANON_KEY')

def read_sql_statements(filename):
    """读取SQL文件并分割成单独的INSERT语句"""
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    inserts = []
    lines = content.split('\n')
    current_insert = []
    in_insert = False
    
    for line in lines:
        if line.strip().startswith('INSERT INTO articles'):
            if current_insert:
                inserts.append('\n'.join(current_insert))
            current_insert = [line]
            in_insert = True
        elif in_insert:
            current_insert.append(line)
            if line.strip().endswith(';'):
                inserts.append('\n'.join(current_insert))
                current_insert = []
                in_insert = False
    
    if current_insert:
        inserts.append('\n'.join(current_insert))
    
    return inserts

def execute_sql(sql_statement):
    """通过Supabase REST API执行SQL"""
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json'
    }
    data = {'sql_query': sql_statement}
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)
        if response.status_code == 200 or response.status_code == 201:
            return True, None
        else:
            return False, f"HTTP {response.status_code}: {response.text}"
    except Exception as e:
        return False, str(e)

def main():
    print('=' * 60)
    print('批量插入100篇手机维修英文文章')
    print('=' * 60)
    print()
    
    sql_file = 'insert-phone-repair-articles.sql'
    
    if not os.path.exists(sql_file):
        print(f'❌ 错误: 找不到文件 {sql_file}')
        sys.exit(1)
    
    print(f'📖 读取SQL文件: {sql_file}')
    statements = read_sql_statements(sql_file)
    print(f'✅ 找到 {len(statements)} 条INSERT语句\n')
    
    success_count = 0
    fail_count = 0
    failed_indices = []
    
    print('开始插入文章...\n')
    
    for i, sql in enumerate(statements, 1):
        # 显示进度
        print(f'[{i}/100] 插入文章 {i}...', end=' ', flush=True)
        
        success, error = execute_sql(sql)
        
        if success:
            success_count += 1
            print('✅')
        else:
            fail_count += 1
            failed_indices.append(i)
            print(f'❌ 失败: {error[:100]}')
        
        # 添加延迟避免请求过快
        if i < len(statements):
            time.sleep(0.3)
    
    print()
    print('=' * 60)
    print('执行完成！')
    print('=' * 60)
    print(f'✅ 成功: {success_count} 篇')
    print(f'❌ 失败: {fail_count} 篇')
    
    if failed_indices:
        print(f'\n失败的文章编号: {failed_indices}')
    
    print()

if __name__ == '__main__':
    main()
