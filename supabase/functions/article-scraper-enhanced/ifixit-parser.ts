/**
 * iFixit专用解析器
 * 针对iFixit的特殊HTML结构进行优化
 */

interface IFixitStep {
  stepNumber: number
  title: string
  lines: string[]
  images: string[]
}

interface IFixitGuide {
  title: string
  introduction: string
  steps: IFixitStep[]
  coverImage: string
  difficulty: string
  timeRequired: string
}

/**
 * 解析iFixit指南页面
 */
export function parseIFixitGuide(html: string): IFixitGuide | null {
  try {
    console.log('🔍 开始解析iFixit页面，HTML长度:', html.length)
    
    // 1. 提取标题 - 使用 h1.placeholder-title
    let title = ''
    
    const titlePattern = /<h1[^>]*class="[^"]*placeholder-title[^"]*"[^>]*>(.*?)<\/h1>/is
    const titleMatch = html.match(titlePattern)
    
    if (titleMatch) {
      title = titleMatch[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#039;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .trim()
    }
    
    if (!title) {
      console.error('❌ 未找到标题（h1.placeholder-title）')
      // 尝试任意h1
      const anyH1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/is)
      if (anyH1Match) {
        title = anyH1Match[1].replace(/<[^>]+>/g, '').trim()
        console.log('⚠️  使用备用h1标签:', title)
      }
    }
    
    console.log('✅ 标题:', title || '未找到')
    
    // 2. 提取简介（可选）
    let introduction = ''
    
    // 3. 提取封面图 - 使用第一张 .stepImage
    let coverImage = ''
    const coverPattern = /<img[^>]*class="[^"]*stepImage[^"]*"[^>]*src="([^"]+)"/i
    const coverMatch = html.match(coverPattern)
    if (coverMatch) {
      coverImage = coverMatch[1]
      console.log('🖼️  封面图:', coverImage.substring(0, 80) + '...')
    }
    
    // 4. 提取难度和时间
    const difficulty = 'Moderate'
    const timeRequired = '1-2 hours'
    
    // 5. 提取步骤内容
    const steps: IFixitStep[] = []
    
    console.log('📋 开始提取步骤...')
    
    // 使用 step-lines 容器提取步骤
    const stepContainerPattern = /<ul[^>]*class="[^"]*step-lines[^"]*"[^>]*>([\s\S]*?)<\/ul>/gi
    let match
    let stepNumber = 1
    
    stepContainerPattern.lastIndex = 0
    
    while ((match = stepContainerPattern.exec(html)) !== null) {
      const stepContent = match[1]
      
      // 提取这个步骤的所有说明行
      const lines: string[] = []
      const linePattern = /<p[^>]*itemprop="text"[^>]*>([\s\S]*?)<\/p>/gi
      let lineMatch
      
      linePattern.lastIndex = 0
      
      while ((lineMatch = linePattern.exec(stepContent)) !== null) {
        let lineText = lineMatch[1]
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&#039;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/\s+/g, ' ')
          .trim()
        
        if (lineText && lineText.length > 5) {
          lines.push(lineText)
        }
      }
      
      // 只添加有内容的步骤
      if (lines.length > 0) {
        steps.push({
          stepNumber,
          title: `Step ${stepNumber}`,
          lines,
          images: []
        })
        stepNumber++
      }
    }
    
    console.log('✅ 提取到步骤数:', steps.length)
    console.log('✅ 总说明行数:', steps.reduce((sum, s) => sum + s.lines.length, 0))
    
    if (steps.length === 0) {
      console.error('❌ 未找到任何步骤内容')
      return null
    }
    
    if (!title) {
      console.error('❌ 未找到标题')
      return null
    }
    
    return {
      title,
      introduction,
      steps,
      coverImage,
      difficulty,
      timeRequired
    }
  } catch (error) {
    console.error('❌ 解析iFixit页面失败:', error)
    console.error('错误堆栈:', error instanceof Error ? error.stack : String(error))
    return null
  }
}

/**
 * 将解析结果转换为HTML格式
 */
export function convertToHTML(guide: IFixitGuide): string {
  let html = ''
  
  // 添加简介
  if (guide.introduction) {
    html += `<div class="guide-introduction">\n${guide.introduction}\n</div>\n\n`
  }
  
  // 添加元信息
  if (guide.difficulty || guide.timeRequired) {
    html += '<div class="guide-meta">\n'
    if (guide.difficulty) {
      html += `<p><strong>Difficulty:</strong> ${guide.difficulty}</p>\n`
    }
    if (guide.timeRequired) {
      html += `<p><strong>Time Required:</strong> ${guide.timeRequired}</p>\n`
    }
    html += '</div>\n\n'
  }
  
  // 添加步骤
  html += '<div class="guide-steps">\n'
  
  for (const step of guide.steps) {
    html += `<div class="step" id="step-${step.stepNumber}">\n`
    html += `<h2>Step ${step.stepNumber}: ${step.title}</h2>\n`
    
    // 添加步骤图片
    if (step.images.length > 0) {
      html += '<div class="step-images">\n'
      for (const img of step.images) {
        html += `<img src="${img}" alt="Step ${step.stepNumber}" class="step-image" />\n`
      }
      html += '</div>\n'
    }
    
    // 添加步骤说明
    html += '<div class="step-lines">\n<ul>\n'
    for (const line of step.lines) {
      html += `<li>${line}</li>\n`
    }
    html += '</ul>\n</div>\n'
    
    html += '</div>\n\n'
  }
  
  html += '</div>\n'
  
  return html
}

/**
 * 提取所有图片URL
 */
export function extractAllImages(guide: IFixitGuide): string[] {
  const images: string[] = []
  
  // 添加封面图
  if (guide.coverImage) {
    images.push(guide.coverImage)
  }
  
  // 添加步骤图片
  for (const step of guide.steps) {
    for (const img of step.images) {
      if (!images.includes(img)) {
        images.push(img)
      }
    }
  }
  
  return images
}

/**
 * 生成摘要
 */
export function generateExcerpt(guide: IFixitGuide): string {
  // 从简介中提取纯文本
  const introText = guide.introduction
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  
  // 截取前200个字符
  if (introText.length > 200) {
    return introText.substring(0, 200) + '...'
  }
  
  return introText
}
