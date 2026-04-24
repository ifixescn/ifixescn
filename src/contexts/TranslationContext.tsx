import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { supabase } from "@/db/supabase";
import { getTranslation } from "@/i18n/translations";

export interface Language {
  id: string;
  language_code: string;
  language_name: string;
  native_name: string;
  flag_emoji: string;
  is_enabled: boolean;
  is_default: boolean;
  sort_order: number;
}

interface TranslationContextType {
  currentLang: string;
  defaultLang: string;
  languages: Language[];
  isLoading: boolean;
  isDefaultLang: boolean;
  /** 静态 UI 文字翻译（本地字典，瞬时响应） */
  t: (key: string, fallback?: string) => string;
  /** 动态内容翻译（调用 Edge Function，带缓存） */
  translateText: (text: string, targetLang?: string) => Promise<string>;
  setLanguage: (code: string) => void;
  reloadLanguages: () => Promise<Language[]>;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

const LANG_STORAGE_KEY = "ifixes_lang";
/** localStorage 动态内容翻译缓存前缀 */
const CACHE_PREFIX = "i18n_cache_";

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [currentLang, setCurrentLang] = useState<string>("en");
  const [defaultLang, setDefaultLang] = useState<string>("en");
  const [isLoading, setIsLoading] = useState(true);
  // 内存中的翻译缓存，避免重复网络请求
  const memCache = useRef<Map<string, string>>(new Map());

  // 加载可用语言列表
  const reloadLanguages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("language_settings")
        .select("*")
        .eq("is_enabled", true)
        .order("sort_order");
      if (error) throw error;
      const langs: Language[] = data || [];
      setLanguages(langs);
      const def = langs.find((l) => l.is_default);
      if (def) setDefaultLang(def.language_code);
      return langs;
    } catch (err) {
      console.error("加载语言列表失败:", err);
      return [] as Language[];
    }
  }, []);

  // 浏览器语言检测
  const detectBrowserLang = useCallback((langs: Language[]): string => {
    const browserLangs = navigator.languages?.length ? [...navigator.languages] : [navigator.language];
    for (const bl of browserLangs) {
      const exact = langs.find((l) => l.language_code.toLowerCase() === bl.toLowerCase());
      if (exact) return exact.language_code;
      const mainCode = bl.split("-")[0].toLowerCase();
      const partial = langs.find((l) => l.language_code.toLowerCase().startsWith(mainCode));
      if (partial) return partial.language_code;
    }
    return langs.find((l) => l.is_default)?.language_code || "en";
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const langs = await reloadLanguages();
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved && langs.find((l) => l.language_code === saved)) {
        setCurrentLang(saved);
      } else {
        const detected = detectBrowserLang(langs);
        setCurrentLang(detected);
        localStorage.setItem(LANG_STORAGE_KEY, detected);
      }
      setIsLoading(false);
    };
    init();

    // Supabase Realtime 监听语言设置变更，实时同步前端语言列表
    const channel = supabase
      .channel("language_settings_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "language_settings" }, () => {
        reloadLanguages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [reloadLanguages, detectBrowserLang]);

  // 切换语言，清空内存缓存以让新语言重新翻译
  const setLanguage = useCallback((code: string) => {
    setCurrentLang(code);
    localStorage.setItem(LANG_STORAGE_KEY, code);
    memCache.current.clear();
  }, []);

  // ——— 静态 UI 文字翻译（本地字典，瞬时响应）———
  const t = useCallback(
    (key: string, fallback?: string): string => {
      return getTranslation(currentLang, key, fallback);
    },
    [currentLang]
  );

  // ——— 动态内容翻译（Edge Function + 缓存）———
  const translateText = useCallback(
    async (text: string, targetLang?: string): Promise<string> => {
      const target = targetLang || currentLang;
      if (!text || !text.trim()) return text;
      if (target === defaultLang) return text;

      // 检查内存缓存
      const cacheKey = `${target}:${text}`;
      if (memCache.current.has(cacheKey)) return memCache.current.get(cacheKey)!;

      // 检查 localStorage 缓存
      const lsKey = `${CACHE_PREFIX}${cacheKey}`;
      const lsCached = localStorage.getItem(lsKey);
      if (lsCached) {
        memCache.current.set(cacheKey, lsCached);
        return lsCached;
      }

      try {
        const { data, error } = await supabase.functions.invoke("translate-text", {
          body: { text, sourceLang: defaultLang, targetLang: target, useCache: true },
        });
        if (error) {
          const msg = await error?.context?.text?.();
          console.error("翻译请求失败:", msg || error.message);
          return text;
        }
        const result = (data as { translated: string })?.translated || text;
        // 写入双层缓存
        memCache.current.set(cacheKey, result);
        try { localStorage.setItem(lsKey, result); } catch { /* localStorage 写满时忽略 */ }
        return result;
      } catch (err) {
        console.error("翻译异常:", err);
        return text;
      }
    },
    [currentLang, defaultLang]
  );

  const isDefaultLang = currentLang === defaultLang;

  return (
    <TranslationContext.Provider
      value={{ currentLang, defaultLang, languages, isLoading, isDefaultLang, t, translateText, setLanguage, reloadLanguages }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(TranslationContext);
  if (!ctx) throw new Error("useTranslation 必须在 TranslationProvider 内使用");
  return ctx;
}
