import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle2, Globe, ChevronDown, ZoomIn } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/db/supabase';
import type { YiyuanProduct, YiyuanContent, YiyuanVerificationGuide, YiyuanManufacturer } from '@/types';
import PageMeta from '@/components/common/PageMeta';
import ScrollAnimationWrapper from '@/components/common/ScrollAnimationWrapper';
import { SUPPORTED_LANGUAGES, UI_TRANSLATIONS, LanguageCode } from '@/i18n/yiyuan-translations';
import { 
  HERO_TRANSLATIONS, 
  PRODUCT_NAME_TRANSLATIONS, 
  PRODUCT_DESCRIPTION_TRANSLATIONS, 
  PRODUCT_SPECIFICATIONS_TRANSLATIONS,
  PRODUCT_FEATURES_TRANSLATIONS,
  PRODUCT_APPLICATIONS_TRANSLATIONS,
  VERIFICATION_STEPS_TRANSLATIONS,
  MANUFACTURER_INFO_TRANSLATIONS,
  NOTICE_TRANSLATIONS 
} from '@/i18n/yiyuan-content-translations';

export default function YiyuanPage() {
  const [language, setLanguage] = useState<LanguageCode>('zh');
  const [products, setProducts] = useState<YiyuanProduct[]>([]);
  const [content, setContent] = useState<Record<string, YiyuanContent>>({});
  const [verificationSteps, setVerificationSteps] = useState<YiyuanVerificationGuide[]>([]);
  const [manufacturer, setManufacturer] = useState<YiyuanManufacturer | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [productsRes, contentRes, stepsRes, manufacturerRes] = await Promise.all([
        supabase.from('yiyuan_products').select('*').eq('is_active', true).order('display_order'),
        supabase.from('yiyuan_content').select('*'),
        supabase.from('yiyuan_verification_guide').select('*').order('display_order'),
        supabase.from('yiyuan_manufacturer').select('*').limit(1).single()
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      
      if (contentRes.data) {
        const contentMap: Record<string, YiyuanContent> = {};
        contentRes.data.forEach(item => {
          contentMap[item.section_key] = item;
        });
        setContent(contentMap);
      }

      if (stepsRes.data) setVerificationSteps(stepsRes.data);
      if (manufacturerRes.data) setManufacturer(manufacturerRes.data);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getText = (zhText: string | null | undefined, enText: string | null | undefined) => {
    return language === 'zh' ? (zhText || '') : (enText || '');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{language === 'zh' ? '加载中...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  // 验证步骤图片数组
  const stepImages = [
    'https://miaoda-conversation-file.cdn.bcebos.com/user-7fsho0gup4aq/conv-7fshtpomqha8/20260227/file-9x3wqhg1kz5s.jpg',
    'https://miaoda-conversation-file.cdn.bcebos.com/user-7fsho0gup4aq/conv-7fshtpomqha8/20260227/file-9x456rzmxm2o.jpg',
    'https://miaoda-conversation-file.cdn.bcebos.com/user-7fsho0gup4aq/conv-7fshtpomqha8/20260227/file-9x4ftjzhktmo.jpg',
    'https://miaoda-conversation-file.cdn.bcebos.com/user-7fsho0gup4aq/conv-7fshtpomqha8/20260227/file-9x4np8ngktts.jpg'
  ];

  // 只显示第一个产品
  const product = products[0];

  return (
    <>
      <PageMeta
        title={language === 'zh' ? '翊鸢化工 - 专业化工产品供应商' : 'Yiyuan Chemical - Professional Chemical Product Supplier'}
        description={getText(content.hero?.content_zh, content.hero?.content_en)}
        keywords={language === 'zh' ? '翊鸢化工,化工产品,工业化学品,防伪验证' : 'Yiyuan Chemical,Chemical Products,Industrial Chemicals,Anti-counterfeiting Verification'}
      />

      <div className="min-h-screen bg-white">
        {/* 多语言切换下拉菜单 */}
        <div className="fixed top-4 right-4 xl:top-6 xl:right-6 z-[100] flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 border-0 px-4 xl:px-6 py-2 xl:py-3 rounded-xl font-medium text-sm xl:text-base animate-pulse hover:animate-none cursor-pointer">
              <Globe className="h-4 xl:h-5 w-4 xl:w-5 mr-1 xl:mr-2 animate-spin-slow" />
              <span>
                {SUPPORTED_LANGUAGES.find(lang => lang.code === language)?.nativeName || '中文'}
              </span>
              <ChevronDown className="h-4 xl:h-5 w-4 xl:w-5 ml-1 xl:ml-2" />
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-72 xl:w-80 max-h-[400px] xl:max-h-[500px] overflow-y-auto bg-white/98 backdrop-blur-xl shadow-2xl border-2 border-blue-100 rounded-xl p-2"
              sideOffset={8}
            >
              <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 xl:px-4 py-2 xl:py-3 mb-2 rounded-lg border-b border-blue-200 z-10">
                <p className="text-xs xl:text-sm font-bold text-blue-900">🌍 选择语言 / Select Language</p>
                <p className="text-xs text-blue-600 mt-1">支持25种国际语言</p>
              </div>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`
                    px-3 xl:px-4 py-2 xl:py-3 rounded-lg cursor-pointer transition-all duration-200
                    ${language === lang.code 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold shadow-md' 
                      : 'hover:bg-blue-50 hover:shadow-sm'
                    }
                  `}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-sm xl:text-base">{lang.nativeName}</span>
                    <span className={`text-xs xl:text-sm ${language === lang.code ? 'text-blue-100' : 'text-muted-foreground'}`}>
                      {lang.name}
                    </span>
                  </div>
                  {language === lang.code && (
                    <CheckCircle2 className="h-3 xl:h-4 w-3 xl:w-4 ml-2 text-white" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Hero Section - 简约标题 */}
        <section className="relative py-20 bg-gradient-to-br from-primary/5 via-primary/10 to-background">
          {/* 多语言提示横幅 */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 hidden xl:block">
            <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-6 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
              <Globe className="h-4 w-4" />
              <span className="text-sm font-medium">🌍 支持25种语言 | 25 Languages Available</span>
            </div>
          </div>
          
          {/* 移动端语言提示 */}
          <div className="xl:hidden text-center mb-4">
            <div className="inline-flex bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-1.5 rounded-full shadow-lg items-center gap-2">
              <Globe className="h-3 w-3" />
              <span className="text-xs font-medium">🌍 25种语言</span>
            </div>
          </div>
          
          <div className="container mx-auto px-4">
            <ScrollAnimationWrapper animation="fade-in">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
                  {HERO_TRANSLATIONS[language].title}
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  {HERO_TRANSLATIONS[language].content}
                </p>
              </div>
            </ScrollAnimationWrapper>
          </div>
        </section>

        {/* 产品介绍 - 单个产品 */}
        {product && (
          <section className="py-20 bg-background">
            <div className="container mx-auto px-4">
              <div className="max-w-5xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12 items-start">
                  {/* 产品图片 */}
                  <ScrollAnimationWrapper animation="fade-in-left">
                    <div className="relative group">
                      <div 
                        className="aspect-square rounded-xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-300 border-2 border-border bg-gradient-to-br from-muted to-background cursor-zoom-in"
                        onClick={() => setSelectedImage(product.image_url || 'https://miaoda-conversation-file.cdn.bcebos.com/user-7fsho0gup4aq/conv-7fshtpomqha8/20260115/file-8y3uy9kyk6io.jpg')}
                      >
                        <img 
                          src={product.image_url || 'https://miaoda-conversation-file.cdn.bcebos.com/user-7fsho0gup4aq/conv-7fshtpomqha8/20260115/file-8y3uy9kyk6io.jpg'}
                          alt={getText(product.name_zh, product.name_en)} 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      
                      {/* Zoom Icon Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="bg-background/90 backdrop-blur-sm rounded-full p-4 shadow-lg">
                          <ZoomIn className="h-8 w-8 text-primary" />
                        </div>
                      </div>
                      
                      {/* Click to Zoom Hint */}
                      <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1.5">
                        <ZoomIn className="h-3 w-3" />
                        {language === 'zh' ? '点击放大' : 'Click to zoom'}
                      </div>
                    </div>
                  </ScrollAnimationWrapper>

                  {/* 产品信息 */}
                  <ScrollAnimationWrapper animation="fade-in-right" delay={100}>
                    <div className="space-y-6">
                      <div>
                        <Badge variant="outline" className="mb-3 text-primary border-primary/20 bg-primary/5">
                          {UI_TRANSLATIONS[language].productIntro}
                        </Badge>
                        <h2 className="text-4xl font-bold mb-4 text-foreground">
                          {PRODUCT_NAME_TRANSLATIONS[language]}
                        </h2>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                          {PRODUCT_DESCRIPTION_TRANSLATIONS[language]}
                        </p>
                      </div>

                      {/* 产品规格 */}
                      <div className="bg-muted/50 p-6 rounded-xl border border-border shadow-sm">
                        <h3 className="text-lg font-bold mb-3 text-foreground">
                          {UI_TRANSLATIONS[language].productSpecs}
                        </h3>
                        <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground leading-relaxed">
                          {PRODUCT_SPECIFICATIONS_TRANSLATIONS[language]}
                        </pre>
                      </div>

                      {/* 产品特点 */}
                      <div>
                        <h3 className="text-lg font-bold mb-3 text-foreground">
                          {UI_TRANSLATIONS[language].productFeatures}
                        </h3>
                        <div className="space-y-2">
                          {PRODUCT_FEATURES_TRANSLATIONS[language].map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <span className="text-muted-foreground">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 应用领域 */}
                      <div>
                        <h3 className="text-lg font-bold mb-3 text-foreground">
                          {UI_TRANSLATIONS[language].applications}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {PRODUCT_APPLICATIONS_TRANSLATIONS[language].map((app, idx) => (
                            <Badge key={idx} variant="secondary" className="text-sm px-3 py-1">
                              {app}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ScrollAnimationWrapper>
                </div>

                {/* 生产商信息 */}
                {manufacturer && (
                  <div className="mt-16">
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-foreground">
                        {UI_TRANSLATIONS[language].manufacturer}
                      </h2>
                    </div>

                    <Card className="border-2 border-border shadow-lg">
                      <CardContent className="p-8">
                        <div className="grid md:grid-cols-2 gap-8">
                          {/* 左侧信息 */}
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                                {UI_TRANSLATIONS[language].executiveStandard}
                              </h3>
                              <p className="text-base text-foreground">
                                {MANUFACTURER_INFO_TRANSLATIONS[language].standard}
                              </p>
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                                {UI_TRANSLATIONS[language].origin}
                              </h3>
                              <p className="text-base text-foreground">
                                {MANUFACTURER_INFO_TRANSLATIONS[language].origin}
                              </p>
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                                {UI_TRANSLATIONS[language].companyName}
                              </h3>
                              <p className="text-base text-foreground font-medium">
                                {MANUFACTURER_INFO_TRANSLATIONS[language].companyName}
                              </p>
                            </div>
                          </div>

                          {/* 右侧信息 */}
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                                {UI_TRANSLATIONS[language].address}
                              </h3>
                              <p className="text-base text-foreground">
                                {MANUFACTURER_INFO_TRANSLATIONS[language].address}
                              </p>
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                                {UI_TRANSLATIONS[language].website}
                              </h3>
                              <a 
                                href={manufacturer.website.startsWith('http') ? manufacturer.website : `https://${manufacturer.website}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-base text-blue-600 hover:text-blue-700 hover:underline"
                              >
                                {manufacturer.website}
                              </a>
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                                {UI_TRANSLATIONS[language].email}
                              </h3>
                              <a 
                                href={`mailto:${manufacturer.email}`}
                                className="text-base text-blue-600 hover:text-blue-700 hover:underline"
                              >
                                {manufacturer.email}
                              </a>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 防伪验证说明 */}
        <section className="py-20 bg-gradient-to-br from-muted/30 to-primary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              {/* 标题 */}
              <ScrollAnimationWrapper animation="fade-in">
                <div className="text-center mb-12">
                  <Badge variant="outline" className="mb-4 text-primary border-primary/20 bg-primary/5">
                    <Shield className="h-4 w-4 mr-2" />
                    {UI_TRANSLATIONS[language].verificationGuide}
                  </Badge>
                  <h2 className="text-4xl font-bold mb-4 text-foreground">
                    {UI_TRANSLATIONS[language].verificationTitle}
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    {UI_TRANSLATIONS[language].verificationSubtitle}
                  </p>
                </div>
              </ScrollAnimationWrapper>

              {/* 验证步骤 */}
              <div className="grid md:grid-cols-2 gap-6">
                {VERIFICATION_STEPS_TRANSLATIONS[language].map((step, index) => {
                  const stepImage = stepImages[index % stepImages.length];

                  return (
                    <ScrollAnimationWrapper 
                      key={index} 
                      animation="fade-in"
                      delay={index * 100}
                    >
                      <Card className="border-2 border-border hover:border-primary/50 hover:shadow-hover transition-all duration-300 hover-lift h-full">
                        <CardHeader>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground font-bold shadow-lg">
                              {index + 1}
                            </div>
                            <CardTitle className="text-xl text-foreground">
                              {step.title}
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-muted-foreground leading-relaxed">
                            {step.description}
                          </p>
                          <div className="rounded-lg overflow-hidden border-2 border-border bg-background shadow-sm">
                            <img 
                              src={stepImage}
                              alt={step.title}
                              className="w-full h-48 object-contain"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </ScrollAnimationWrapper>
                  );
                })}
              </div>

              {/* 温馨提示 */}
              <ScrollAnimationWrapper animation="scale-in" delay={400}>
                <div className="mt-12">
                  <Card className="bg-primary/5 border-2 border-primary/20 shadow-card">
                    <CardContent className="pt-6 pb-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                          <Shield className="h-6 w-6 text-primary-foreground" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-2 text-foreground">
                          {UI_TRANSLATIONS[language].importantNotice}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {NOTICE_TRANSLATIONS[language]}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              </ScrollAnimationWrapper>
            </div>
          </div>
        </section>

        {/* 页脚版权 */}
        <footer className="py-6 bg-muted/30 text-muted-foreground text-center border-t border-border">
          <div className="container mx-auto px-4">
            <p className="text-sm">
              © 2026 {language === 'zh' ? '翊鸢化工' : 'Yiyuan Chemical'}. {language === 'zh' ? '版权所有' : 'All rights reserved'}.
            </p>
          </div>
        </footer>
      </div>
      
      {/* Image Viewer Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-background/80 hover:bg-background rounded-full p-2 shadow-lg transition-colors"
              aria-label={language === 'zh' ? '关闭' : 'Close'}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedImage}
              alt={language === 'zh' ? '产品图片' : 'Product Image'}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
