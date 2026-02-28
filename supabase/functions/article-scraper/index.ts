import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScraperRule {
  id: string
  name: string
  source_url: string
  source_name: string
  title_selector: string
  content_selector: string
  excerpt_selector?: string
  cover_image_selector?: string
  author_selector?: string
  publish_date_selector?: string
  category_id?: string
  auto_publish: boolean
  download_images: boolean
  add_source_link: boolean
}

interface ScrapedData {
  title: string
  content: string
  excerpt?: string
  cover_image?: string
  author?: string
  publish_date?: string
  source_url: string
  source_name: string
}

serve(async (req) => {
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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

    const scraperRule = rule as ScraperRule
    const urlToScrape = targetUrl || scraperRule.source_url

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
      // 获取网页内容
      const response = await fetch(urlToScrape, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      if (!response.ok) {
        throw new Error(`获取网页失败: ${response.status}`)
      }

      const html = await response.text()
      const doc = new DOMParser().parseFromString(html, 'text/html')

      if (!doc) {
        throw new Error('解析HTML失败')
      }

      // 提取数据
      const scrapedData: ScrapedData = {
        title: '',
        content: '',
        source_url: urlToScrape,
        source_name: scraperRule.source_name
      }

      // 提取标题
      const titleElement = doc.querySelector(scraperRule.title_selector)
      if (titleElement) {
        scrapedData.title = titleElement.textContent?.trim() || ''
      }

      // 提取内容
      const contentElement = doc.querySelector(scraperRule.content_selector)
      if (contentElement) {
        scrapedData.content = contentElement.innerHTML || ''
      }

      // 提取摘要
      if (scraperRule.excerpt_selector) {
        const excerptElement = doc.querySelector(scraperRule.excerpt_selector)
        if (excerptElement) {
          scrapedData.excerpt = excerptElement.textContent?.trim()
        }
      }

      // 提取封面图
      if (scraperRule.cover_image_selector) {
        const coverElement = doc.querySelector(scraperRule.cover_image_selector)
        if (coverElement) {
          scrapedData.cover_image = coverElement.getAttribute('src') || ''
          // 处理相对路径
          if (scrapedData.cover_image && !scrapedData.cover_image.startsWith('http')) {
            const baseUrl = new URL(urlToScrape)
            scrapedData.cover_image = new URL(scrapedData.cover_image, baseUrl.origin).href
          }
        }
      }

      // 提取作者
      if (scraperRule.author_selector) {
        const authorElement = doc.querySelector(scraperRule.author_selector)
        if (authorElement) {
          scrapedData.author = authorElement.textContent?.trim()
        }
      }

      // 提取发布日期
      if (scraperRule.publish_date_selector) {
        const dateElement = doc.querySelector(scraperRule.publish_date_selector)
        if (dateElement) {
          scrapedData.publish_date = dateElement.textContent?.trim()
        }
      }

      // 验证必要字段
      if (!scrapedData.title || !scrapedData.content) {
        throw new Error('未能提取到标题或内容')
      }

      // 处理图片本地化
      let imagesDownloaded = 0
      if (scraperRule.download_images) {
        const imgRegex = /<img[^>]+src="([^">]+)"/g
        let match
        const imageUrls: string[] = []

        while ((match = imgRegex.exec(scrapedData.content)) !== null) {
          let imgUrl = match[1]
          // 处理相对路径
          if (!imgUrl.startsWith('http')) {
            const baseUrl = new URL(urlToScrape)
            imgUrl = new URL(imgUrl, baseUrl.origin).href
          }
          imageUrls.push(imgUrl)
        }

        // 下载并替换图片
        for (const imgUrl of imageUrls) {
          try {
            const imgResponse = await fetch(imgUrl)
            if (imgResponse.ok) {
              const imgBlob = await imgResponse.blob()
              const imgArrayBuffer = await imgBlob.arrayBuffer()
              const imgBuffer = new Uint8Array(imgArrayBuffer)
              
              // 生成文件名
              const fileName = `scraped/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`
              
              // 上传到Supabase Storage
              const { data: uploadData, error: uploadError } = await supabaseClient
                .storage
                .from('articles')
                .upload(fileName, imgBuffer, {
                  contentType: imgBlob.type,
                  upsert: false
                })

              if (!uploadError && uploadData) {
                // 获取公共URL
                const { data: urlData } = supabaseClient
                  .storage
                  .from('articles')
                  .getPublicUrl(fileName)

                if (urlData) {
                  // 替换内容中的图片URL
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
            const imgResponse = await fetch(scrapedData.cover_image)
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
      if (scraperRule.add_source_link) {
        scrapedData.content += `\n\n<hr>\n<p><strong>来源：</strong><a href="${urlToScrape}" target="_blank" rel="noopener noreferrer">${scraperRule.source_name}</a></p>`
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
          category_id: scraperRule.category_id,
          status: scraperRule.auto_publish ? 'published' : 'draft',
          author_id: rule.created_by,
          source_url: urlToScrape,
          source_name: scraperRule.source_name
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

      return new Response(
        JSON.stringify({
          success: true,
          article_id: article.id,
          images_downloaded: imagesDownloaded,
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
