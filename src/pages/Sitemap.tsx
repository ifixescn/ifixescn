import { useEffect, useState } from "react";
import { getAllArticles, getAllProducts, getAllQuestions, getAllDownloads, getAllVideos, getAllCategories } from "@/db/api";
import type { Article, ProductWithImages, Question, Download, Video, Category } from "@/types";

export default function Sitemap() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          articlesData,
          productsData,
          questionsData,
          downloadsData,
          videosData,
          categoriesData
        ] = await Promise.all([
          getAllArticles(),
          getAllProducts(),
          getAllQuestions(),
          getAllDownloads(),
          getAllVideos(),
          getAllCategories()
        ]);

        setArticles(articlesData || []);
        setProducts(productsData || []);
        setQuestions(questionsData || []);
        setDownloads(downloadsData || []);
        setVideos(videosData || []);
        setCategories(categoriesData || []);
      } catch (error) {
        console.error("Failed to load sitemap data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 生成XML sitemap
  useEffect(() => {
    if (!loading) {
      const baseUrl = window.location.origin;
      const now = new Date().toISOString();

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      // 首页
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>1.0</priority>\n';
      xml += '  </url>\n';

      // 文章列表页
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/articles</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>0.9</priority>\n';
      xml += '  </url>\n';

      // 产品列表页
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/products</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>0.9</priority>\n';
      xml += '  </url>\n';

      // 问答列表页
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/questions</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>0.9</priority>\n';
      xml += '  </url>\n';

      // 下载列表页
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/downloads</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';

      // 视频列表页
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/videos</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';

      // 分类页面
      categories.forEach(category => {
        if (category.type === 'article') {
          xml += '  <url>\n';
          xml += `    <loc>${baseUrl}/articles/category/${category.id}</loc>\n`;
          xml += `    <lastmod>${now}</lastmod>\n`;
          xml += '    <changefreq>weekly</changefreq>\n';
          xml += '    <priority>0.8</priority>\n';
          xml += '  </url>\n';
        } else if (category.type === 'product') {
          xml += '  <url>\n';
          xml += `    <loc>${baseUrl}/products/category/${category.id}</loc>\n`;
          xml += `    <lastmod>${now}</lastmod>\n`;
          xml += '    <changefreq>weekly</changefreq>\n';
          xml += '    <priority>0.8</priority>\n';
          xml += '  </url>\n';
        } else if (category.type === 'question') {
          xml += '  <url>\n';
          xml += `    <loc>${baseUrl}/questions/category/${category.id}</loc>\n`;
          xml += `    <lastmod>${now}</lastmod>\n`;
          xml += '    <changefreq>weekly</changefreq>\n';
          xml += '    <priority>0.7</priority>\n';
          xml += '  </url>\n';
        } else if (category.type === 'download') {
          xml += '  <url>\n';
          xml += `    <loc>${baseUrl}/downloads/category/${category.id}</loc>\n`;
          xml += `    <lastmod>${now}</lastmod>\n`;
          xml += '    <changefreq>weekly</changefreq>\n';
          xml += '    <priority>0.7</priority>\n';
          xml += '  </url>\n';
        } else if (category.type === 'video') {
          xml += '  <url>\n';
          xml += `    <loc>${baseUrl}/videos/category/${category.id}</loc>\n`;
          xml += `    <lastmod>${now}</lastmod>\n`;
          xml += '    <changefreq>weekly</changefreq>\n';
          xml += '    <priority>0.7</priority>\n';
          xml += '  </url>\n';
        }
      });

      // 文章详情页
      articles.forEach(article => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/articles/${article.slug}</loc>\n`;
        xml += `    <lastmod>${article.updated_at || article.created_at}</lastmod>\n`;
        xml += '    <changefreq>monthly</changefreq>\n';
        xml += '    <priority>0.7</priority>\n';
        xml += '  </url>\n';
      });

      // 产品详情页
      products.forEach(product => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/products/${product.slug}</loc>\n`;
        xml += `    <lastmod>${product.updated_at || product.created_at}</lastmod>\n`;
        xml += '    <changefreq>monthly</changefreq>\n';
        xml += '    <priority>0.7</priority>\n';
        xml += '  </url>\n';
      });

      // 问答详情页
      questions.forEach(question => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/questions/${question.id}</loc>\n`;
        xml += `    <lastmod>${question.updated_at || question.created_at}</lastmod>\n`;
        xml += '    <changefreq>monthly</changefreq>\n';
        xml += '    <priority>0.6</priority>\n';
        xml += '  </url>\n';
      });

      // 下载详情页
      downloads.forEach(download => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/downloads/${download.id}</loc>\n`;
        xml += `    <lastmod>${download.updated_at || download.created_at}</lastmod>\n`;
        xml += '    <changefreq>monthly</changefreq>\n';
        xml += '    <priority>0.6</priority>\n';
        xml += '  </url>\n';
      });

      // 视频详情页
      videos.forEach(video => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/videos/${video.id}</loc>\n`;
        xml += `    <lastmod>${video.updated_at || video.created_at}</lastmod>\n`;
        xml += '    <changefreq>monthly</changefreq>\n';
        xml += '    <priority>0.6</priority>\n';
        xml += '  </url>\n';
      });

      xml += '</urlset>';

      // 设置响应头并返回XML
      document.title = 'Sitemap';
      
      // 创建一个blob并触发下载（可选）
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      
      // 直接显示XML内容
      document.body.innerHTML = `<pre style="white-space: pre-wrap; word-wrap: break-word; font-family: monospace; padding: 20px;">${xml.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
    }
  }, [loading, articles, products, questions, downloads, videos, categories]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return null;
}
