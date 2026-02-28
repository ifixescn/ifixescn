import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLFile() {
  console.log('读取SQL文件...\n');
  
  const sqlContent = fs.readFileSync('insert-phone-repair-articles.sql', 'utf8');
  
  // 分割SQL语句
  const statements = sqlContent
    .split('\n')
    .filter(line => line.trim().startsWith('INSERT INTO'))
    .map(line => line.trim());

  console.log(`找到 ${statements.length} 条INSERT语句\n`);

  let successCount = 0;
  let failCount = 0;

  // 分批执行，每批10条
  for (let i = 0; i < statements.length; i += 10) {
    const batch = statements.slice(i, Math.min(i + 10, statements.length));
    const batchSQL = batch.join('\n');

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: batchSQL });
      
      if (error) {
        console.error(`批次 ${Math.floor(i / 10) + 1} 失败:`, error.message);
        failCount += batch.length;
      } else {
        successCount += batch.length;
        console.log(`已成功插入 ${successCount} 篇文章...`);
      }
    } catch (error) {
      console.error(`批次 ${Math.floor(i / 10) + 1} 执行出错:`, error.message);
      failCount += batch.length;
    }

    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n执行完成！');
  console.log(`成功: ${successCount} 篇`);
  console.log(`失败: ${failCount} 篇`);
}

executeSQLFile().catch(console.error);
