#!/usr/bin/env python3
import os
import re
import time
from supabase import create_client, Client

# 加载环境变量
from dotenv import load_dotenv
load_dotenv()

supabase_url = os.getenv('VITE_SUPABASE_URL')
supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY')
supabase: Client = create_client(supabase_url, supabase_key)

def read_sql_file(filename):
    """读取SQL文件并提取INSERT语句"""
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 使用正则表达式提取所有INSERT语句
    pattern = r"INSERT INTO articles.*?;(?=\s*(?:INSERT INTO|$))"
    statements = re.findall(pattern, content, re.DOTALL)
    
    return statements

def execute_sql_statement(sql):
    """执行单条SQL语句"""
    try:
        # 使用Supabase的SQL执行功能
        result = supabase.rpc('exec_sql', {'sql_query': sql}).execute()
        return True, None
    except Exception as e:
        return False, str(e)

def main():
    print('开始插入100篇手机维修文章...\n')
    
    sql_file = 'insert-phone-repair-articles.sql'
    
    if not os.path.exists(sql_file):
        print(f'错误: 找不到文件 {sql_file}')
        return
    
    statements = read_sql_file(sql_file)
    print(f'找到 {len(statements)} 条INSERT语句\n')
    
    success_count = 0
    fail_count = 0
    
    for i, sql in enumerate(statements, 1):
        success, error = execute_sql_statement(sql)
        
        if success:
            success_count += 1
            if i % 10 == 0:
                print(f'已成功插入 {success_count} 篇文章...')
        else:
            fail_count += 1
            print(f'文章 {i} 插入失败: {error}')
        
        # 添加延迟避免请求过快
        time.sleep(0.2)
    
    print(f'\n执行完成！')
    print(f'成功: {success_count} 篇')
    print(f'失败: {fail_count} 篇')

if __name__ == '__main__':
    main()
