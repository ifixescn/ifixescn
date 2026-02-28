#!/usr/bin/env node

/**
 * 完整模拟iFixit解析器逻辑
 */

import { readFileSync } from 'fs';

const html = readFileSync('/tmp/ifixit-with-cookie.html', 'utf-8');

console.log('📄 开始解析iFixit页面，HTML长度:', html.length, '\n');

try {
  // 1. 提取标题
  console.log('=== 1. 提取标题 ===');
  const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  
  if (!title) {
    console.error('❌ 未找到标题');
    process.exit(1);
  }
  
  console.log('✅ 标题:', title, '\n');
  
  // 2. 提取简介
  console.log('=== 2. 提取简介 ===');
  let introduction = '';
  
  const introPatterns = [
    { name: 'guide-introduction class', regex: /<div[^>]*class="[^"]*guide-introduction[^"]*"[^>]*>([\s\S]*?)<\/div>/i },
    { name: 'guideIntroduction id', regex: /<div[^>]*id="guideIntroduction"[^>]*>([\s\S]*?)<\/div>/i },
    { name: 'introHtml JSON', regex: /"introHtml\\?":\\?"((?:[^"\\]|\\.)*)\\?"/i }
  ];
  
  for (const pattern of introPatterns) {
    const match = html.match(pattern.regex);
    if (match) {
      introduction = match[1]
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\//g, '/')
        .substring(0, 200);
      console.log(`✅ 找到简介 (${pattern.name}):`, introduction);
      break;
    } else {
      console.log(`  - ${pattern.name}: 未找到`);
    }
  }
  
  if (!introduction) {
    console.log('⚠️  未找到简介，继续...\n');
  } else {
    console.log('');
  }
  
  // 3. 提取封面图
  console.log('=== 3. 提取封面图 ===');
  let coverImage = '';
  
  const coverPatterns = [
    { name: 'mainImageUrlFull JSON', regex: /"mainImageUrlFull\\?":\\?"((?:[^"\\]|\\.)*)\\?"/i },
    { name: 'guide-image class', regex: /<img[^>]*class="[^"]*guide-image[^"]*"[^>]*src="([^"]+)"/i },
    { name: 'guide-image id', regex: /<img[^>]*id="guide-image"[^>]*src="([^"]+)"/i }
  ];
  
  for (const pattern of coverPatterns) {
    const match = html.match(pattern.regex);
    if (match) {
      coverImage = match[1].replace(/\\\//g, '/');
      console.log(`✅ 找到封面图 (${pattern.name}):`, coverImage.substring(0, 80));
      break;
    } else {
      console.log(`  - ${pattern.name}: 未找到`);
    }
  }
  
  // 使用第一张步骤图片作为封面
  if (!coverImage) {
    const firstImgMatch = html.match(/<img[^>]+class="[^"]*stepImage[^"]*"[^>]+src="([^"]+)"/i);
    if (firstImgMatch) {
      coverImage = firstImgMatch[1];
      console.log('✅ 使用第一张步骤图片作为封面:', coverImage.substring(0, 80));
    }
  }
  
  console.log('');
  
  // 4. 提取步骤
  console.log('=== 4. 提取步骤 ===');
  const steps = [];
  
  const stepLinesRegex = /<ul[^>]*class="step-lines"[^>]*>([\s\S]*?)<\/ul>/gi;
  let stepMatch;
  let stepNumber = 1;
  
  while ((stepMatch = stepLinesRegex.exec(html)) !== null) {
    const stepContent = stepMatch[1];
    
    // 提取说明行
    const lines = [];
    const lineRegex = /<p\s+itemprop="text">(.*?)<\/p>/gi;
    let lineMatch;
    
    while ((lineMatch = lineRegex.exec(stepContent)) !== null) {
      const lineText = lineMatch[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#039;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .trim();
      
      if (lineText) {
        lines.push(lineText);
      }
    }
    
    if (lines.length > 0) {
      steps.push({
        stepNumber,
        lines
      });
      stepNumber++;
    }
  }
  
  console.log('✅ 提取到步骤数:', steps.length);
  console.log('✅ 总说明行数:', steps.reduce((sum, s) => sum + s.lines.length, 0));
  
  if (steps.length === 0) {
    console.error('❌ 未找到任何步骤内容');
    process.exit(1);
  }
  
  // 显示前3个步骤
  console.log('\n前3个步骤示例:');
  for (let i = 0; i < Math.min(3, steps.length); i++) {
    const step = steps[i];
    console.log(`\n步骤 ${step.stepNumber}:`);
    console.log(`  说明行数: ${step.lines.length}`);
    if (step.lines.length > 0) {
      console.log(`  第一行: ${step.lines[0].substring(0, 80)}...`);
    }
  }
  
  // 5. 生成HTML内容
  console.log('\n=== 5. 生成HTML内容 ===');
  let htmlContent = '<div class="guide-steps">\n';
  
  for (const step of steps) {
    htmlContent += `<div class="step" id="step-${step.stepNumber}">\n`;
    htmlContent += `<h2>Step ${step.stepNumber}</h2>\n`;
    htmlContent += '<div class="step-lines">\n<ul>\n';
    for (const line of step.lines) {
      htmlContent += `<li>${line}</li>\n`;
    }
    htmlContent += '</ul>\n</div>\n';
    htmlContent += '</div>\n\n';
  }
  
  htmlContent += '</div>\n';
  
  console.log('✅ HTML内容长度:', htmlContent.length);
  console.log('✅ HTML内容预览（前500字符）:');
  console.log(htmlContent.substring(0, 500));
  
  console.log('\n=== ✅ 解析成功！ ===');
  console.log('标题:', title);
  console.log('步骤数:', steps.length);
  console.log('内容长度:', htmlContent.length);
  console.log('封面图:', coverImage ? '有' : '无');
  
} catch (error) {
  console.error('\n❌ 解析失败:', error.message);
  console.error(error.stack);
  process.exit(1);
}
