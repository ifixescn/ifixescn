import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getPopularProducts, getFeaturedProducts, getRecentQuestions, getSiteSettings, getSEOSettings } from "@/db/api";
import PageMeta from "@/components/common/PageMeta";
import type { ProductWithImages, QuestionWithAnswers, SEOSettings } from "@/types";
import { 
  ArrowRight, 
  Wrench, 
  Award,
  Search,
  MessageCircle
} from "lucide-react";

// Helper function to strip HTML tags and get plain text
const stripHtml = (html: string): string => {
  try {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  } catch (error) {
    console.error("stripHtml error:", error);
    return "";
  }
};

export default function Home() {
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductWithImages[]>([]);
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [heroIcon, setHeroIcon] = useState<string>("");
  const [seoSettings, setSeoSettings] = useState<SEOSettings | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Set a timeout to ensure page shows even if data loading fails
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn("Data loading timeout, showing page anyway");
        setLoading(false);
      }
    }, 5000);

    Promise.all([
      getPopularProducts(6).catch(err => { console.error("getPopularProducts error:", err); return [] as ProductWithImages[]; }),
      getFeaturedProducts(2).catch(err => { console.error("getFeaturedProducts error:", err); return [] as ProductWithImages[]; }),
      getRecentQuestions(3).catch(err => { console.error("getRecentQuestions error:", err); return [] as QuestionWithAnswers[]; }),
      getSiteSettings().catch(err => { console.error("getSiteSettings error:", err); return [] as any[]; }),
      getSEOSettings().catch(err => { console.error("getSEOSettings error:", err); return null; })
    ]).then(([productsData, featuredProductsData, questionsData, settingsData, seoData]) => {
      setProducts(productsData || []);
      setFeaturedProducts(featuredProductsData || []);
      setQuestions(questionsData || []);
      
      // Find home hero icon setting
      if (Array.isArray(settingsData) && settingsData.length > 0) {
        const heroIconSetting = settingsData.find(s => s.key === 'home_hero_icon');
        if (heroIconSetting?.value) {
          setHeroIcon(heroIconSetting.value);
        }
      }
      
      // Set SEO settings
      if (seoData) {
        setSeoSettings(seoData);
      }
      
      setLoading(false);
      clearTimeout(timeoutId);
    }).catch(error => {
      console.error("Failed to load data:", error);
      setError("Failed to load some content. Please refresh the page.");
      setLoading(false);
      clearTimeout(timeoutId);
    });

    // Listen for settings update events
    const handleSettingsUpdate = () => {
      getSiteSettings().then(settingsData => {
        if (Array.isArray(settingsData) && settingsData.length > 0) {
          const heroIconSetting = settingsData.find(s => s.key === 'home_hero_icon');
          setHeroIcon(heroIconSetting?.value || "");
        }
      }).catch(err => console.error("handleSettingsUpdate error:", err));
      
      // Also update SEO settings
      getSEOSettings().then(seoData => {
        if (seoData) {
          setSeoSettings(seoData);
        }
      }).catch(err => console.error("getSEOSettings error:", err));
    };

    window.addEventListener("settingsUpdated", handleSettingsUpdate);
    return () => {
      window.removeEventListener("settingsUpdated", handleSettingsUpdate);
      clearTimeout(timeoutId);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta 
        title={seoSettings?.site_title || "Home"}
        description={seoSettings?.site_description || "Global leading mobile phone repair resource integration service provider. Find repair guides, parts, tools, and expert community support."}
        keywords={seoSettings?.site_keywords || "mobile phone repair, smartphone repair, repair guides, repair parts, repair tools, repair community"}
        image={seoSettings?.og_image || undefined}
      />
      
      {/* 结构化数据 - 网站信息 */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": seoSettings?.site_title || "iFixes",
            "description": seoSettings?.site_description || "Global leading mobile phone repair resource integration service provider",
            "url": window.location.origin,
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${window.location.origin}/search?q={search_term_string}`
              },
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": seoSettings?.site_title || "iFixes",
            "description": seoSettings?.site_description || "Global leading mobile phone repair resource integration service provider",
            "url": window.location.origin,
            "logo": seoSettings?.og_image || `${window.location.origin}/logo.png`,
            "sameAs": [
              // 可以添加社交媒体链接
            ]
          })}
        </script>
      </Helmet>
      
      {/* Error Message */}
      {error && (
        <div className="container mx-auto px-4 py-4">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
      
      {/* Hero Section - iFixit Style */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-primary/5 border-b">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                <Award className="h-3 w-3 mr-1" />
                Professional Repair Resources
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Repair Anything.
                <span className="block text-primary mt-2">Professional Tools.</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-xl">With the update of digital products, iFixes continuously develops more simple and easy-to-use tools.Join our community of repair enthusiasts and professionals.</p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Seek the repair tool you need"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <Button type="submit" size="lg" className="px-6">
                  Search
                </Button>
              </form>

              {/* Featured Products */}
              <div className="pt-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
                  Featured Products
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {loading ? (
                    [...Array(2)].map((_, i) => (
                      <div key={i} className="w-full">
                        <Skeleton className="h-32 sm:h-40 w-full rounded-xl mb-2 bg-muted" />
                        <Skeleton className="h-3 w-full mb-1 bg-muted" />
                        <Skeleton className="h-3 w-2/3 bg-muted" />
                      </div>
                    ))
                  ) : featuredProducts.length > 0 ? (
                    featuredProducts.map((product) => (
                      <Link 
                        key={product.id} 
                        to={`/products/${product.slug}`}
                        className="w-full group"
                      >
                        <div className="bg-card rounded-xl overflow-hidden mb-2 aspect-square border sm:border-2 border-border hover:border-primary hover:shadow-md transition-all duration-300">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0].image_url}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <Award className="h-10 w-10 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <h4 className="text-xs sm:text-sm font-medium line-clamp-2 mb-1 group-hover:text-primary transition-colors leading-tight">
                          {product.name}
                        </h4>
                        {product.price && (
                          <p className="text-xs sm:text-sm font-bold text-primary">
                            ${product.price}
                          </p>
                        )}
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-2 w-full text-center py-8 text-sm text-muted-foreground">
                      No featured products available
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Image/Visual */}
            <div className="relative hidden md:block">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEiIG9wYWNpdHk9IjAuMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
                <div className="relative z-10 flex items-center justify-center h-full">
                  {heroIcon ? (
                    <img 
                      src={heroIcon} 
                      alt="Hero icon" 
                      className="h-96 w-96 object-contain"
                    />
                  ) : (
                    <Wrench className="h-48 w-48 text-primary/20" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Community Q&A Section */}
      <section className="py-16 bg-muted/30 border-t">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Community Q&A</h2>
              <p className="text-muted-foreground">
                Get answers from repair experts
              </p>
            </div>
            <Link to="/questions">
              <Button variant="outline">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-4 w-3/4 mb-2 bg-muted" />
                    <Skeleton className="h-4 w-full mb-4 bg-muted" />
                    <Skeleton className="h-4 w-1/2 bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {questions.map((question) => (
                <Link key={question.id} to={`/questions/${question.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow group">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-3">
                        {question.category && (
                          <Badge variant="secondary" className="text-xs">
                            {question.category.name}
                          </Badge>
                        )}
                        <div className="flex items-center text-xs text-muted-foreground">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          {question.answer_count || 0} answers
                        </div>
                      </div>
                      <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {question.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {stripHtml(question.content)}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="text-sm text-muted-foreground">
                          {question.author?.username || "Anonymous"}
                        </span>
                        <span className="text-sm text-primary group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                          View
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-16 border-t">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20">
            <CardContent className="py-16 px-8 text-center">
              <div className="max-w-2xl mx-auto space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold">
                  Join the Repair Revolution
                </h2>
                <p className="text-lg text-muted-foreground">
                  Start fixing your devices today with our expert community support and quality parts
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <Button size="lg" asChild>
                    <Link to="/questions">
                      <MessageCircle className="mr-2 h-5 w-5" />
                      Ask a Question
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/products">
                      <Wrench className="mr-2 h-5 w-5" />
                      Shop Parts & Tools
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
