import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { searchContent, recordSearchKeyword, getHotSearchKeywords } from "@/db/api";
import { Search, Download, Video, Package, MessageCircle, Calendar, TrendingUp, Sparkles, Filter, X, Clock, History } from "lucide-react";
import type { ProductWithImages, QuestionWithAnswers } from "@/types";

// 下载和视频类型定义
interface DownloadItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  file_url: string;
  file_size?: number;
  download_count?: number;
  created_at: string;
  category?: { name: string };
}

interface VideoItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: number;
  view_count?: number;
  created_at: string;
  category?: { name: string };
}
import PageMeta from "@/components/common/PageMeta";

// Helper function to strip HTML tags and get plain text
const stripHtml = (html: string): string => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

// 智能高亮显示匹配的关键词
const highlightText = (text: string, query: string): string => {
  if (!query.trim() || !text) return text;
  
  // 预处理搜索词：分词
  const keywords = query.trim().split(/\s+/).filter(w => w.length > 0);
  
  let highlightedText = text;
  keywords.forEach(keyword => {
    // 使用正则表达式进行不区分大小写的匹配
    const regex = new RegExp(`(${keyword})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<mark class="bg-primary/20 text-primary font-medium px-1 rounded">$1</mark>');
  });
  
  return highlightedText;
};

// 获取搜索历史（从localStorage）
const getSearchHistory = (): string[] => {
  try {
    const history = localStorage.getItem('searchHistory');
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
};

// 保存搜索历史
const saveSearchHistory = (keyword: string) => {
  try {
    let history = getSearchHistory();
    // 移除重复项
    history = history.filter(item => item !== keyword);
    // 添加到开头
    history.unshift(keyword);
    // 只保留最近10条
    history = history.slice(0, 10);
    localStorage.setItem('searchHistory', JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save search history:', error);
  }
};

// 清除搜索历史
const clearSearchHistory = () => {
  try {
    localStorage.removeItem('searchHistory');
  } catch (error) {
    console.error('Failed to clear search history:', error);
  }
};

interface SearchKeyword {
  id: string;
  keyword: string;
  search_count: number;
  last_searched_at: string;
  created_at: string;
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(query);
  const [loading, setLoading] = useState(false);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [hotKeywords, setHotKeywords] = useState<SearchKeyword[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadHotKeywords();
    setSearchHistory(getSearchHistory());
  }, []);

  useEffect(() => {
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [query]);

  const loadHotKeywords = async () => {
    try {
      const keywords = await getHotSearchKeywords(8);
      setHotKeywords(keywords);
    } catch (error) {
      console.error("Failed to load hot keywords:", error);
    }
  };

  const performSearch = async (keyword: string) => {
    if (!keyword.trim()) return;

    setLoading(true);
    setShowSuggestions(false);
    try {
      const results = await searchContent(keyword.trim());
      // 暂时使用空数组，后续需要从 API 获取真实数据
      setDownloads([]);
      setVideos([]);
      setProducts(results.products);
      setQuestions(results.questions);

      // Record search keyword
      await recordSearchKeyword(keyword.trim());
      
      // Save to search history
      saveSearchHistory(keyword.trim());
      setSearchHistory(getSearchHistory());
      
      // Reload hot keywords after search
      loadHotKeywords();
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
  };

  const handleHotKeywordClick = (keyword: string) => {
    setSearchQuery(keyword);
    setSearchParams({ q: keyword });
    setShowSuggestions(false);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchParams({});
    setDownloads([]);
    setVideos([]);
    setProducts([]);
    setQuestions([]);
  };
  
  const handleClearHistory = () => {
    clearSearchHistory();
    setSearchHistory([]);
  };
  
  const handleInputFocus = () => {
    if (searchHistory.length > 0 || hotKeywords.length > 0) {
      setShowSuggestions(true);
    }
  };
  
  const handleInputBlur = () => {
    // 延迟关闭，以便点击建议项
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const totalResults = downloads.length + videos.length + products.length + questions.length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <PageMeta 
        title={query ? `Search Results for "${query}"` : "Search"}
        description="Search downloads, videos, products, and Q&A content"
        keywords="search, find, downloads, videos, products, questions"
      />
      
      {/* Hero Search Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Search Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold mb-2 gradient-text">
                Discover Everything
              </h1>
              <p className="text-muted-foreground text-lg">
                Search across downloads, videos, products, and community Q&A
              </p>
            </div>

            {/* Search Bar */}
            <Card className="shadow-xl border-primary/20">
              <CardContent className="p-6">
                <form onSubmit={handleSearch} className="relative">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search for downloads, videos, products, or ask questions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      className="pl-12 pr-32 h-14 text-lg"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      {searchQuery && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleClearSearch}
                          className="h-10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        type="submit"
                        size="lg"
                        className="h-10"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                            Searching...
                          </>
                        ) : (
                          "Search"
                        )}
                      </Button>
                    </div>
                  </div>
                </form>

                {/* Search Suggestions Dropdown */}
                {showSuggestions && (searchHistory.length > 0 || hotKeywords.length > 0) && (
                  <div className="absolute left-0 right-0 mt-2 bg-card border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    {/* Search History */}
                    {searchHistory.length > 0 && (
                      <div className="p-4 border-b">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <History className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Recent Searches</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearHistory}
                            className="h-6 text-xs"
                          >
                            Clear
                          </Button>
                        </div>
                        <div className="space-y-1">
                          {searchHistory.slice(0, 5).map((keyword, index) => (
                            <button
                              key={index}
                              onClick={() => handleHotKeywordClick(keyword)}
                              className="w-full text-left px-3 py-2 rounded hover:bg-muted transition-colors flex items-center gap-2 group"
                            >
                              <Clock className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                              <span className="text-sm">{keyword}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Hot Keywords */}
                    {hotKeywords.length > 0 && (
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Trending Searches</span>
                        </div>
                        <div className="space-y-1">
                          {hotKeywords.slice(0, 5).map((keyword) => (
                            <button
                              key={keyword.id}
                              onClick={() => handleHotKeywordClick(keyword.keyword)}
                              className="w-full text-left px-3 py-2 rounded hover:bg-muted transition-colors flex items-center justify-between group"
                            >
                              <span className="text-sm">{keyword.keyword}</span>
                              <Badge variant="secondary" className="text-xs">
                                {keyword.search_count}
                              </Badge>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Hot Keywords */}
                {hotKeywords.length > 0 && !query && (
                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Trending Searches
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {hotKeywords.map((keyword) => (
                        <Button
                          key={keyword.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleHotKeywordClick(keyword.keyword)}
                          className="rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          {keyword.keyword}
                          <Badge variant="secondary" className="ml-2 rounded-full">
                            {keyword.search_count}
                          </Badge>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Search Results Section */}
      {query && (
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Results Summary */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">
                  Search results for <span className="text-foreground font-semibold text-lg">"{query}"</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Found <span className="font-medium text-primary">{totalResults}</span> results
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <Skeleton className="w-24 h-24 rounded bg-muted" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-6 w-3/4 bg-muted" />
                          <Skeleton className="h-4 w-full bg-muted" />
                          <Skeleton className="h-4 w-2/3 bg-muted" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Results Tabs */}
            {!loading && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-5 h-auto p-1">
                  <TabsTrigger value="all" className="flex flex-col gap-1 py-3">
                    <span className="font-semibold">All</span>
                    <span className="text-xs text-muted-foreground">{totalResults}</span>
                  </TabsTrigger>
                  <TabsTrigger value="downloads" className="flex flex-col gap-1 py-3">
                    <span className="font-semibold">Downloads</span>
                    <span className="text-xs text-muted-foreground">{downloads.length}</span>
                  </TabsTrigger>
                  <TabsTrigger value="videos" className="flex flex-col gap-1 py-3">
                    <span className="font-semibold">Videos</span>
                    <span className="text-xs text-muted-foreground">{videos.length}</span>
                  </TabsTrigger>
                  <TabsTrigger value="products" className="flex flex-col gap-1 py-3">
                    <span className="font-semibold">Products</span>
                    <span className="text-xs text-muted-foreground">{products.length}</span>
                  </TabsTrigger>
                  <TabsTrigger value="questions" className="flex flex-col gap-1 py-3">
                    <span className="font-semibold">Q&A</span>
                    <span className="text-xs text-muted-foreground">{questions.length}</span>
                  </TabsTrigger>
                </TabsList>

                {/* All Tab */}
                <TabsContent value="all" className="space-y-8 mt-6">
                  {totalResults === 0 && (
                    <Card className="border-dashed">
                      <CardContent className="py-16 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                          <Search className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
                        <p className="text-muted-foreground mb-4">
                          Try adjusting your search terms or browse our categories
                        </p>
                        <Button variant="outline" asChild>
                          <Link to="/">Back to Home</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Downloads Section */}
                  {downloads.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Download className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-bold">Downloads</h3>
                        <Badge variant="secondary">{downloads.length}</Badge>
                      </div>
                      <div className="grid gap-4">
                        {downloads.map((download) => (
                          <Link key={download.id} to={`/downloads/${download.slug}`}>
                            <Card className="group hover:shadow-lg hover:border-primary/50 transition-all duration-300">
                              <CardContent className="p-6">
                                <div className="flex items-start gap-6">
                                  <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-lg bg-primary/10">
                                    <Download className="h-8 w-8 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 
                                      className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2"
                                      dangerouslySetInnerHTML={{ __html: highlightText(download.name, query) }}
                                    />
                                    {download.description && (
                                      <p 
                                        className="text-muted-foreground text-sm mb-3 line-clamp-2"
                                        dangerouslySetInnerHTML={{ __html: highlightText(download.description, query) }}
                                      />
                                    )}
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(download.created_at)}
                                      </span>
                                      {download.file_size && (
                                        <span className="flex items-center gap-1">
                                          {(download.file_size / 1024 / 1024).toFixed(2)} MB
                                        </span>
                                      )}
                                      {download.download_count !== undefined && (
                                        <span className="flex items-center gap-1">
                                          {download.download_count} downloads
                                        </span>
                                      )}
                                      {download.category && (
                                        <Badge variant="outline" className="rounded-full">
                                          {download.category.name}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Videos Section */}
                  {videos.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Video className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-bold">Videos</h3>
                        <Badge variant="secondary">{videos.length}</Badge>
                      </div>
                      <div className="grid gap-4">
                        {videos.map((video) => (
                          <Link key={video.id} to={`/videos/${video.slug}`}>
                            <Card className="group hover:shadow-lg hover:border-primary/50 transition-all duration-300">
                              <CardContent className="p-6">
                                <div className="flex items-start gap-6">
                                  {video.thumbnail_url ? (
                                    <div className="w-32 h-32 flex-shrink-0 overflow-hidden rounded-lg bg-muted relative">
                                      <img
                                        src={video.thumbnail_url}
                                        alt={video.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                        <Video className="h-8 w-8 text-white" />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-32 h-32 flex-shrink-0 flex items-center justify-center rounded-lg bg-primary/10">
                                      <Video className="h-12 w-12 text-primary" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h4 
                                      className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2"
                                      dangerouslySetInnerHTML={{ __html: highlightText(video.title, query) }}
                                    />
                                    {video.description && (
                                      <p 
                                        className="text-muted-foreground text-sm mb-3 line-clamp-2"
                                        dangerouslySetInnerHTML={{ __html: highlightText(video.description, query) }}
                                      />
                                    )}
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(video.created_at)}
                                      </span>
                                      {video.duration && (
                                        <span className="flex items-center gap-1">
                                          {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                                        </span>
                                      )}
                                      {video.view_count !== undefined && (
                                        <span className="flex items-center gap-1">
                                          {video.view_count} views
                                        </span>
                                      )}
                                      {video.category && (
                                        <Badge variant="outline" className="rounded-full">
                                          {video.category.name}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Products Section */}
                  {products.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Package className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-bold">Products</h3>
                        <Badge variant="secondary">{products.length}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {products.map((product) => (
                          <Link key={product.id} to={`/products/${product.slug}`}>
                            <Card className="group hover:shadow-xl hover:border-primary/50 transition-all duration-300 h-full">
                              {product.images && product.images.length > 0 && (
                                <div className="aspect-square w-full overflow-hidden rounded-t-lg bg-muted">
                                  <img
                                    src={product.images[0].image_url}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  />
                                </div>
                              )}
                              <CardHeader className="p-4">
                                <CardTitle 
                                  className="line-clamp-2 group-hover:text-primary transition-colors text-sm"
                                  dangerouslySetInnerHTML={{ __html: highlightText(product.name, query) }}
                                />
                              </CardHeader>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Questions Section */}
                  {questions.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <MessageCircle className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-bold">Q&A</h3>
                        <Badge variant="secondary">{questions.length}</Badge>
                      </div>
                      <div className="grid gap-4">
                        {questions.map((question) => (
                          <Link key={question.id} to={`/questions/${question.id}`}>
                            <Card className="group hover:shadow-lg hover:border-primary/50 transition-all duration-300">
                              <CardContent className="p-6">
                                <h4 
                                  className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2"
                                  dangerouslySetInnerHTML={{ __html: highlightText(question.title, query) }}
                                />
                                <p 
                                  className="text-muted-foreground text-sm mb-3 line-clamp-2"
                                  dangerouslySetInnerHTML={{ __html: highlightText(stripHtml(question.content), query) }}
                                />
                                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(question.created_at)}
                                  </span>
                                  {question.category && (
                                    <Badge variant="outline" className="rounded-full">
                                      {question.category.name}
                                    </Badge>
                                  )}
                                  {question.answers && question.answers.length > 0 && (
                                    <Badge variant="secondary" className="rounded-full">
                                      {question.answers.length} {question.answers.length === 1 ? 'answer' : 'answers'}
                                    </Badge>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Downloads Tab */}
                <TabsContent value="downloads" className="space-y-4 mt-6">
                  {downloads.length === 0 && (
                    <Card className="border-dashed">
                      <CardContent className="py-16 text-center">
                        <Download className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Downloads Found</h3>
                        <p className="text-muted-foreground">
                          Try different keywords or browse all downloads
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  <div className="grid gap-4">
                    {downloads.map((download) => (
                      <Link key={download.id} to={`/downloads/${download.slug}`}>
                        <Card className="group hover:shadow-lg hover:border-primary/50 transition-all duration-300">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-6">
                              <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-lg bg-primary/10">
                                <Download className="h-8 w-8 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 
                                  className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2"
                                  dangerouslySetInnerHTML={{ __html: highlightText(download.name, query) }}
                                />
                                {download.description && (
                                  <p 
                                    className="text-muted-foreground text-sm mb-3 line-clamp-2"
                                    dangerouslySetInnerHTML={{ __html: highlightText(download.description, query) }}
                                  />
                                )}
                                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(download.created_at)}
                                  </span>
                                  {download.file_size && (
                                    <span className="flex items-center gap-1">
                                      {(download.file_size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                  )}
                                  {download.download_count !== undefined && (
                                    <span className="flex items-center gap-1">
                                      {download.download_count} downloads
                                    </span>
                                  )}
                                  {download.category && (
                                    <Badge variant="outline" className="rounded-full">
                                      {download.category.name}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </TabsContent>

                {/* Videos Tab */}
                <TabsContent value="videos" className="space-y-4 mt-6">
                  {videos.length === 0 && (
                    <Card className="border-dashed">
                      <CardContent className="py-16 text-center">
                        <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Videos Found</h3>
                        <p className="text-muted-foreground">
                          Try different keywords or browse all videos
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  <div className="grid gap-4">
                    {videos.map((video) => (
                      <Link key={video.id} to={`/videos/${video.slug}`}>
                        <Card className="group hover:shadow-lg hover:border-primary/50 transition-all duration-300">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-6">
                              {video.thumbnail_url ? (
                                <div className="w-32 h-32 flex-shrink-0 overflow-hidden rounded-lg bg-muted relative">
                                  <img
                                    src={video.thumbnail_url}
                                    alt={video.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <Video className="h-8 w-8 text-white" />
                                  </div>
                                </div>
                              ) : (
                                <div className="w-32 h-32 flex-shrink-0 flex items-center justify-center rounded-lg bg-primary/10">
                                  <Video className="h-12 w-12 text-primary" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 
                                  className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2"
                                  dangerouslySetInnerHTML={{ __html: highlightText(video.title, query) }}
                                />
                                {video.description && (
                                  <p 
                                    className="text-muted-foreground text-sm mb-3 line-clamp-2"
                                    dangerouslySetInnerHTML={{ __html: highlightText(video.description, query) }}
                                  />
                                )}
                                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(video.created_at)}
                                  </span>
                                  {video.duration && (
                                    <span className="flex items-center gap-1">
                                      {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                                    </span>
                                  )}
                                  {video.view_count !== undefined && (
                                    <span className="flex items-center gap-1">
                                      {video.view_count} views
                                    </span>
                                  )}
                                  {video.category && (
                                    <Badge variant="outline" className="rounded-full">
                                      {video.category.name}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </TabsContent>

                {/* Products Tab */}
                <TabsContent value="products" className="mt-6">
                  {products.length === 0 && (
                    <Card className="border-dashed">
                      <CardContent className="py-16 text-center">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
                        <p className="text-muted-foreground">
                          Try different keywords or browse all products
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((product) => (
                      <Link key={product.id} to={`/products/${product.slug}`}>
                        <Card className="group hover:shadow-xl hover:border-primary/50 transition-all duration-300 h-full">
                          {product.images && product.images.length > 0 && (
                            <div className="aspect-square w-full overflow-hidden rounded-t-lg bg-muted">
                              <img
                                src={product.images[0].image_url}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <CardHeader className="p-4">
                            <CardTitle 
                              className="line-clamp-2 group-hover:text-primary transition-colors text-sm"
                              dangerouslySetInnerHTML={{ __html: highlightText(product.name, query) }}
                            />
                          </CardHeader>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </TabsContent>

                {/* Questions Tab */}
                <TabsContent value="questions" className="space-y-4 mt-6">
                  {questions.length === 0 && (
                    <Card className="border-dashed">
                      <CardContent className="py-16 text-center">
                        <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Q&A Found</h3>
                        <p className="text-muted-foreground">
                          Try different keywords or browse all questions
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  <div className="grid gap-4">
                    {questions.map((question) => (
                      <Link key={question.id} to={`/questions/${question.id}`}>
                        <Card className="group hover:shadow-lg hover:border-primary/50 transition-all duration-300">
                          <CardContent className="p-6">
                            <h4 
                              className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2"
                              dangerouslySetInnerHTML={{ __html: highlightText(question.title, query) }}
                            />
                            <p 
                              className="text-muted-foreground text-sm mb-3 line-clamp-2"
                              dangerouslySetInnerHTML={{ __html: highlightText(stripHtml(question.content), query) }}
                            />
                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(question.created_at)}
                              </span>
                              {question.category && (
                                <Badge variant="outline" className="rounded-full">
                                  {question.category.name}
                                </Badge>
                              )}
                              {question.answers && question.answers.length > 0 && (
                                <Badge variant="secondary" className="rounded-full">
                                  {question.answers.length} {question.answers.length === 1 ? 'answer' : 'answers'}
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
