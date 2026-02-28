#!/usr/bin/env node

/**
 * 直接测试iFixit页面获取
 * 模拟Edge Function的cookie处理逻辑
 */

import https from 'https';
import { writeFileSync } from 'fs';

const TARGET_URL = 'https://www.ifixit.com/Guide/iPhone+11+Battery+Replacement/127450';

console.log('🔍 测试iFixit页面获取（带cookie处理）...');
console.log('📄 目标URL:', TARGET_URL);

// 第一次请求
function makeRequest(url, cookies = []) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    };

    if (cookies.length > 0) {
      options.headers['Cookie'] = cookies.join('; ');
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ data, statusCode: res.statusCode, headers: res.headers });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  try {
    // 第一次请求
    console.log('\n📡 第一次请求...');
    const response1 = await makeRequest(TARGET_URL);
    console.log('状态码:', response1.statusCode);
    console.log('内容长度:', response1.data.length);
    
    // 检查是否有cookie设置脚本
    if (response1.data.includes('document.cookie') && response1.data.includes('window.location.reload')) {
      console.log('\n🍪 检测到cookie验证机制！');
      
      // 提取cookie
      const cookieMatch = response1.data.match(/document\.cookie\s*=\s*"([^"]+)"/);
      if (cookieMatch) {
        const cookieStr = cookieMatch[1];
        const cookieParts = cookieStr.split(';')[0];
        console.log('提取到cookie:', cookieParts);
        
        // 等待2秒
        console.log('\n⏳ 等待2秒后重试...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 第二次请求（带cookie）
        console.log('\n📡 第二次请求（带cookie）...');
        const response2 = await makeRequest(TARGET_URL, [cookieParts]);
        console.log('状态码:', response2.statusCode);
        console.log('内容长度:', response2.data.length);
        
        // 保存HTML
        writeFileSync('/tmp/ifixit-with-cookie.html', response2.data, 'utf-8');
        console.log('💾 HTML已保存到: /tmp/ifixit-with-cookie.html');
        
        // 分析HTML结构
        console.log('\n🔍 分析页面结构...');
        
        // 查找h1标签
        const h1Matches = response2.data.match(/<h1[^>]*>(.*?)<\/h1>/gi);
        if (h1Matches) {
          console.log(`\n找到 ${h1Matches.length} 个h1标签:`);
          h1Matches.forEach((match, index) => {
            const text = match.replace(/<[^>]+>/g, '').trim();
            console.log(`  ${index + 1}. ${text.substring(0, 100)}`);
          });
        } else {
          console.log('\n❌ 未找到h1标签');
        }
        
        // 查找main标签
        const mainMatch = response2.data.match(/<main[^>]*>/i);
        if (mainMatch) {
          console.log('\n✅ 找到main标签');
        } else {
          console.log('\n❌ 未找到main标签');
        }
        
        // 查找article标签
        const articleMatch = response2.data.match(/<article[^>]*>/i);
        if (articleMatch) {
          console.log('✅ 找到article标签');
        } else {
          console.log('❌ 未找到article标签');
        }
        
        // 查找包含"guide"的class
        const guideClasses = response2.data.match(/class="[^"]*guide[^"]*"/gi);
        if (guideClasses) {
          console.log(`\n找到 ${guideClasses.length} 个包含"guide"的class:`);
          const uniqueClasses = [...new Set(guideClasses)].slice(0, 10);
          uniqueClasses.forEach(cls => {
            console.log(`  - ${cls}`);
          });
        }
        
        // 检查是否是React应用
        if (response2.data.includes('__NEXT_DATA__') || response2.data.includes('_next')) {
          console.log('\n⚠️  这是一个Next.js应用，内容可能是客户端渲染的');
        }
        
        if (response2.data.includes('id="__next"') || response2.data.includes('id="root"')) {
          console.log('⚠️  检测到React根节点，内容可能需要JavaScript渲染');
        }
        
      } else {
        console.log('❌ 无法提取cookie');
      }
    } else {
      console.log('\n✅ 没有cookie验证，直接返回内容');
      writeFileSync('/tmp/ifixit-direct.html', response1.data, 'utf-8');
      console.log('💾 HTML已保存到: /tmp/ifixit-direct.html');
    }
    
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
  }
}

main();
