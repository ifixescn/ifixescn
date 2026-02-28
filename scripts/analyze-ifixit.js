#!/usr/bin/env node

/**
 * iFixit页面结构分析脚本
 * 用于分析页面HTML结构，找到正确的CSS选择器
 */

import https from 'https';
import { readFileSync, writeFileSync } from 'fs';

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

const TARGET_URL = 'https://www.ifixit.com/Guide/iPhone+11+Battery+Replacement/127450';

console.log('🔍 开始分析iFixit页面结构...');
console.log('📄 目标URL:', TARGET_URL);

// 解析URL
const url = new URL(SUPABASE_URL);
const functionPath = '/functions/v1/proxy-page';

// 调用proxy-page获取页面内容
const requestData = JSON.stringify({
  url: TARGET_URL
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
    console.log('✅ 页面获取完成！');
    console.log('📊 响应状态:', res.statusCode);
    
    if (res.statusCode === 200) {
      // 保存HTML到文件
      writeFileSync('/tmp/ifixit-page.html', data, 'utf-8');
      console.log('💾 HTML已保存到: /tmp/ifixit-page.html');
      
      // 分析HTML结构
      console.log('\n🔍 分析页面结构...\n');
      
      // 查找标题
      const titleMatches = [
        { pattern: /<h1[^>]*class="[^"]*guidetitle[^"]*"[^>]*>(.*?)<\/h1>/gi, name: 'h1.guidetitle' },
        { pattern: /<h1[^>]*data-testid="guide-title"[^>]*>(.*?)<\/h1>/gi, name: 'h1[data-testid="guide-title"]' },
        { pattern: /<h1[^>]*itemprop="name"[^>]*>(.*?)<\/h1>/gi, name: 'h1[itemprop="name"]' },
        { pattern: /<h1[^>]*>(.*?)<\/h1>/gi, name: 'h1 (任意)' }
      ];
      
      console.log('📌 标题选择器分析:');
      titleMatches.forEach(({ pattern, name }) => {
        const matches = data.match(pattern);
        if (matches && matches.length > 0) {
          console.log(`  ✅ ${name}: 找到 ${matches.length} 个匹配`);
          console.log(`     示例: ${matches[0].substring(0, 100)}...`);
        }
      });
      
      // 查找内容区域
      const contentMatches = [
        { pattern: /<div[^>]*class="[^"]*guide-content[^"]*"[^>]*>/gi, name: 'div.guide-content' },
        { pattern: /<article[^>]*class="[^"]*guide[^"]*"[^>]*>/gi, name: 'article.guide' },
        { pattern: /<div[^>]*id="guide-content"[^>]*>/gi, name: 'div#guide-content' },
        { pattern: /<main[^>]*>/gi, name: 'main' }
      ];
      
      console.log('\n📌 内容选择器分析:');
      contentMatches.forEach(({ pattern, name }) => {
        const matches = data.match(pattern);
        if (matches && matches.length > 0) {
          console.log(`  ✅ ${name}: 找到 ${matches.length} 个匹配`);
        }
      });
      
      // 查找图片
      const imageMatches = [
        { pattern: /<img[^>]*class="[^"]*guide-image[^"]*"[^>]*>/gi, name: 'img.guide-image' },
        { pattern: /<img[^>]*itemprop="image"[^>]*>/gi, name: 'img[itemprop="image"]' },
        { pattern: /<img[^>]*data-testid="guide-image"[^>]*>/gi, name: 'img[data-testid="guide-image"]' }
      ];
      
      console.log('\n📌 图片选择器分析:');
      imageMatches.forEach(({ pattern, name }) => {
        const matches = data.match(pattern);
        if (matches && matches.length > 0) {
          console.log(`  ✅ ${name}: 找到 ${matches.length} 个匹配`);
          console.log(`     示例: ${matches[0].substring(0, 100)}...`);
        }
      });
      
      // 提取所有class名称
      const classPattern = /class="([^"]*)"/gi;
      const classes = new Set();
      let match;
      while ((match = classPattern.exec(data)) !== null) {
        match[1].split(' ').forEach(cls => {
          if (cls && (cls.includes('guide') || cls.includes('title') || cls.includes('content'))) {
            classes.add(cls);
          }
        });
      }
      
      console.log('\n📌 相关CSS类名:');
      Array.from(classes).slice(0, 20).forEach(cls => {
        console.log(`  - ${cls}`);
      });
      
      // 生成推荐的选择器配置
      console.log('\n💡 推荐的选择器配置:');
      console.log('```json');
      console.log(JSON.stringify({
        title_selector: 'h1.guidetitle, h1[data-testid="guide-title"], h1[itemprop="name"], h1',
        content_selector: 'div.guide-content, article.guide, div#guide-content, main',
        cover_image_selector: 'img.guide-image, img[itemprop="image"], img[data-testid="guide-image"]',
        excerpt_selector: 'div.guide-introduction, div.summary, p.introduction'
      }, null, 2));
      console.log('```');
      
    } else {
      console.log('❌ 获取页面失败');
      console.log('📄 响应内容:', data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ 请求失败:', error.message);
  process.exit(1);
});

req.write(requestData);
req.end();

console.log('\n⏳ 正在获取页面，请稍候...\n');
