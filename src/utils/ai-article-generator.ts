/**
 * AI文章生成器
 * 使用文心大模型生成文章内容
 */

import { sendChatStream, type ChatMessage } from './ai-chat';
import { cleanText, generateSEODescription, extractKeywords, optimizeTitle } from './text-formatter';
import type { ArticleLength, ArticleStyle } from '@/types';

const APP_ID = import.meta.env.VITE_APP_ID;
const AI_ENDPOINT = 'https://api-integrations.appmiaoda.com/app-7fshtpomqha9/api-2bk93oeO9NlE/v2/chat/completions';

// 文章长度对应的字数
const LENGTH_WORDS: Record<ArticleLength, string> = {
  short: '500-800字',
  medium: '1000-1500字',
  long: '2000-3000字'
};

// 文章风格描述
const STYLE_DESCRIPTIONS: Record<ArticleStyle, string> = {
  formal: '正式、严谨、专业的语言风格，适合商务和学术场景',
  casual: '轻松、随意、亲切的语言风格，适合日常交流和生活分享',
  professional: '专业、权威、深入的语言风格，适合技术和行业分析',
  creative: '创意、生动、富有想象力的语言风格，适合创作和营销'
};

/**
 * 生成文章提示词
 */
function generateArticlePrompt(
  keywords: string,
  length: ArticleLength,
  style: ArticleStyle,
  enableSEO: boolean = false
): string {
  const seoRequirements = enableSEO ? `
8. SEO优化要求：
   - 标题应包含主要关键词
   - 在文章中自然地分布关键词
   - 使用相关的长尾关键词
   - 创建有价值的、可分享的内容` : '';

  return `Please generate an article in English based on the following requirements:

Keywords: ${keywords}
Article Length: ${LENGTH_WORDS[length]}
Writing Style: ${STYLE_DESCRIPTIONS[style]}

Requirements:
1. The article title should be attractive, concise and clear
2. Content should revolve around the keywords with clear logic
3. Use Markdown format, including appropriate headings, paragraphs, lists, etc.
4. Content should be in-depth and valuable, not superficial
5. Language should match the specified style
6. Article structure should be complete, including introduction, body and conclusion
7. IMPORTANT: Write the entire article in English${seoRequirements}

Please output in the following format:

# Title
[Article Title in English]

## Summary
[100-200 word article summary in English]

## Content
[Article body content in English, using Markdown format]

Note: Please output the content directly without any additional explanatory text.`;
}

/**
 * 解析AI生成的文章内容
 */
function parseArticleContent(content: string): {
  title: string;
  summary: string;
  body: string;
} {
  // 提取标题（支持中英文）
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled Article';

  // 提取摘要（支持中英文）
  const summaryMatch = content.match(/##\s+(Summary|摘要)\s+([\s\S]+?)(?=##|$)/);
  const summary = summaryMatch ? summaryMatch[2].trim() : '';

  // 提取正文（支持中英文）
  const bodyMatch = content.match(/##\s+(Content|正文)\s+([\s\S]+?)$/);
  const body = bodyMatch ? bodyMatch[2].trim() : content;

  return { title, summary, body };
}

export interface GenerateArticleOptions {
  keywords: string;
  length: ArticleLength;
  style: ArticleStyle;
  temperature?: number;
  top_p?: number;
  enable_seo?: boolean;
  enable_auto_format?: boolean;
  onProgress?: (content: string) => void;
  signal?: AbortSignal;
}

export interface GenerateArticleResult {
  title: string;
  summary: string;
  content: string;
  rawContent: string;
  seoKeywords?: string[];
  seoDescription?: string;
}

/**
 * 生成文章
 */
export async function generateArticle(
  options: GenerateArticleOptions
): Promise<GenerateArticleResult> {
  const {
    keywords,
    length,
    style,
    temperature = 0.7,
    top_p = 0.9,
    enable_seo = false,
    enable_auto_format = true,
    onProgress,
    signal
  } = options;

  return new Promise((resolve, reject) => {
    const prompt = generateArticlePrompt(keywords, length, style, enable_seo);
    let fullContent = '';

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: '你是一个专业的内容创作助手，擅长根据关键词生成高质量的文章。'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    sendChatStream({
      endpoint: AI_ENDPOINT,
      apiId: APP_ID,
      messages,
      temperature,
      top_p,
      onUpdate: (content: string) => {
        fullContent = content;
        onProgress?.(content);
      },
      onComplete: () => {
        try {
          const parsed = parseArticleContent(fullContent);
          
          // 应用自动排版
          let finalTitle = parsed.title;
          let finalSummary = parsed.summary;
          let finalContent = parsed.body;

          if (enable_auto_format) {
            finalTitle = cleanText(finalTitle);
            finalSummary = cleanText(finalSummary);
            finalContent = cleanText(finalContent);
          }

          // SEO优化
          let seoKeywords: string[] | undefined;
          let seoDescription: string | undefined;

          if (enable_seo) {
            // 提取关键词
            seoKeywords = extractKeywords(finalContent, 10);
            
            // 生成SEO描述
            seoDescription = generateSEODescription(finalSummary || finalContent, 160);
            
            // 优化标题
            finalTitle = optimizeTitle(finalTitle, keywords);
          }

          resolve({
            title: finalTitle,
            summary: finalSummary,
            content: finalContent,
            rawContent: fullContent,
            seoKeywords,
            seoDescription
          });
        } catch (error) {
          reject(new Error('解析文章内容失败'));
        }
      },
      onError: (error: Error) => {
        reject(error);
      },
      signal
    });
  });
}

/**
 * 生成文章标题（快速模式）
 */
export async function generateArticleTitle(keywords: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let fullContent = '';

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a professional title creation assistant. Always respond in English.'
      },
      {
        role: 'user',
        content: `Please generate an attractive article title in English for the following keywords: ${keywords}\n\nRequirements:\n1. Title should be concise and clear, no more than 60 characters\n2. Must include the keywords\n3. Should be attractive and engaging\n4. Output only the title, nothing else\n5. IMPORTANT: Write in English only`
      }
    ];

    sendChatStream({
      endpoint: AI_ENDPOINT,
      apiId: APP_ID,
      messages,
      onUpdate: (content: string) => {
        fullContent = content;
      },
      onComplete: () => {
        resolve(fullContent.trim());
      },
      onError: (error: Error) => {
        reject(error);
      }
    });
  });
}

/**
 * 生成文章摘要（快速模式）
 */
export async function generateArticleSummary(
  title: string,
  keywords: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    let fullContent = '';

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a professional summary creation assistant. Always respond in English.'
      },
      {
        role: 'user',
        content: `Please generate a summary in English for the following article:\n\nTitle: ${title}\nKeywords: ${keywords}\n\nRequirements:\n1. Summary length: 100-200 words\n2. Summarize the main content\n3. Language should be concise and clear\n4. Output only the summary, nothing else\n5. IMPORTANT: Write in English only`
      }
    ];

    sendChatStream({
      endpoint: AI_ENDPOINT,
      apiId: APP_ID,
      messages,
      onUpdate: (content: string) => {
        fullContent = content;
      },
      onComplete: () => {
        resolve(fullContent.trim());
      },
      onError: (error: Error) => {
        reject(error);
      }
    });
  });
}
