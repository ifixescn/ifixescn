import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getActiveBanners } from "@/db/api";
import type { Banner } from "@/types";

export default function HeroBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const data = await getActiveBanners();
      setBanners(data);
      setLoading(false);
    } catch (error) {
      console.error("加载Banner失败:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAutoPlaying || banners.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isAutoPlaying, banners.length]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className="relative w-full h-[500px] xl:h-[600px] bg-gradient-to-br from-primary/5 via-background to-background animate-pulse" />
    );
  }

  if (banners.length === 0) {
    return (
      <section className="relative w-full h-[500px] xl:h-[600px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background" />
        <div className="relative z-10 container mx-auto h-full flex items-center justify-center px-4">
          <div className="max-w-4xl text-center space-y-6">
            <h1 className="text-4xl xl:text-6xl font-bold tracking-tight">
              <span className="gradient-text">欢迎来到我们的平台</span>
            </h1>
            <p className="text-xl xl:text-2xl text-muted-foreground">
              专业的内容管理系统，助力您的业务增长
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Button size="lg" asChild>
                <Link to="/articles">浏览文章</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/products">查看产品</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const currentBanner = banners[currentIndex];

  return (
    <section className="relative w-full h-[500px] xl:h-[600px] overflow-hidden group">
      {/* 背景图片 */}
      <div className="absolute inset-0">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={banner.image_url}
              alt={banner.title}
              className="w-full h-full object-cover"
            />
            {/* 渐变遮罩 */}
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/30" />
          </div>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="relative z-10 container mx-auto h-full flex items-center px-4">
        <div className="max-w-3xl space-y-6 xl:space-y-8">
          {/* 标题 */}
          <h1 className="text-4xl xl:text-6xl font-bold tracking-tight leading-tight">
            <span className="block text-foreground animate-fade-in">
              {currentBanner.title}
            </span>
          </h1>

          {/* 副标题 */}
          {currentBanner.subtitle && (
            <p className="text-lg xl:text-2xl text-muted-foreground leading-relaxed animate-fade-in-delay">
              {currentBanner.subtitle}
            </p>
          )}

          {/* CTA按钮 */}
          {currentBanner.link_url && (
            <div className="flex flex-wrap gap-4 pt-4 animate-fade-in-delay-2">
              <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-shadow">
                <Link to={currentBanner.link_url}>
                  {currentBanner.link_text || "了解更多"}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 导航按钮 */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background transition-all opacity-0 group-hover:opacity-100"
            aria-label="上一张"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background transition-all opacity-0 group-hover:opacity-100"
            aria-label="下一张"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* 指示器 */}
      {banners.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "w-8 bg-primary"
                  : "w-2 bg-background/60 hover:bg-background/80"
              }`}
              aria-label={`跳转到第 ${index + 1} 张`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
