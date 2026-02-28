#!/usr/bin/env node

/**
 * 测试iFixit解析器
 */

import { readFileSync } from 'fs';

const html = readFileSync('/tmp/ifixit-with-cookie.html', 'utf-8');

console.log('📄 HTML文件大小:', html.length, '字节\n');

// 1. 测试标题提取
console.log('=== 测试标题提取 ===');
const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
if (titleMatch) {
  console.log('✅ 标题:', titleMatch[1].trim());
} else {
  console.log('❌ 未找到标题');
}

// 2. 测试简介提取
console.log('\n=== 测试简介提取 ===');
const introMatch = html.match(/"introHtml":"(.*?)"/s);
if (introMatch) {
  const intro = introMatch[1]
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .substring(0, 200);
  console.log('✅ 简介（前200字符）:', intro);
} else {
  console.log('❌ 未找到简介');
}

// 3. 测试封面图提取
console.log('\n=== 测试封面图提取 ===');
const coverMatch = html.match(/"mainImageUrlFull":"(.*?)"/i);
if (coverMatch) {
  const cover = coverMatch[1].replace(/\\\//g, '/');
  console.log('✅ 封面图:', cover);
} else {
  console.log('❌ 未找到封面图');
}

// 4. 测试步骤提取
console.log('\n=== 测试步骤提取 ===');

// 方法1: 使用step-container
const stepRegex1 = /<div[^>]*class="[^"]*step-container[^"]*"[^>]*>/gi;
const stepMatches1 = html.match(stepRegex1);
console.log('方法1 (step-container):', stepMatches1 ? stepMatches1.length : 0, '个');

// 方法2: 使用step-lines
const stepRegex2 = /<ul[^>]*class="step-lines"[^>]*>/gi;
const stepMatches2 = html.match(stepRegex2);
console.log('方法2 (step-lines):', stepMatches2 ? stepMatches2.length : 0, '个');

// 5. 测试步骤内容提取
console.log('\n=== 测试步骤内容提取 ===');
const lineRegex = /<p\s+itemprop="text">(.*?)<\/p>/gi;
const lineMatches = html.match(lineRegex);
console.log('找到', lineMatches ? lineMatches.length : 0, '行步骤说明');

if (lineMatches && lineMatches.length > 0) {
  console.log('\n前3行示例:');
  for (let i = 0; i < Math.min(3, lineMatches.length); i++) {
    const text = lineMatches[i]
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#039;/g, "'")
      .trim();
    console.log(`  ${i + 1}. ${text.substring(0, 100)}`);
  }
}

// 6. 测试图片提取
console.log('\n=== 测试图片提取 ===');
const imgRegex = /<img[^>]+class="[^"]*stepImage[^"]*"[^>]+src="([^"]+)"/gi;
let imgCount = 0;
let imgMatch;
const images = [];

while ((imgMatch = imgRegex.exec(html)) !== null) {
  const imgUrl = imgMatch[1];
  if (imgUrl && !imgUrl.includes('spinner.gif')) {
    imgCount++;
    if (images.length < 3) {
      images.push(imgUrl);
    }
  }
}

console.log('找到', imgCount, '张图片');
if (images.length > 0) {
  console.log('\n前3张图片:');
  images.forEach((img, i) => {
    console.log(`  ${i + 1}. ${img.substring(0, 80)}...`);
  });
}

// 7. 测试完整步骤提取
console.log('\n=== 测试完整步骤提取 ===');

// 找到所有step-lines容器
const stepLinesRegex = /<ul[^>]*class="step-lines"[^>]*>([\s\S]*?)<\/ul>/gi;
let stepLinesMatch;
let stepNum = 0;

while ((stepLinesMatch = stepLinesRegex.exec(html)) !== null) {
  stepNum++;
  const stepContent = stepLinesMatch[1];
  
  // 提取这个步骤的所有行
  const lines = [];
  const lineRegex2 = /<p\s+itemprop="text">(.*?)<\/p>/gi;
  let lineMatch2;
  
  while ((lineMatch2 = lineRegex2.exec(stepContent)) !== null) {
    const text = lineMatch2[1]
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#039;/g, "'")
      .trim();
    if (text) {
      lines.push(text);
    }
  }
  
  if (stepNum <= 2) {
    console.log(`\n步骤 ${stepNum}:`);
    console.log(`  - 说明行数: ${lines.length}`);
    if (lines.length > 0) {
      console.log(`  - 第一行: ${lines[0].substring(0, 80)}...`);
    }
  }
}

console.log(`\n总共找到 ${stepNum} 个步骤`);

// 8. 推荐的解析策略
console.log('\n=== 推荐的解析策略 ===');
console.log('1. 使用 <ul class="step-lines"> 定位步骤容器');
console.log('2. 在每个容器内使用 <p itemprop="text"> 提取说明');
console.log('3. 使用 <img class="stepImage"> 提取图片');
console.log('4. 标题、简介、封面图从JSON数据中提取');
