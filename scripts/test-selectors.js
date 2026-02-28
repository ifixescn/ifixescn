#!/usr/bin/env node

/**
 * 测试CSS选择器
 * 使用deno_dom解析HTML并测试选择器
 */

import { readFileSync } from 'fs';

// 简单的DOM解析器模拟
const html = readFileSync('/tmp/ifixit-with-cookie.html', 'utf-8');

console.log('📄 HTML文件大小:', html.length, '字节');
console.log('\n🔍 测试CSS选择器...\n');

// 测试h1选择器
const h1Regex = /<h1[^>]*>(.*?)<\/h1>/gi;
const h1Matches = html.match(h1Regex);
if (h1Matches) {
  console.log('✅ h1选择器:');
  h1Matches.forEach((match, index) => {
    const text = match.replace(/<[^>]+>/g, '').trim();
    console.log(`  ${index + 1}. ${text}`);
  });
} else {
  console.log('❌ h1选择器: 未找到');
}

// 测试#content选择器
const contentRegex = /<div[^>]*id="content"[^>]*>([\s\S]*?)<\/div>/i;
const contentMatch = html.match(contentRegex);
if (contentMatch) {
  console.log('\n✅ #content选择器: 找到');
  console.log('  内容长度:', contentMatch[1].length, '字节');
  console.log('  内容预览:', contentMatch[1].substring(0, 200).replace(/\s+/g, ' '));
} else {
  console.log('\n❌ #content选择器: 未找到');
}

// 测试#main选择器
const mainRegex = /<div[^>]*id="main"[^>]*>([\s\S]*?)<\/div>/i;
const mainMatch = html.match(mainRegex);
if (mainMatch) {
  console.log('\n✅ #main选择器: 找到');
  console.log('  内容长度:', mainMatch[1].length, '字节');
} else {
  console.log('\n❌ #main选择器: 未找到');
}

// 测试.step-content选择器
const stepContentRegex = /<div[^>]*class="[^"]*step-content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
const stepContentMatches = html.match(stepContentRegex);
if (stepContentMatches) {
  console.log('\n✅ .step-content选择器: 找到', stepContentMatches.length, '个');
  console.log('  第一个内容长度:', stepContentMatches[0].length, '字节');
} else {
  console.log('\n❌ .step-content选择器: 未找到');
}

// 查找所有可能的内容容器
console.log('\n🔍 查找可能的内容容器...\n');

const containerPatterns = [
  { name: 'div#content', regex: /<div[^>]*id="content"/i },
  { name: 'div#main', regex: /<div[^>]*id="main"/i },
  { name: 'div#mainBody', regex: /<div[^>]*id="mainBody"/i },
  { name: 'div.guide-content', regex: /<div[^>]*class="[^"]*guide-content/i },
  { name: 'article', regex: /<article/i },
  { name: 'main', regex: /<main/i }
];

containerPatterns.forEach(({ name, regex }) => {
  if (regex.test(html)) {
    console.log(`✅ ${name}: 存在`);
  } else {
    console.log(`❌ ${name}: 不存在`);
  }
});

// 推荐的选择器
console.log('\n💡 推荐的选择器配置:\n');
console.log('title_selector: "h1"');
console.log('content_selector: "#content" 或 "#mainBody"');
console.log('cover_image_selector: "img[src*=\\"guide\\"], img[src*=\\"igi\\"]"');
