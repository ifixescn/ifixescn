import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误: 缺少Supabase环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 读取文章数据
const articlesData = JSON.parse(fs.readFileSync('new-articles-data.json', 'utf8'));

// 获取分类和作者ID
async function getMetadata() {
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('type', 'article');
  
  const { data: authors } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);
  
  return {
    categories: categories || [],
    authorId: authors?.[0]?.id || null
  };
}

// 生成文章内容
function generateArticleContent(article) {
  const { title, topic, coverImage, additionalImages } = article;
  
  // 根据主题生成不同的内容结构
  const introductions = {
    screen: `In the rapidly evolving world of mobile technology, screen repair remains one of the most sought-after services in the repair industry. This comprehensive guide explores advanced techniques and methodologies for ${title.toLowerCase()}, providing technicians with the knowledge needed to deliver professional-quality results.`,
    battery: `Battery-related issues continue to be among the most common problems faced by smartphone users worldwide. Understanding the intricacies of ${title.toLowerCase()} is essential for any repair professional looking to provide comprehensive service solutions.`,
    motherboard: `Motherboard repair represents the pinnacle of mobile device repair expertise. This detailed exploration of ${title.toLowerCase()} will equip technicians with the advanced skills necessary to tackle complex logic board issues.`,
    sensors: `Modern smartphones rely heavily on various sensors to provide enhanced user experiences. Mastering ${title.toLowerCase()} is crucial for maintaining device functionality and customer satisfaction.`,
    audio: `Audio components play a vital role in the overall user experience of mobile devices. This guide to ${title.toLowerCase()} covers everything from basic troubleshooting to advanced repair techniques.`,
    camera: `Camera systems in modern smartphones have become increasingly sophisticated. Understanding ${title.toLowerCase()} is essential for maintaining the high-quality imaging capabilities users expect.`,
    tools: `Having the right tools is fundamental to successful phone repair operations. This comprehensive overview of ${title.toLowerCase()} will help technicians make informed decisions about their equipment investments.`
  };
  
  const sections = [
    {
      heading: "Understanding the Fundamentals",
      content: `Before diving into the repair process, it's essential to understand the underlying principles and components involved. Modern smartphones incorporate cutting-edge technology that requires specialized knowledge and careful handling. The complexity of these devices means that technicians must stay updated with the latest repair methodologies and industry standards.`
    },
    {
      heading: "Essential Tools and Equipment",
      content: `Professional repair work demands professional-grade tools. From precision screwdrivers to specialized testing equipment, having the right tools makes all the difference in repair quality and efficiency. Investment in quality equipment pays dividends through improved repair success rates and reduced component damage.`,
      image: additionalImages[0]
    },
    {
      heading: "Step-by-Step Repair Process",
      content: `The repair process requires methodical approach and attention to detail. Begin by properly preparing your workspace and organizing all necessary tools and components. Ensure adequate lighting and maintain an ESD-safe environment throughout the procedure. Document each step of the disassembly process to facilitate proper reassembly.`
    },
    {
      heading: "Safety Considerations",
      content: `Safety should always be the top priority in any repair operation. This includes both personal safety and device safety. Always disconnect the battery before beginning any repair work. Use appropriate personal protective equipment, including ESD wrist straps and safety glasses when necessary. Handle all components with care to prevent damage.`,
      image: additionalImages[1]
    },
    {
      heading: "Common Challenges and Solutions",
      content: `Even experienced technicians encounter challenges during repair operations. Understanding common issues and their solutions can save valuable time and prevent costly mistakes. From stubborn adhesives to delicate ribbon cables, knowing how to handle these situations professionally is crucial for success.`
    },
    {
      heading: "Quality Control and Testing",
      content: `Thorough testing is essential before returning any device to a customer. Develop a comprehensive testing checklist that covers all device functions. This includes basic functionality tests, stress tests, and verification of all sensors and features. Document test results and address any issues before final delivery.`,
      image: additionalImages[2]
    },
    {
      heading: "Best Practices and Professional Tips",
      content: `Professional technicians distinguish themselves through attention to detail and adherence to best practices. Always use OEM or high-quality aftermarket parts. Maintain detailed repair records for warranty purposes. Keep your workspace clean and organized. Continuously update your skills through training and industry publications.`
    },
    {
      heading: "Troubleshooting Guide",
      content: `When repairs don't go as planned, systematic troubleshooting is essential. Start by verifying all connections and ensuring proper component seating. Check for any visible damage or contamination. Use diagnostic tools to identify electrical issues. Consult technical documentation and repair databases for model-specific information.`
    },
    {
      heading: "Industry Standards and Certifications",
      content: `Staying current with industry standards and obtaining relevant certifications demonstrates professional commitment. Many manufacturers offer certification programs that provide valuable training and recognition. These credentials can enhance your reputation and open doors to authorized repair partnerships.`
    },
    {
      heading: "Conclusion",
      content: `Mastering ${title.toLowerCase()} requires dedication, practice, and continuous learning. By following the guidelines and techniques outlined in this guide, technicians can deliver high-quality repairs that meet or exceed customer expectations. Remember that every repair is an opportunity to refine your skills and build your professional reputation.`
    }
  ];
  
  // 构建HTML内容
  let htmlContent = `<img src="${coverImage}" alt="${title}" />\n\n`;
  htmlContent += `<p>${introductions[topic] || introductions.screen}</p>\n\n`;
  
  sections.forEach(section => {
    htmlContent += `<h2>${section.heading}</h2>\n`;
    htmlContent += `<p>${section.content}</p>\n`;
    if (section.image) {
      htmlContent += `<img src="${section.image}" alt="${section.heading}" />\n`;
    }
    htmlContent += `\n`;
  });
  
  // 生成摘要
  const excerpt = introductions[topic]?.substring(0, 200) + '...' || 
                  `A comprehensive guide to ${title.toLowerCase()} covering essential techniques, tools, and best practices for professional mobile device repair.`;
  
  return {
    content: htmlContent,
    excerpt
  };
}

// 插入单篇文章
async function insertArticle(article, metadata) {
  const { content, excerpt } = generateArticleContent(article);
  
  // 查找对应的分类ID
  const category = metadata.categories.find(c => c.name === article.category);
  if (!category) {
    throw new Error(`分类 ${article.category} 不存在`);
  }
  
  // 生成slug
  const slug = article.title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '-v2';
  
  // 随机浏览量
  const viewCount = Math.floor(Math.random() * 400) + 100;
  
  try {
    const { data, error } = await supabase.rpc('batch_insert_articles', {
      p_title: article.title,
      p_slug: slug,
      p_content: content,
      p_excerpt: excerpt,
      p_cover_image: article.coverImage,
      p_category_id: category.id,
      p_author_id: metadata.authorId,
      p_status: 'published',
      p_view_count: viewCount,
      p_language: 'en'
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('=' .repeat(70));
  console.log('生成并插入100篇新的手机维修英文文章');
  console.log('=' .repeat(70));
  console.log();
  
  // 获取元数据
  console.log('📋 获取分类和作者信息...');
  const metadata = await getMetadata();
  console.log(`✅ 找到 ${metadata.categories.length} 个分类`);
  console.log(`✅ 作者ID: ${metadata.authorId}\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  console.log('开始生成并插入文章...\n');
  
  for (let i = 0; i < articlesData.length; i++) {
    const article = articlesData[i];
    
    process.stdout.write(`[${i + 1}/100] ${article.title.substring(0, 40)}... `);
    
    const result = await insertArticle(article, metadata);
    
    if (result.success) {
      successCount++;
      console.log('✅');
    } else {
      failCount++;
      console.log(`❌ ${result.error.substring(0, 50)}`);
    }
    
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log();
  console.log('=' .repeat(70));
  console.log('执行完成！');
  console.log('=' .repeat(70));
  console.log(`✅ 成功: ${successCount} 篇`);
  console.log(`❌ 失败: ${failCount} 篇`);
  console.log();
  
  // 验证总数
  const { count, error } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('language', 'en');
  
  if (!error) {
    console.log(`📊 数据库中英文文章总数: ${count}`);
  }
}

main().catch(console.error);
