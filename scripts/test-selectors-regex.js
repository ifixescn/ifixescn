import fs from 'fs';
import https from 'https';

console.log('🔍 测试新的CSS选择器（使用正则表达式）...\n');

// 从网络获取HTML
const url = 'https://www.ifixit.com/Guide/iPhone+11+Battery+Replacement/127450';

console.log('📥 正在下载页面...');

// 第一次请求（可能返回cookie验证页面）
https.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
}, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('✅ 下载完成，大小:', data.length, '字节\n');
    
    // 检查是否需要cookie
    if (data.includes('document.cookie') && data.includes('window.location.reload')) {
      console.log('⚠️  检测到cookie验证，提取cookie并重试...\n');
      
      const cookieMatch = data.match(/document\.cookie\s*=\s*"([^"]+)"/);
      if (cookieMatch) {
        const cookie = cookieMatch[1].split(';')[0];
        console.log('🍪 提取到cookie:', cookie);
        
        // 等待2秒后重试
        setTimeout(() => {
          console.log('🔄 重新请求...\n');
          
          https.get(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Cookie': cookie
            }
          }, (res2) => {
            let data2 = '';
            
            res2.on('data', (chunk) => {
              data2 += chunk;
            });
            
            res2.on('end', () => {
              console.log('✅ 第二次下载完成，大小:', data2.length, '字节\n');
              testSelectors(data2);
            });
          }).on('error', (err) => {
            console.error('❌ 第二次请求失败:', err.message);
          });
        }, 2000);
      }
    } else {
      testSelectors(data);
    }
  });
}).on('error', (err) => {
  console.error('❌ 请求失败:', err.message);
});

function testSelectors(html) {

// 测试选择器
console.log('📋 测试CSS选择器:\n');

// 1. 测试 h1.placeholder-title
console.log('1. 标题 (h1.placeholder-title):');
const titlePattern = /<h1[^>]*class="[^"]*placeholder-title[^"]*"[^>]*>(.*?)<\/h1>/is;
const titleMatch = html.match(titlePattern);
if (titleMatch) {
  const title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
  console.log('   ✅ 找到标题:', title);
} else {
  console.log('   ❌ 未找到标题');
  
  // 尝试查找所有h1
  const allH1Pattern = /<h1[^>]*>(.*?)<\/h1>/gis;
  const allH1Matches = html.match(allH1Pattern);
  if (allH1Matches) {
    console.log('   找到', allH1Matches.length, '个h1标签:');
    allH1Matches.forEach((h1, index) => {
      const text = h1.replace(/<[^>]+>/g, '').trim().substring(0, 80);
      console.log(`   h1[${index}]:`, text);
    });
  }
}
console.log('');

// 2. 测试 .stepMedia
console.log('2. 步骤媒体容器 (.stepMedia):');
const stepMediaPattern = /<div[^>]*class="[^"]*stepMedia[^"]*"[^>]*>/gi;
const stepMediaMatches = html.match(stepMediaPattern);
console.log('   找到', stepMediaMatches ? stepMediaMatches.length : 0, '个元素');
console.log('');

// 3. 测试 .step-main-media
console.log('3. 步骤主媒体 (.step-main-media):');
const stepMainMediaPattern = /<div[^>]*class="[^"]*step-main-media[^"]*"[^>]*>/gi;
const stepMainMediaMatches = html.match(stepMainMediaPattern);
console.log('   找到', stepMainMediaMatches ? stepMainMediaMatches.length : 0, '个元素');
console.log('');

// 4. 测试 .stepImage
console.log('4. 步骤图片 (.stepImage):');
const stepImagePattern = /<img[^>]*class="[^"]*stepImage[^"]*"[^>]*>/gi;
const stepImageMatches = html.match(stepImagePattern);
console.log('   找到', stepImageMatches ? stepImageMatches.length : 0, '个元素');
if (stepImageMatches && stepImageMatches.length > 0) {
  const firstImg = stepImageMatches[0];
  const srcMatch = firstImg.match(/src="([^"]+)"/);
  if (srcMatch) {
    console.log('   第一张图片:', srcMatch[1].substring(0, 80) + '...');
  }
}
console.log('');

// 5. 测试 .stepImageContainer img
console.log('5. 步骤图片容器中的img (.stepImageContainer img):');
const stepImageContainerPattern = /<div[^>]*class="[^"]*stepImageContainer[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
let stepImageContainerMatches = [];
let match;
while ((match = stepImageContainerPattern.exec(html)) !== null) {
  const imgPattern = /<img[^>]*>/gi;
  const imgs = match[1].match(imgPattern);
  if (imgs) {
    stepImageContainerMatches = stepImageContainerMatches.concat(imgs);
  }
}
console.log('   找到', stepImageContainerMatches.length, '个元素');
console.log('');

// 6. 测试 p[itemprop="text"]
console.log('6. 步骤说明文本 (p[itemprop="text"]):');
const textPattern = /<p[^>]*itemprop="text"[^>]*>(.*?)<\/p>/gis;
const textMatches = html.match(textPattern);
console.log('   找到', textMatches ? textMatches.length : 0, '个元素');
if (textMatches && textMatches.length > 0) {
  const firstText = textMatches[0].replace(/<[^>]+>/g, '').trim().substring(0, 100);
  console.log('   第一段文本:', firstText + '...');
}
console.log('');

// 总结
console.log('\n📊 总结:');
console.log('   标题:', titleMatch ? '✅ 找到' : '❌ 未找到');
console.log('   步骤媒体容器:', stepMediaMatches ? stepMediaMatches.length : 0, '个');
console.log('   步骤主媒体:', stepMainMediaMatches ? stepMainMediaMatches.length : 0, '个');
console.log('   步骤图片:', stepImageMatches ? stepImageMatches.length : 0, '个');
console.log('   图片容器中的img:', stepImageContainerMatches.length, '个');
console.log('   说明文本:', textMatches ? textMatches.length : 0, '个');

console.log('\n✅ 测试完成！');
}
