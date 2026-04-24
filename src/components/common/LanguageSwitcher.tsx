import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  variant?: "header" | "mobile" | "compact";
  className?: string;
}

export default function LanguageSwitcher({ variant = "header", className }: LanguageSwitcherProps) {
  const { languages, currentLang, setLanguage, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeLangs = languages.filter((l) => l.is_enabled);
  const current = activeLangs.find((l) => l.language_code === currentLang) ?? activeLangs[0];

  // 点击外部关闭下拉
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const handleSelect = (code: string) => {
    setLanguage(code);
    setOpen(false);
  };

  if (activeLangs.length <= 1) return null;

  // 移动端：内嵌列表，直接点击，无弹层
  if (variant === "mobile") {
    return (
      <div className={cn("space-y-1", className)}>
        <p className="text-xs font-semibold text-muted-foreground px-3 py-1 uppercase tracking-wider">
          🌐 {t("header.language", "Language")}
        </p>
        {activeLangs.map((lang) => {
          const isActive = currentLang === lang.language_code;
          return (
            <button
              key={lang.language_code}
              type="button"
              onClick={() => handleSelect(lang.language_code)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all",
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <span className="text-lg leading-none">{lang.flag_emoji}</span>
              <span className="flex-1 text-left">{lang.native_name}</span>
              {isActive && <Check className="h-4 w-4 shrink-0" />}
            </button>
          );
        })}
      </div>
    );
  }

  // Header / compact —— 纯 CSS absolute 定位，完全不使用 Radix Portal
  // 解决 backdrop-blur stacking context + NavigationMenu 事件拦截双重冲突
  const isCompact = variant === "compact";

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* 触发按钮 */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-1.5 rounded-md font-medium transition-colors hover:bg-accent",
          isCompact ? "h-8 px-2 text-xs" : "h-9 px-3 text-sm"
        )}
      >
        <Globe className={cn("shrink-0 text-muted-foreground", isCompact ? "h-3.5 w-3.5" : "h-4 w-4")} />
        {isCompact ? (
          <span className="uppercase tracking-wide">{(currentLang ?? "en").split("-")[0]}</span>
        ) : (
          <span className="hidden sm:flex items-center gap-1.5">
            <span>{current?.flag_emoji}</span>
            <span>{current?.native_name || "Language"}</span>
          </span>
        )}
        <span className="flex sm:hidden">{current?.flag_emoji}</span>
        <ChevronDown
          className={cn(
            "opacity-50 transition-transform duration-200 shrink-0",
            isCompact ? "h-3 w-3" : "h-3.5 w-3.5",
            open ? "rotate-180" : ""
          )}
        />
      </button>

      {/* 下拉面板 —— absolute 定位，不出 DOM 树，无 portal stacking 问题 */}
      {open && (
        <div
          className={cn(
            "absolute right-0 top-full mt-1.5 rounded-lg border border-border bg-popover text-popover-foreground shadow-xl",
            isCompact ? "w-44" : "w-56"
          )}
          style={{ zIndex: 9999 }}
        >
          <p className="flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground border-b border-border">
            <Globe className="h-3.5 w-3.5" />
            {t("lang.switchLanguage", "Switch Language")}
          </p>
          <div className="max-h-72 overflow-y-auto p-1">
            {activeLangs.map((lang) => {
              const isActive = currentLang === lang.language_code;
              return (
                <button
                  key={lang.language_code}
                  type="button"
                  onMouseDown={(e) => {
                    // onMouseDown + preventDefault：防止 blur 先于选择触发
                    e.preventDefault();
                    handleSelect(lang.language_code);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-left text-sm transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground font-medium"
                      : "hover:bg-accent/70 text-foreground"
                  )}
                >
                  <span className="text-lg leading-none shrink-0">{lang.flag_emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none truncate">{lang.native_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{lang.language_name}</p>
                  </div>
                  {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
