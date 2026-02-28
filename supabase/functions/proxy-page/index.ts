import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()

    if (!url) {
      throw new Error('缺少URL参数')
    }

    // 验证URL格式
    let targetUrl: URL
    try {
      targetUrl = new URL(url)
    } catch (error) {
      throw new Error('无效的URL格式')
    }

    // 构建请求头，模拟真实浏览器
    const headers: HeadersInit = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0',
    }

    console.log('正在获取页面:', url)

    // 获取目标网页
    const response = await fetch(url, {
      headers,
      redirect: 'follow'
    })

    if (!response.ok) {
      throw new Error(`获取页面失败: HTTP ${response.status}`)
    }

    let html = await response.text()

    // 处理HTML，修复资源路径
    const baseUrl = targetUrl.origin
    const basePath = targetUrl.pathname.substring(0, targetUrl.pathname.lastIndexOf('/') + 1)

    // 添加base标签，让浏览器自动处理相对路径
    const baseTag = `<base href="${baseUrl}${basePath}">`
    
    // 在head标签后插入base标签
    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>${baseTag}`)
    } else if (html.includes('<HEAD>')) {
      html = html.replace('<HEAD>', `<HEAD>${baseTag}`)
    } else {
      // 如果没有head标签，在html标签后插入
      html = html.replace(/<html[^>]*>/i, (match) => `${match}<head>${baseTag}</head>`)
    }

    // 注入选择器脚本
    const selectorScript = `
      <script>
        (function() {
          // 防止页面跳转
          window.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
              e.preventDefault();
              e.stopPropagation();
            }
          }, true);

          // 防止表单提交
          window.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
          }, true);

          // 禁用所有链接
          document.addEventListener('DOMContentLoaded', function() {
            const links = document.querySelectorAll('a');
            links.forEach(link => {
              link.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
              });
            });
          });

          // 添加选择器样式
          const style = document.createElement('style');
          style.textContent = \`
            .scraper-selector-highlight {
              outline: 3px solid #3b82f6 !important;
              outline-offset: 2px !important;
              cursor: pointer !important;
              position: relative !important;
            }
            .scraper-selector-highlight::after {
              content: '点击选择此元素';
              position: absolute;
              top: -30px;
              left: 0;
              background: #3b82f6;
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              white-space: nowrap;
              z-index: 10000;
            }
          \`;
          document.head.appendChild(style);

          console.log('选择器脚本已注入');
        })();
      </script>
    `

    // 在body结束标签前插入脚本
    if (html.includes('</body>')) {
      html = html.replace('</body>', `${selectorScript}</body>`)
    } else if (html.includes('</BODY>')) {
      html = html.replace('</BODY>', `${selectorScript}</BODY>`)
    } else {
      html += selectorScript
    }

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
      },
      status: 200
    })

  } catch (error) {
    console.error('代理请求失败:', error)
    
    // 返回HTML格式的错误页面，而不是JSON
    const errorHtml = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>加载失败</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .error-container {
            text-align: center;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            max-width: 500px;
          }
          .error-icon {
            font-size: 64px;
            margin-bottom: 20px;
          }
          h1 {
            font-size: 24px;
            margin: 0 0 16px 0;
            font-weight: 600;
          }
          p {
            font-size: 16px;
            line-height: 1.6;
            margin: 0 0 24px 0;
            opacity: 0.9;
          }
          .error-details {
            background: rgba(0, 0, 0, 0.2);
            padding: 16px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            word-break: break-word;
            margin-bottom: 24px;
          }
          .suggestions {
            text-align: left;
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
          }
          .suggestions h2 {
            font-size: 18px;
            margin: 0 0 12px 0;
          }
          .suggestions ul {
            margin: 0;
            padding-left: 20px;
          }
          .suggestions li {
            margin: 8px 0;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="error-container">
          <div class="error-icon">⚠️</div>
          <h1>页面加载失败</h1>
          <p>无法加载目标网页，请检查URL是否正确或稍后重试。</p>
          <div class="error-details">
            <strong>错误信息：</strong><br>
            ${error.message || '未知错误'}
          </div>
          <div class="suggestions">
            <h2>💡 解决建议</h2>
            <ul>
              <li>确认URL格式正确（必须包含 http:// 或 https://）</li>
              <li>检查目标网站是否可以正常访问</li>
              <li>某些网站可能有严格的反爬虫机制</li>
              <li>尝试在"反爬虫配置"中启用代理</li>
              <li>如果问题持续，可以使用浏览器开发者工具手动获取选择器</li>
            </ul>
          </div>
        </div>
      </body>
      </html>
    `
    
    // 返回HTML格式的错误页面，状态码仍然是200
    return new Response(errorHtml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
      },
      status: 200  // 返回200状态码，避免前端报错
    })
  }
})
