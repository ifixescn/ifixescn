import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts'
import { 
  parseIFixitGuide, 
  convertToHTML, 
  extractAllImages, 
  generateExcerpt 
} from './ifixit-parser.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 常用浏览器User-Agent池
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
]

// 随机延迟函数（模拟人类行为）
function randomDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min
  return new Promise(resolve => setTimeout(resolve, delay))
}

// 获取随机User-Agent
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

// 构建请求头（模拟真实浏览器）
function buildHeaders(url: string, config: any): HeadersInit {
  const urlObj = new URL(url)
  const headers: HeadersInit = {
    'User-Agent': config.user_agent || getRandomUserAgent(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
  }

  // 添加Referer（如果启用）
  if (config.use_referer) {
    headers['Referer'] = urlObj.origin
  }

  // 添加自定义Headers
  if (config.custom_headers) {
    Object.assign(headers, config.custom_headers)
  }

  return headers
}

// 带重试的请求函数（支持cookie处理）
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retryTimes: number = 3,
  retryDelay: number = 5000,
  cookies: string[] = []
): Promise<{ response: Response, text: string }> {
  let lastError: Error | null = null
  let currentCookies = [...cookies]

  for (let i = 0; i < retryTimes; i++) {
    try {
      // 添加cookie到请求头
      const headers = new Headers(options.headers)
      if (currentCookies.length > 0) {
        headers.set('Cookie', currentCookies.join('; '))
        console.log('使用Cookie:', currentCookies.join('; '))
      }
      
      const response = await fetch(url, {
        ...options,
        headers
      })
      
      // 获取响应文本
      const responseText = await response.text()
      console.log('响应长度:', responseText.length)
      
      // 检测cookie设置脚本（iFixit反爬虫机制）
      if (responseText.includes('document.cookie') && responseText.includes('window.location.reload')) {
        console.log('检测到cookie验证机制，提取cookie并重试...')
        
        // 提取cookie设置
        const cookieMatch = responseText.match(/document\.cookie\s*=\s*"([^"]+)"/)
        if (cookieMatch) {
          const cookieStr = cookieMatch[1]
          console.log('提取到cookie:', cookieStr)
          
          // 解析cookie（只取name=value部分）
          const cookieParts = cookieStr.split(';')[0]
          currentCookies.push(cookieParts)
          
          // 等待一下再重试（模拟浏览器行为）
          console.log('等待2秒后重试...')
          await randomDelay(2000, 3000)
          
          // 重新请求（带cookie）
          const retryHeaders = new Headers(options.headers)
          retryHeaders.set('Cookie', currentCookies.join('; '))
          console.log('重试请求，Cookie:', currentCookies.join('; '))
          
          const retryResponse = await fetch(url, {
            ...options,
            headers: retryHeaders
          })
          
          const retryText = await retryResponse.text()
          console.log('重试响应长度:', retryText.length)
          
          // 返回重试后的结果
          return {
            response: retryResponse,
            text: retryText
          }
        }
      }
      
      // 如果是429（请求过多），等待更长时间
      if (response.status === 429) {
        const waitTime = retryDelay * (i + 1) * 2
        console.log(`收到429状态码，等待${waitTime}ms后重试...`)
        await randomDelay(waitTime, waitTime + 2000)
        continue
      }

      // 如果是5xx错误，重试
      if (response.status >= 500) {
        console.log(`收到${response.status}状态码，重试中...`)
        await randomDelay(retryDelay, retryDelay + 2000)
        continue
      }

      // 返回正常结果
      return {
        response,
        text: responseText
      }
    } catch (error) {
      lastError = error as Error
      console.error(`请求失败（第${i + 1}次尝试）:`, error)
      
      if (i < retryTimes - 1) {
        await randomDelay(retryDelay, retryDelay + 2000)
      }
    }
  }

  throw lastError || new Error('请求失败')
}

// 记录请求日志
async function logRequest(
  supabase: any,
  ruleId: string,
  url: string,
  statusCode: number | null,
  responseTime: number,
  userAgent: string,
  success: boolean,
  errorMessage: string | null = null
) {
  try {
    await supabase.from('scraper_request_logs').insert({
      rule_id: ruleId,
      url,
      status_code: statusCode,
      response_time: responseTime,
      user_agent: userAgent,
      success,
      error_message: errorMessage
    })
  } catch (error) {
    console.error('记录请求日志失败:', error)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const { ruleId, targetUrl } = await req.json()

    if (!ruleId) {
      throw new Error('缺少采集规则ID')
    }

    // 获取采集规则
    const { data: rule, error: ruleError } = await supabaseClient
      .from('scraper_rules')
      .select('*')
      .eq('id', ruleId)
      .single()

    if (ruleError || !rule) {
      throw new Error('采集规则不存在')
    }

    // 检查频率限制
    const { data: canProceed } = await supabaseClient
      .rpc('check_scraper_rate_limit', { rule_uuid: ruleId })

    if (!canProceed) {
      throw new Error('请求频率超限，请稍后再试')
    }

    // 更新请求计数
    await supabaseClient.rpc('update_scraper_request_count', { rule_uuid: ruleId })

    const urlToScrape = targetUrl || rule.source_url
    const antiScrapingConfig = rule.anti_scraping_config || {}
    const proxyConfig = rule.proxy_config || {}

    // 随机延迟（模拟人类行为）
    const delayMin = antiScrapingConfig.delay_min || 2000
    const delayMax = antiScrapingConfig.delay_max || 5000
    console.log(`随机延迟 ${delayMin}-${delayMax}ms...`)
    await randomDelay(delayMin, delayMax)

    // 创建采集历史记录
    const { data: history, error: historyError } = await supabaseClient
      .from('scraper_history')
      .insert({
        rule_id: ruleId,
        source_url: urlToScrape,
        status: 'processing'
      })
      .select()
      .single()

    if (historyError) {
      throw new Error('创建采集历史失败')
    }

    try {
      // 构建请求头
      const headers = buildHeaders(urlToScrape, antiScrapingConfig)
      const userAgent = headers['User-Agent'] as string

      console.log('开始请求:', urlToScrape)
      console.log('User-Agent:', userAgent)

      // 发送请求（带重试和cookie处理）
      const requestStartTime = Date.now()
      const { response, text: html } = await fetchWithRetry(
        urlToScrape,
        {
          headers,
          redirect: 'follow'
        },
        antiScrapingConfig.retry_times || 3,
        antiScrapingConfig.retry_delay || 5000
      )

      const responseTime = Date.now() - requestStartTime

      if (!response.ok) {
        await logRequest(
          supabaseClient,
          ruleId,
          urlToScrape,
          response.status,
          responseTime,
          userAgent,
          false,
          `HTTP ${response.status}`
        )
        throw new Error(`获取网页失败: ${response.status}`)
      }

      // 记录成功的请求
      await logRequest(
        supabaseClient,
        ruleId,
        urlToScrape,
        response.status,
        responseTime,
        userAgent,
        true
      )

      console.log('HTML长度:', html.length)
      console.log('HTML前1000字符:', html.substring(0, 1000))
      
      // 检测是否为iFixit页面
      const isIFixit = urlToScrape.includes('ifixit.com')
      console.log('是否为iFixit页面:', isIFixit)
      
      let scrapedData: any = {
        title: '',
        content: '',
        source_url: urlToScrape,
        source_name: rule.source_name
      }
      
      if (isIFixit) {
        // 使用iFixit专用解析器
        console.log('使用iFixit专用解析器...')
        
        try {
          const guide = parseIFixitGuide(html)
          
          if (guide && guide.title && guide.steps.length > 0) {
            console.log('✅ iFixit解析成功')
            console.log('  - 标题:', guide.title)
            console.log('  - 步骤数:', guide.steps.length)
            console.log('  - 封面图:', guide.coverImage ? '有' : '无')
            
            // 填充数据
            scrapedData.title = guide.title
            scrapedData.content = convertToHTML(guide)
            scrapedData.excerpt = generateExcerpt(guide)
            scrapedData.cover_image = guide.coverImage
            
            console.log('  - 内容长度:', scrapedData.content.length)
          } else {
            console.log('⚠️ iFixit解析器返回空结果')
            console.log('  - guide对象:', guide ? '存在' : 'null')
            if (guide) {
              console.log('  - guide.title:', guide.title || '空')
              console.log('  - guide.steps.length:', guide.steps.length)
            }
            
            // 尝试最简单的提取方法
            console.log('尝试最简单的提取方法...')
            
            // 提取标题
            const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
            if (h1Match) {
              scrapedData.title = h1Match[1].trim()
              console.log('  - 简单方法提取到标题:', scrapedData.title)
            }
            
            // 提取所有文本内容
            const textMatches = html.match(/<p\s+itemprop="text"[^>]*>([^<]+)<\/p>/gi)
            if (textMatches && textMatches.length > 0) {
              let content = '<div class="guide-content">\n'
              textMatches.forEach((match, index) => {
                const text = match.replace(/<[^>]+>/g, '').trim()
                if (text) {
                  content += `<p>${text}</p>\n`
                }
              })
              content += '</div>'
              scrapedData.content = content
              console.log('  - 简单方法提取到', textMatches.length, '段文本')
            }
            
            // 如果还是没有内容，使用整个body
            if (!scrapedData.content || scrapedData.content.length < 200) {
              console.log('  - 使用整个body作为内容')
              const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
              if (bodyMatch) {
                scrapedData.content = bodyMatch[1]
              }
            }
          }
        } catch (parseError) {
          console.error('iFixit解析器异常:', parseError)
          console.error('异常类型:', parseError instanceof Error ? parseError.name : typeof parseError)
          console.error('异常消息:', parseError instanceof Error ? parseError.message : String(parseError))
          
          // 最后的回退：使用最基本的提取
          const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
          if (h1Match) {
            scrapedData.title = h1Match[1].trim()
          }
          
          const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
          if (bodyMatch) {
            scrapedData.content = bodyMatch[1]
          }
        }
        
      } else {
        // 使用通用DOM解析器
        console.log('使用通用DOM解析器...')
        const doc = new DOMParser().parseFromString(html, 'text/html')

        if (!doc) {
          throw new Error('解析HTML失败')
        }

        console.log('DOM解析成功')

        // 提取标题
        console.log('尝试提取标题，选择器:', rule.title_selector)
        const titleElement = doc.querySelector(rule.title_selector)
        console.log('标题元素:', titleElement ? '找到' : '未找到')
        if (titleElement) {
          scrapedData.title = titleElement.textContent?.trim() || ''
          console.log('提取到标题:', scrapedData.title)
        }

        // 提取内容
        console.log('尝试提取内容，选择器:', rule.content_selector)
        const contentElement = doc.querySelector(rule.content_selector)
        console.log('内容元素:', contentElement ? '找到' : '未找到')
        if (contentElement) {
          scrapedData.content = contentElement.innerHTML || ''
          console.log('内容长度:', scrapedData.content.length)
        }
        
        // 提取摘要
        if (rule.excerpt_selector) {
          const excerptElement = doc.querySelector(rule.excerpt_selector)
          if (excerptElement) {
            scrapedData.excerpt = excerptElement.textContent?.trim()
          }
        }

        // 提取封面图
        if (rule.cover_image_selector) {
          const coverElement = doc.querySelector(rule.cover_image_selector)
          if (coverElement) {
            scrapedData.cover_image = coverElement.getAttribute('src') || ''
            if (scrapedData.cover_image && !scrapedData.cover_image.startsWith('http')) {
              const baseUrl = new URL(urlToScrape)
              scrapedData.cover_image = new URL(scrapedData.cover_image, baseUrl.origin).href
            }
          }
        }

        // 提取作者
        if (rule.author_selector) {
          const authorElement = doc.querySelector(rule.author_selector)
          if (authorElement) {
            scrapedData.author = authorElement.textContent?.trim()
          }
        }

        // 提取发布日期
        if (rule.publish_date_selector) {
          const dateElement = doc.querySelector(rule.publish_date_selector)
          if (dateElement) {
            scrapedData.publish_date = dateElement.textContent?.trim()
          }
        }
      }

      // 验证必要字段
      console.log('验证提取结果...')
      console.log('  - 标题:', scrapedData.title ? `"${scrapedData.title.substring(0, 50)}"` : '空')
      console.log('  - 内容长度:', scrapedData.content ? scrapedData.content.length : 0)
      
      if (!scrapedData.title || !scrapedData.content) {
        throw new Error(`未能提取到标题或内容 (标题: ${scrapedData.title ? '有' : '无'}, 内容: ${scrapedData.content ? scrapedData.content.length : 0}字节)`)
      }
      
      console.log('✅ 验证通过，开始处理图片...')

      // 处理图片本地化
      let imagesDownloaded = 0
      if (rule.download_images) {
        const imgRegex = /<img[^>]+src="([^">]+)"/g
        let match
        const imageUrls: string[] = []

        while ((match = imgRegex.exec(scrapedData.content)) !== null) {
          let imgUrl = match[1]
          if (!imgUrl.startsWith('http')) {
            const baseUrl = new URL(urlToScrape)
            imgUrl = new URL(imgUrl, baseUrl.origin).href
          }
          imageUrls.push(imgUrl)
        }

        // 下载图片（添加延迟，避免被检测）
        for (const imgUrl of imageUrls) {
          try {
            // 随机延迟（模拟人类浏览图片）
            await randomDelay(500, 1500)

            const { response: imgResponse } = await fetchWithRetry(
              imgUrl,
              { headers: { 'User-Agent': userAgent, 'Referer': urlToScrape } },
              2,
              3000
            )

            if (imgResponse.ok) {
              const imgBlob = await imgResponse.blob()
              const imgArrayBuffer = await imgBlob.arrayBuffer()
              const imgBuffer = new Uint8Array(imgArrayBuffer)
              
              const fileName = `scraped/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`
              
              const { data: uploadData, error: uploadError } = await supabaseClient
                .storage
                .from('articles')
                .upload(fileName, imgBuffer, {
                  contentType: imgBlob.type,
                  upsert: false
                })

              if (!uploadError && uploadData) {
                const { data: urlData } = supabaseClient
                  .storage
                  .from('articles')
                  .getPublicUrl(fileName)

                if (urlData) {
                  scrapedData.content = scrapedData.content.replace(imgUrl, urlData.publicUrl)
                  imagesDownloaded++
                }
              }
            }
          } catch (error) {
            console.error('下载图片失败:', error)
          }
        }

        // 处理封面图
        if (scrapedData.cover_image) {
          try {
            await randomDelay(500, 1500)

            const { response: imgResponse } = await fetchWithRetry(
              scrapedData.cover_image,
              { headers: { 'User-Agent': userAgent, 'Referer': urlToScrape } },
              2,
              3000
            )

            if (imgResponse.ok) {
              const imgBlob = await imgResponse.blob()
              const imgArrayBuffer = await imgBlob.arrayBuffer()
              const imgBuffer = new Uint8Array(imgArrayBuffer)
              
              const fileName = `scraped/cover_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`
              
              const { data: uploadData, error: uploadError } = await supabaseClient
                .storage
                .from('articles')
                .upload(fileName, imgBuffer, {
                  contentType: imgBlob.type,
                  upsert: false
                })

              if (!uploadError && uploadData) {
                const { data: urlData } = supabaseClient
                  .storage
                  .from('articles')
                  .getPublicUrl(fileName)

                if (urlData) {
                  scrapedData.cover_image = urlData.publicUrl
                }
              }
            }
          } catch (error) {
            console.error('下载封面图失败:', error)
          }
        }
      }

      // 添加来源链接
      if (rule.add_source_link) {
        scrapedData.content += `\n\n<hr>\n<p><strong>来源：</strong><a href="${urlToScrape}" target="_blank" rel="noopener noreferrer">${rule.source_name}</a></p>`
      }

      // 生成slug
      const slug = scrapedData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 100)

      // 创建文章
      const { data: article, error: articleError } = await supabaseClient
        .from('articles')
        .insert({
          title: scrapedData.title,
          slug: `${slug}-${Date.now()}`,
          content: scrapedData.content,
          excerpt: scrapedData.excerpt || scrapedData.content.substring(0, 200),
          cover_image: scrapedData.cover_image,
          category_id: rule.category_id,
          status: rule.auto_publish ? 'published' : 'draft',
          author_id: rule.created_by,
          source_url: urlToScrape,
          source_name: rule.source_name
        })
        .select()
        .single()

      if (articleError) {
        throw new Error(`创建文章失败: ${articleError.message}`)
      }

      // 更新采集历史
      await supabaseClient
        .from('scraper_history')
        .update({
          status: 'success',
          article_id: article.id,
          scraped_data: scrapedData,
          images_downloaded: imagesDownloaded,
          completed_at: new Date().toISOString()
        })
        .eq('id', history.id)

      // 更新规则统计
      await supabaseClient
        .from('scraper_rules')
        .update({
          success_count: rule.success_count + 1,
          last_run_at: new Date().toISOString()
        })
        .eq('id', ruleId)

      const totalTime = Date.now() - startTime

      return new Response(
        JSON.stringify({
          success: true,
          article_id: article.id,
          images_downloaded: imagesDownloaded,
          response_time: responseTime,
          total_time: totalTime,
          message: '采集成功'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )

    } catch (error) {
      // 更新采集历史为失败
      await supabaseClient
        .from('scraper_history')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', history.id)

      // 更新规则统计
      await supabaseClient
        .from('scraper_rules')
        .update({
          fail_count: rule.fail_count + 1,
          last_run_at: new Date().toISOString()
        })
        .eq('id', ruleId)

      throw error
    }

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
