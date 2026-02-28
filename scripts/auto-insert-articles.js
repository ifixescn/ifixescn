import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误: 缺少Supabase环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 解析SQL INSERT语句
function parseInsertStatement(sql) {
  // 提取VALUES部分
  const valuesMatch = sql.match(/VALUES\s*\((.*)\);/s);
  if (!valuesMatch) return null;
  
  const valuesStr = valuesMatch[1];
  
  // 简单的值提取（处理单引号包裹的字符串）
  const values = [];
  let current = '';
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < valuesStr.length; i++) {
    const char = valuesStr[i];
    
    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      current += char;
      continue;
    }
    
    if (char === "'" && !escapeNext) {
      if (inString) {
        // 检查是否是转义的单引号 ''
        if (valuesStr[i + 1] === "'") {
          current += "'";
          i++; // 跳过下一个单引号
          continue;
        }
        inString = false;
      } else {
        inString = true;
      }
      continue;
    }
    
    if (char === ',' && !inString) {
      values.push(current.trim());
      current = '';
      continue;
    }
    
    current += char;
  }
  
  if (current.trim()) {
    values.push(current.trim());
  }
  
  // 清理值
  const cleanedValues = values.map(v => {
    v = v.trim();
    // 移除NOW()等函数调用
    if (v === 'NOW()') return new Date().toISOString();
    return v;
  });
  
  if (cleanedValues.length < 10) return null;
  
  return {
    title: cleanedValues[0],
    slug: cleanedValues[1],
    content: cleanedValues[2],
    excerpt: cleanedValues[3],
    cover_image: cleanedValues[4],
    category_id: cleanedValues[5],
    author_id: cleanedValues[6],
    status: cleanedValues[7],
    view_count: parseInt(cleanedValues[8]) || 100,
    language: cleanedValues[9],
    published_at: cleanedValues[10] || new Date().toISOString()
  };
}

// 使用RPC函数插入文章数据（绕过RLS）
async function insertArticle(articleData) {
  try {
    const { data, error } = await supabase.rpc('batch_insert_articles', {
      p_title: articleData.title,
      p_slug: articleData.slug,
      p_content: articleData.content,
      p_excerpt: articleData.excerpt,
      p_cover_image: articleData.cover_image,
      p_category_id: articleData.category_id,
      p_author_id: articleData.author_id,
      p_status: articleData.status,
      p_view_count: articleData.view_count,
      p_language: articleData.language
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('=' .repeat(70));
  console.log('自动插入剩余99篇手机维修文章');
  console.log('=' .repeat(70));
  console.log();
  
  // 读取所有批次文件
  const batchFiles = [];
  for (let i = 2; i <= 21; i++) {
    const filename = `insert_batch_${i.toString().padStart(2, '0')}.sql`;
    if (fs.existsSync(filename)) {
      batchFiles.push(filename);
    }
  }
  
  console.log(`找到 ${batchFiles.length} 个批次文件\n`);
  console.log('开始插入文章...\n');
  
  let successCount = 0;
  let failCount = 0;
  let totalArticles = 0;
  
  for (const filename of batchFiles) {
    console.log(`\n处理 ${filename}...`);
    
    const content = fs.readFileSync(filename, 'utf8');
    
    // 分割成单独的INSERT语句
    const statements = content.split(/\n\n-- 文章 \d+\n/).filter(s => s.trim().startsWith('INSERT'));
    
    console.log(`  包含 ${statements.length} 篇文章`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      totalArticles++;
      
      process.stdout.write(`  [${totalArticles}/99] 插入中... `);
      
      // 解析SQL语句
      const articleData = parseInsertStatement(stmt);
      
      if (!articleData) {
        console.log('❌ 解析失败');
        failCount++;
        continue;
      }
      
      // 插入文章
      const result = await insertArticle(articleData);
      
      if (result.success) {
        successCount++;
        console.log('✅');
      } else {
        failCount++;
        console.log(`❌ ${result.error.substring(0, 50)}`);
      }
      
      // 添加延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  console.log();
  console.log('=' .repeat(70));
  console.log('执行完成！');
  console.log('=' .repeat(70));
  console.log(`✅ 成功: ${successCount} 篇`);
  console.log(`❌ 失败: ${failCount} 篇`);
  console.log();
  
  // 验证总数
  const { count, error } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('language', 'en');
  
  if (!error) {
    console.log(`📊 数据库中英文文章总数: ${count}`);
  }
}

main().catch(console.error);
