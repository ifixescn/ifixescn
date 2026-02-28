import { Helmet } from 'react-helmet-async';
import { useSEO } from '@/contexts/SEOContext';

interface GlobalSEOProps {
  title?: string;
  description?: string;
  keywords?: string;
}

/**
 * 全局 SEO 组件
 * 
 * 功能：
 * 1. 从数据库读取全局 SEO 设置（网站名称、描述、关键词）
 * 2. 支持页面级别的 SEO 覆盖
 * 3. 与后台管理设置实时同步
 * 
 * 使用方法：
 * - 不传参数：使用全局设置
 *   <GlobalSEO />
 * 
 * - 自定义页面标题：
 *   <GlobalSEO title="文章列表" />
 *   结果：文章列表 - iFixes
 * 
 * - 完全自定义：
 *   <GlobalSEO 
 *     title="产品详情" 
 *     description="产品详细介绍"
 *     keywords="产品,工具,维修"
 *   />
 */
const GlobalSEO = ({ title, description, keywords }: GlobalSEOProps) => {
  const { settings } = useSEO();

  // 构建完整标题
  const fullTitle = title 
    ? `${title} - ${settings.siteName}` 
    : settings.siteName;

  // 使用自定义描述或全局描述
  const metaDescription = description || settings.siteDescription;

  // 使用自定义关键词或全局关键词
  const metaKeywords = keywords || settings.siteKeywords;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      {settings.siteLogo && <meta property="og:image" content={settings.siteLogo} />}
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      {settings.siteLogo && <meta name="twitter:image" content={settings.siteLogo} />}
    </Helmet>
  );
};

export default GlobalSEO;
