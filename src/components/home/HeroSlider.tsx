import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getActiveSlides } from "@/db/api";
import type { SlideWithProduct } from "@/types";
import Autoplay from "embla-carousel-autoplay";
import { ArrowRight, ChevronRight } from "lucide-react";

export default function HeroSlider() {
  const [slides, setSlides] = useState<SlideWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveSlides().then((data) => {
      setSlides(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <section className="w-full">
        <Skeleton className="w-full h-[500px] xl:h-[600px] bg-muted" />
      </section>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  return (
    <section className="w-full overflow-hidden bg-background">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 6000,
            stopOnInteraction: false,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent>
          {slides.map((slide) => (
            <CarouselItem key={slide.id}>
              <div className="relative w-full h-[500px] xl:h-[600px] overflow-hidden">
                {/* 背景图片 */}
                <div className="absolute inset-0">
                  <img
                    src={slide.image_url}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* 简约渐变遮罩 - 大气企业风格 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>
                </div>
                
                {/* 内容区域 - 简约大气布局 */}
                <div className="relative h-full flex items-center">
                  <div className="container mx-auto px-6 xl:px-16">
                    <div className="max-w-3xl space-y-6 xl:space-y-8">
                      {/* 标题 - 大气简约 */}
                      <h1 className="text-4xl xl:text-6xl font-light text-white tracking-tight leading-tight">
                        {slide.title}
                      </h1>
                      
                      {/* 描述 - 精炼文案 */}
                      {slide.description && (
                        <p className="text-lg xl:text-2xl text-white/95 font-light leading-relaxed max-w-2xl">
                          {slide.description}
                        </p>
                      )}
                      
                      {/* 行动按钮 - 简约设计 */}
                      <div className="flex items-center gap-6 pt-4">
                        {slide.product && (
                          <>
                            <Button 
                              size="lg" 
                              asChild 
                              className="h-12 xl:h-14 px-8 xl:px-10 text-base xl:text-lg font-normal bg-white text-black hover:bg-white/90 shadow-2xl"
                            >
                              <Link to={`/products/${slide.product.slug}`}>
                                Explore Now
                                <ChevronRight className="ml-2 h-5 w-5" />
                              </Link>
                            </Button>
                            {slide.product.price && (
                              <div className="hidden xl:flex items-baseline gap-2">
                                <span className="text-sm text-white/70 font-light">Starting at</span>
                                <span className="text-3xl font-light text-white">
                                  ${slide.product.price}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                        {!slide.product && slide.link_url && (
                          <Button 
                            size="lg" 
                            asChild 
                            className="h-12 xl:h-14 px-8 xl:px-10 text-base xl:text-lg font-normal bg-white text-black hover:bg-white/90 shadow-2xl"
                          >
                            <Link to={slide.link_url}>
                              Learn More
                              <ChevronRight className="ml-2 h-5 w-5" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 底部装饰线 - 企业风格 */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent"></div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* 导航按钮 - 简约风格 */}
        {slides.length > 1 && (
          <>
            <CarouselPrevious className="left-6 xl:left-12 h-12 w-12 border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white" />
            <CarouselNext className="right-6 xl:right-12 h-12 w-12 border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white" />
          </>
        )}
      </Carousel>
    </section>
  );
}
