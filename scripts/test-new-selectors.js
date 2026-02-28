import fs from 'fs';
import { JSDOM } from 'jsdom';

console.log('🔍 测试新的CSS选择器...\n');

// 读取HTML文件
const html = fs.readFileSync('ifixit-page.html', 'utf-8');
console.log('📄 HTML文件大小:', html.length, '字节\n');

// 使用JSDOM解析
const dom = new JSDOM(html);
const document = dom.window.document;

// 测试选择器
const selectors = {
  'h1.placeholder-title': '标题',
  '.stepMedia': '步骤媒体容器',
  '.step-main-media': '步骤主媒体',
  '.stepImage': '步骤图片',
  '.stepImageContainer img': '步骤图片容器中的img',
  'p[itemprop="text"]': '步骤说明文本'
};

console.log('📋 测试CSS选择器:\n');

for (const [selector, description] of Object.entries(selectors)) {
  const elements = document.querySelectorAll(selector);
  console.log(`${description} (${selector}):`);
  console.log(`  找到 ${elements.length} 个元素`);
  
  if (elements.length > 0) {
    // 显示第一个元素的内容预览
    const firstElement = elements[0];
    let preview = '';
    
    if (firstElement.tagName === 'IMG') {
      preview = firstElement.src.substring(0, 80);
    } else {
      preview = firstElement.textContent.trim().substring(0, 100);
    }
    
    console.log(`  第一个元素预览: ${preview}...`);
  }
  
  console.log('');
}

// 测试组合选择器
console.log('\n📦 测试组合选择器:\n');

const titleElement = document.querySelector('h1.placeholder-title');
if (titleElement) {
  console.log('✅ 标题:', titleElement.textContent.trim());
} else {
  console.log('❌ 未找到标题');
  
  // 尝试其他h1选择器
  const h1Elements = document.querySelectorAll('h1');
  console.log('   找到', h1Elements.length, '个h1元素');
  if (h1Elements.length > 0) {
    h1Elements.forEach((h1, index) => {
      console.log(`   h1[${index}]:`, h1.textContent.trim().substring(0, 80));
      console.log(`   class:`, h1.className);
    });
  }
}

console.log('');

// 测试内容选择器
const contentElements = document.querySelectorAll('.stepMedia, .step-main-media');
console.log('✅ 内容元素数量:', contentElements.length);

// 测试图片选择器
const imageElements = document.querySelectorAll('.stepImage, .stepImageContainer img');
console.log('✅ 图片元素数量:', imageElements.length);

// 测试说明文本
const textElements = document.querySelectorAll('p[itemprop="text"]');
console.log('✅ 说明文本数量:', textElements.length);

console.log('\n✅ 测试完成！');
