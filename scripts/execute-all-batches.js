import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误: 缺少Supabase环境变量');
  console.error('请确保.env文件中包含 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLFile(filename) {
  try {
    const sql = fs.readFileSync(filename, 'utf8');
    
    // 使用Supabase的SQL执行功能
    const { data, error } = await supabase.rpc('execute_sql', { query: sql });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('=' * 70);
  console.log('批量执行所有文章插入批次');
  console.log('=' * 70);
  console.log();
  
  // 查找所有批次文件
  const batchFiles = [];
  for (let i = 2; i <= 21; i++) {
    const filename = `insert_batch_${i.toString().padStart(2, '0')}.sql`;
    if (fs.existsSync(filename)) {
      batchFiles.push(filename);
    }
  }
  
  console.log(`找到 ${batchFiles.length} 个批次文件\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const filename of batchFiles) {
    process.stdout.write(`执行 ${filename}... `);
    
    const result = await executeSQLFile(filename);
    
    if (result.success) {
      successCount++;
      console.log('✅');
    } else {
      failCount++;
      console.log(`❌ ${result.error}`);
    }
    
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log();
  console.log('=' * 70);
  console.log('执行完成！');
  console.log('=' * 70);
  console.log(`✅ 成功: ${successCount} 个批次`);
  console.log(`❌ 失败: ${failCount} 个批次`);
  console.log();
  
  // 验证总文章数
  const { data, error } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .eq('language', 'en');
  
  if (!error && data !== null) {
    console.log(`📊 数据库中英文文章总数: ${data.length || 0}`);
  }
}

main().catch(console.error);
