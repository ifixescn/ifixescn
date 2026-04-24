import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { cn } from "@/lib/utils";
import { ElementType, ComponentPropsWithoutRef } from "react";

interface ScrollAnimationWrapperProps {
  children: React.ReactNode;
  className?: string;
  animation?: "fade-in" | "fade-in-left" | "fade-in-right" | "scale-in";
  delay?: number;
  as?: ElementType;
}

/**
 * Wrapper component for scroll-triggered animations
 * Linear.app style scroll animations
 * 
 * @example
 * <ScrollAnimationWrapper animation="fade-in">
 *   <div>Your content here</div>
 * </ScrollAnimationWrapper>
 */
export default function ScrollAnimationWrapper({
  children,
  className,
  animation = "fade-in",
  delay = 0,
  as: Component = "div",
}: ScrollAnimationWrapperProps) {
  const { elementRef, isVisible } = useScrollAnimation({
    threshold: 0.1,
    rootMargin: "0px 0px -100px 0px",
    triggerOnce: true,
  });

  const animationClass = {
    "fade-in": "scroll-fade-in",
    "fade-in-left": "scroll-fade-in-left",
    "fade-in-right": "scroll-fade-in-right",
    "scale-in": "scroll-scale-in",
  }[animation];

  const delayClass = delay > 0 ? `scroll-delay-${delay}` : "";

  return (
    <Component
      ref={elementRef}
      className={cn(
        animationClass,
        delayClass,
        isVisible && "visible",
        className
      )}
    >
      {children}
    </Component>
  );
}
