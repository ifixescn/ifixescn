#!/usr/bin/env node

/**
 * iFixit页面采集脚本
 * 用于采集指定的iFixit指南页面到文章系统
 */

import https from 'https';
import { readFileSync } from 'fs';

// 读取.env文件
let SUPABASE_URL = '';
let SUPABASE_ANON_KEY = '';

try {
  const envContent = readFileSync('.env', 'utf-8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      SUPABASE_URL = line.split('=')[1].trim();
    }
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      SUPABASE_ANON_KEY = line.split('=')[1].trim();
    }
  }
} catch (error) {
  console.error('❌ 无法读取.env文件:', error.message);
  process.exit(1);
}

// 采集配置
const RULE_ID = 'b04bc7d9-d48e-4adb-a7f8-d5b418242e3a';
const TARGET_URL = 'https://www.ifixit.com/Guide/iPhone+11+Battery+Replacement/127450';

console.log('🚀 开始采集iFixit页面...');
console.log('📄 目标URL:', TARGET_URL);
console.log('📋 规则ID:', RULE_ID);
console.log('🔗 Supabase URL:', SUPABASE_URL);

// 解析URL
const url = new URL(SUPABASE_URL);
const functionPath = '/functions/v1/article-scraper-enhanced';

// 调用Edge Function
const requestData = JSON.stringify({
  ruleId: RULE_ID,
  targetUrl: TARGET_URL
});

const options = {
  hostname: url.hostname,
  port: url.port || 443,
  path: url.pathname + functionPath,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(requestData),
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\n✅ 采集完成！');
    console.log('📊 响应状态:', res.statusCode);
    
    try {
      const result = JSON.parse(data);
      console.log('📝 采集结果:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('\n🎉 文章已成功采集！');
        console.log('📌 文章ID:', result.articleId);
        console.log('📌 标题:', result.title);
      } else {
        console.log('\n❌ 采集失败:', result.error);
      }
    } catch (error) {
      console.log('📄 原始响应:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ 请求失败:', error.message);
  process.exit(1);
});

req.write(requestData);
req.end();

console.log('\n⏳ 正在采集中，请稍候...');
