/**
 * 文本格式化和清理工具
 */

/**
 * 自动排版：清理多余的空格、空行和重复字符
 */
export function autoFormatText(text: string): string {
  if (!text) return '';

  let formatted = text;

  // 1. 统一换行符
  formatted = formatted.replace(/\r\n/g, '\n');

  // 2. 删除行尾空格
  formatted = formatted.replace(/[ \t]+$/gm, '');

  // 3. 删除行首多余空格（保留Markdown缩进）
  formatted = formatted.replace(/^[ \t]+/gm, '');

  // 4. 合并多个连续空格为一个
  formatted = formatted.replace(/[ \t]{2,}/g, ' ');

  // 5. 删除多余的空行（最多保留一个空行）
  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  // 6. 删除重复的标点符号
  formatted = formatted.replace(/([.,!?;:，。！？；：])\1+/g, '$1');

  // 7. 修复标点符号前的空格
  formatted = formatted.replace(/\s+([.,!?;:，。！？；：])/g, '$1');

  // 8. 修复标点符号后缺少空格（英文）
  formatted = formatted.replace(/([.,!?;:])([A-Za-z])/g, '$1 $2');

  // 9. 修复Markdown标题格式
  formatted = formatted.replace(/^(#{1,6})([^\s#])/gm, '$1 $2');

  // 10. 修复列表格式
  formatted = formatted.replace(/^([*\-+])([^\s])/gm, '$1 $2');
  formatted = formatted.replace(/^(\d+\.)([^\s])/gm, '$1 $2');

  // 11. 删除开头和结尾的空行
  formatted = formatted.trim();

  return formatted;
}

/**
 * 删除重复的段落
 */
export function removeDuplicateParagraphs(text: string): string {
  if (!text) return '';

  const paragraphs = text.split('\n\n');
  const uniqueParagraphs = new Set<string>();
  const result: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (trimmed && !uniqueParagraphs.has(trimmed)) {
      uniqueParagraphs.add(trimmed);
      result.push(para);
    }
  }

  return result.join('\n\n');
}

/**
 * 清理无效字符
 */
export function removeInvalidCharacters(text: string): string {
  if (!text) return '';

  // 删除零宽字符和其他不可见字符
  let cleaned = text.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // 删除控制字符（保留换行和制表符）
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return cleaned;
}

/**
 * 完整的文本清理流程
 */
export function cleanText(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // 1. 删除无效字符
  cleaned = removeInvalidCharacters(cleaned);

  // 2. 自动排版
  cleaned = autoFormatText(cleaned);

  // 3. 删除重复段落
  cleaned = removeDuplicateParagraphs(cleaned);

  return cleaned;
}

/**
 * 提取文本中的关键词（简单实现）
 */
export function extractKeywords(text: string, maxCount: number = 10): string[] {
  if (!text) return [];

  // 删除Markdown标记
  const plainText = text
    .replace(/#{1,6}\s/g, '')
    .replace(/[*_~`]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // 分词（简单按空格和标点分割）
  const words = plainText
    .toLowerCase()
    .split(/[\s,.:;!?，。：；！？]+/)
    .filter(word => word.length > 3); // 过滤短词

  // 统计词频
  const wordCount = new Map<string, number>();
  for (const word of words) {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  }

  // 排序并返回前N个
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxCount)
    .map(([word]) => word);
}

/**
 * 生成SEO友好的摘要
 */
export function generateSEODescription(text: string, maxLength: number = 160): string {
  if (!text) return '';

  // 删除Markdown标记
  const plainText = text
    .replace(/#{1,6}\s/g, '')
    .replace(/[*_~`]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();

  // 提取第一段或前N个字符
  const firstParagraph = plainText.split('\n\n')[0];
  
  if (firstParagraph.length <= maxLength) {
    return firstParagraph;
  }

  // 截断到最后一个完整的句子
  const truncated = firstParagraph.substring(0, maxLength);
  const lastPeriod = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  );

  if (lastPeriod > maxLength * 0.7) {
    return truncated.substring(0, lastPeriod + 1);
  }

  // 截断到最后一个空格
  const lastSpace = truncated.lastIndexOf(' ');
  return truncated.substring(0, lastSpace) + '...';
}

/**
 * 优化文章标题（SEO友好）
 */
export function optimizeTitle(title: string, keywords?: string): string {
  if (!title) return '';

  let optimized = title.trim();

  // 确保标题长度适中（50-60字符最佳）
  if (optimized.length > 60) {
    optimized = optimized.substring(0, 57) + '...';
  }

  // 如果提供了关键词，确保标题包含关键词
  if (keywords) {
    const keywordList = keywords.split(',').map(k => k.trim().toLowerCase());
    const titleLower = optimized.toLowerCase();
    
    const hasKeyword = keywordList.some(keyword => titleLower.includes(keyword));
    
    if (!hasKeyword && keywordList.length > 0) {
      // 在标题前添加第一个关键词
      const firstKeyword = keywordList[0];
      optimized = `${firstKeyword.charAt(0).toUpperCase() + firstKeyword.slice(1)}: ${optimized}`;
    }
  }

  return optimized;
}

/**
 * 分析关键词密度
 */
export function analyzeKeywordDensity(text: string, keyword: string): number {
  if (!text || !keyword) return 0;

  const plainText = text
    .replace(/#{1,6}\s/g, '')
    .replace(/[*_~`]/g, '')
    .toLowerCase();

  const keywordLower = keyword.toLowerCase();
  const words = plainText.split(/\s+/);
  const keywordCount = words.filter(word => word.includes(keywordLower)).length;

  return words.length > 0 ? (keywordCount / words.length) * 100 : 0;
}

/**
 * SEO优化建议
 */
export interface SEOAnalysis {
  titleLength: number;
  titleOptimal: boolean;
  descriptionLength: number;
  descriptionOptimal: boolean;
  keywordDensity: number;
  keywordDensityOptimal: boolean;
  suggestions: string[];
}

export function analyzeSEO(
  title: string,
  description: string,
  content: string,
  keywords?: string
): SEOAnalysis {
  const suggestions: string[] = [];

  // 分析标题
  const titleLength = title.length;
  const titleOptimal = titleLength >= 30 && titleLength <= 60;
  if (titleLength < 30) {
    suggestions.push('标题太短，建议30-60个字符');
  } else if (titleLength > 60) {
    suggestions.push('标题太长，建议30-60个字符');
  }

  // 分析描述
  const descriptionLength = description.length;
  const descriptionOptimal = descriptionLength >= 120 && descriptionLength <= 160;
  if (descriptionLength < 120) {
    suggestions.push('描述太短，建议120-160个字符');
  } else if (descriptionLength > 160) {
    suggestions.push('描述太长，建议120-160个字符');
  }

  // 分析关键词密度
  let keywordDensity = 0;
  let keywordDensityOptimal = true;
  if (keywords) {
    const firstKeyword = keywords.split(',')[0].trim();
    keywordDensity = analyzeKeywordDensity(content, firstKeyword);
    keywordDensityOptimal = keywordDensity >= 1 && keywordDensity <= 3;
    
    if (keywordDensity < 1) {
      suggestions.push('关键词密度太低，建议1-3%');
    } else if (keywordDensity > 3) {
      suggestions.push('关键词密度太高，建议1-3%');
    }
  }

  return {
    titleLength,
    titleOptimal,
    descriptionLength,
    descriptionOptimal,
    keywordDensity,
    keywordDensityOptimal,
    suggestions,
  };
}
