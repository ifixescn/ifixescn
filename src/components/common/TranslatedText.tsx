import { useState, useEffect, useRef, ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/contexts/TranslationContext";

interface TranslatedTextProps {
  /** 需要翻译的原始英文文本 */
  text: string;
  /** 是否显示为 block 元素（默认 inline-block） */
  block?: boolean;
  /** 加载中骨架屏高度（默认 1em） */
  skeletonH?: string;
  /** 加载中骨架屏宽度（默认 80%） */
  skeletonW?: string;
  /** 自定义 className */
  className?: string;
  /** 当翻译后可选渲染自定义节点 */
  children?: (translated: string) => ReactNode;
}

/**
 * TranslatedText - 动态内容异步翻译组件
 * 当前语言为默认语言时直接渲染原文，否则异步调用翻译并显示骨架屏。
 * 内置双层缓存（TranslationContext 内存 + localStorage），同文本不会重复请求。
 */
export default function TranslatedText({
  text,
  block = false,
  skeletonH = "1em",
  skeletonW = "80%",
  className,
  children,
}: TranslatedTextProps) {
  const { isDefaultLang, translateText, currentLang } = useTranslation();
  const [translated, setTranslated] = useState<string>(text);
  const [loading, setLoading] = useState(false);
  // 防止组件卸载后 setState
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!text || isDefaultLang) {
      setTranslated(text);
      return;
    }
    let cancelled = false;
    setLoading(true);
    translateText(text).then((result) => {
      if (!cancelled && mounted.current) {
        setTranslated(result);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [text, currentLang, isDefaultLang, translateText]);

  if (loading) {
    return (
      <Skeleton
        className="bg-muted rounded"
        style={{ height: skeletonH, width: skeletonW, display: block ? "block" : "inline-block" }}
      />
    );
  }

  if (children) return <>{children(translated)}</>;

  const Tag = block ? "div" : "span";
  return <Tag className={className}>{translated}</Tag>;
}
