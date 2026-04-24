import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Globe, Settings2, ChevronUp, ChevronDown, Eye, EyeOff,
  RefreshCw, CheckCircle2, XCircle, Loader2, TestTube2,
  Info, BookOpen, ChevronRight, Languages, Wifi, WifiOff, Radio,
  Shield, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/db/supabase";
import { useTranslation } from "@/contexts/TranslationContext";

interface Language {
  id: string;
  language_code: string;
  language_name: string;
  native_name: string;
  flag_emoji: string;
  is_enabled: boolean;
  is_default: boolean;
  sort_order: number;
}

interface Engine {
  id: string;
  engine_key: string;
  engine_name: string;
  api_key: string;
  api_secret: string;
  is_active: boolean;
  priority: number;
}

interface TestResult {
  status: "idle" | "loading" | "success" | "error";
  message?: string;
  quotaExceeded?: boolean;
  isIPError?: boolean;
}

// 翻译引擎教程内容
const ENGINE_TUTORIALS: Record<string, { title: string; steps: string[] }> = {
  google: {
    title: "Google Translate API 配置教程",
    steps: [
      "访问 Google Cloud Console：https://console.cloud.google.com/",
      "新建项目（或选择已有项目），点击顶部「Select a project」>「New Project」",
      "在左侧菜单进入「APIs & Services」>「Library」，搜索 Cloud Translation API，点击「Enable」启用",
      "进入「APIs & Services」>「Credentials」，点击「Create Credentials」>「API key」",
      "复制生成的 API Key，填入上方「API Key」输入框",
      "建议在 API Key 限制中仅允许 Translation API，增强安全性",
      "注意：Google Translate API 按用量计费，每月前 50 万字符免费",
    ],
  },
  deepl: {
    title: "DeepL API 配置教程",
    steps: [
      "访问 DeepL 开发者平台：https://www.deepl.com/pro-api",
      "注册 DeepL 账号（如已有账号可直接登录）",
      "选择「DeepL API Free」套餐（每月免费 50 万字符）或付费套餐",
      "注册完成后进入 DeepL 账号设置页：https://www.deepl.com/account/summary",
      "找到「Authentication Key for DeepL API」，复制 API Key",
      "将 API Key 填入上方「API Key」输入框",
      "注意：免费版 API 地址为 api-free.deepl.com，付费版为 api.deepl.com，系统已自动处理",
    ],
  },
  baidu: {
    title: "百度翻译 API 配置教程",
    steps: [
      "访问百度翻译开放平台：https://fanyi-api.baidu.com/",
      "使用百度账号登录（如无账号需先注册）",
      "点击「开始使用」，完成开发者认证（需绑定手机号）",
      "进入「我的服务」页面，选择「通用文本翻译」，点击「立即开通」",
      "开通成功后，在「开发者信息」页面找到「APP ID」和「密钥」",
      "将 APP ID 填入「APP ID」字段，将密钥填入「Secret Key」字段",
      "⚠️ 重要：在「开发者信息」→「服务器地址」中，将 IP 白名单设置为「不限制 IP」，否则云服务器调用会报 58000 错误",
      "标准版每月可免费翻译 5 万字符，高级版每月 100 万字符",
    ],
  },
};

// 百度 IP 白名单设置弹窗（58000 错误时触发）
const BaiduIPGuideDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const steps = [
    {
      title: "登录百度翻译开放平台",
      desc: "打开 https://fanyi-api.baidu.com 并使用百度账号登录。",
      link: "https://fanyi-api.baidu.com",
      linkText: "前往百度翻译开放平台 →",
    },
    {
      title: "进入「管理控制台」",
      desc: "点击右上角头像或「控制台」，进入已开通的服务管理页面。",
    },
    {
      title: "选择「通用文本翻译」服务",
      desc: "在左侧菜单找到「我的服务」→「通用文本翻译」，点击进入。",
    },
    {
      title: "进入「开发者信息」页面",
      desc: "在通用文本翻译服务页面，点击顶部「开发者信息」或「账户信息」选项卡。",
    },
    {
      title: "找到「服务器地址（白名单）」",
      desc: "页面中有一栏「服务器地址」或「IP 白名单」，默认可能填写了固定 IP。",
    },
    {
      title: "将白名单设置为「不限制 IP」",
      desc: "清空 IP 白名单输入框，或选择「不限制」选项，然后点击「保存」。云服务器 IP 动态变化，必须设为不限制才能正常调用。",
      highlight: true,
    },
    {
      title: "返回此页面重新测试",
      desc: "保存后稍等片刻，点击百度翻译卡片上的「测试连接」按钮，应显示「API 连接正常 ✓」。",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-amber-500" />
            百度翻译 IP 白名单设置指南
          </DialogTitle>
          <DialogDescription>
            检测到错误码 <span className="font-mono font-semibold text-destructive">58000</span>（客户端 IP 受限）。按以下步骤将 IP 白名单设为「不限制」即可解决。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`flex gap-3 p-3 rounded-lg border ${step.highlight ? "border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700" : "border-border bg-muted/30"}`}
            >
              <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step.highlight ? "bg-amber-500 text-white" : "bg-primary/15 text-primary"}`}>
                {i + 1}
              </span>
              <div className="space-y-1 min-w-0">
                <p className={`text-sm font-medium ${step.highlight ? "text-amber-700 dark:text-amber-300" : "text-foreground"}`}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                {step.link && (
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {step.linkText}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            为什么需要设置「不限制 IP」？本站翻译请求通过云服务器（Supabase Edge Function）发出，
            其 IP 地址动态分配且无法固定，因此必须关闭 IP 白名单限制。
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            关闭
          </Button>
          <Button
            size="sm"
            asChild
          >
            <a href="https://fanyi-api.baidu.com" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              前往百度控制台
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function LanguageSettings() {
  const { reloadLanguages } = useTranslation();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [engines, setEngines] = useState<Engine[]>([]);
  const [loadingLangs, setLoadingLangs] = useState(true);
  const [loadingEngines, setLoadingEngines] = useState(true);
  const [savingLang, setSavingLang] = useState<string | null>(null);
  const [savingEngine, setSavingEngine] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [openTutorials, setOpenTutorials] = useState<Record<string, boolean>>({});
  const [cacheCount, setCacheCount] = useState<number>(0);
  const [clearingCache, setClearingCache] = useState(false);
  const [showIPGuide, setShowIPGuide] = useState(false);
  // 前端实时同步状态（Realtime 订阅心跳检测）
  const [syncStatus, setSyncStatus] = useState<"connected" | "disconnected" | "checking">("checking");
  const [connectivityResult, setConnectivityResult] = useState<{ status: "idle" | "loading" | "success" | "error"; message?: string }>({ status: "idle" });

  // 初始化时检测 Realtime 连接状态
  useEffect(() => {
    setSyncStatus("checking");
    const pingChannel = supabase
      .channel("admin_sync_probe")
      .on("postgres_changes", { event: "*", schema: "public", table: "language_settings" }, () => {})
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setSyncStatus("connected");
        else if (status === "CLOSED" || status === "CHANNEL_ERROR") setSyncStatus("disconnected");
      });
    const timer = setTimeout(() => {
      if (pingChannel.state !== "joined") setSyncStatus("disconnected");
    }, 6000);
    return () => { clearTimeout(timer); supabase.removeChannel(pingChannel); };
  }, []);

  // 加载语言列表
  const fetchLanguages = useCallback(async () => {
    setLoadingLangs(true);
    const { data, error } = await supabase.from("language_settings").select("*").order("sort_order");
    if (error) toast.error("加载语言列表失败");
    else setLanguages(data || []);
    setLoadingLangs(false);
  }, []);

  // 加载引擎列表，并在加载完成后自动测试百度连接
  // 解析翻译测试响应，提取 isIPError 等标志
  const parseTestResult = useCallback((
    result: { translated?: string; error?: string; quota_exceeded?: boolean; ip_error?: boolean } | null,
    engineId: string,
    autoOpenIPGuide = false
  ) => {
    if (!result) return;
    if (result.error) {
      const isIPErr = !!result.ip_error || /58000|IP.*受限|IP.*白名单/i.test(result.error);
      setTestResults((prev) => ({
        ...prev,
        [engineId]: {
          status: "error",
          message: result.error!,
          quotaExceeded: result.quota_exceeded,
          isIPError: isIPErr,
        },
      }));
      if (isIPErr && autoOpenIPGuide) setShowIPGuide(true);
    } else {
      setTestResults((prev) => ({
        ...prev,
        [engineId]: { status: "success", message: `连接正常，翻译结果: "${result.translated}"` },
      }));
    }
  }, []);

  const fetchEngines = useCallback(async () => {
    setLoadingEngines(true);
    const { data, error } = await supabase
      .from("translation_engine_settings")
      .select("*")
      .not("engine_key", "eq", "browser_detection")
      .order("priority", { ascending: true });
    if (error) toast.error("加载翻译引擎失败");
    else {
      const list: Engine[] = data || [];
      setEngines(list);
      // 自动测试百度连接
      const baiduEngine = list.find((e) => e.engine_key === "baidu");
      if (baiduEngine && baiduEngine.is_active && baiduEngine.api_key && baiduEngine.api_secret) {
        setTestResults((prev) => ({ ...prev, [baiduEngine.id]: { status: "loading" } }));
        try {
          const { data: td, error: te } = await supabase.functions.invoke("translate-text", {
            body: { text: "Hello", sourceLang: "en", targetLang: "zh-CN", testMode: true, engineKey: "baidu" },
          });
          if (te) {
            const msg = await te?.context?.text?.();
            setTestResults((prev) => ({ ...prev, [baiduEngine.id]: { status: "error", message: msg || te.message } }));
          } else {
            parseTestResult(td, baiduEngine.id, true);
          }
        } catch {
          setTestResults((prev) => ({ ...prev, [baiduEngine.id]: { status: "error", message: "自动检测失败，请手动点击「测试连接」" } }));
        }
      }
    }
    setLoadingEngines(false);
  }, [parseTestResult]);

  // 获取缓存数量
  const fetchCacheCount = useCallback(async () => {
    const { count } = await supabase.from("translation_cache").select("id", { count: "exact", head: true });
    setCacheCount(count || 0);
  }, []);

  useEffect(() => {
    fetchLanguages();
    fetchEngines();
    fetchCacheCount();
  }, [fetchLanguages, fetchEngines, fetchCacheCount]);

  // 切换语言启用/禁用
  const toggleLanguage = async (lang: Language) => {
    if (lang.is_default && lang.is_enabled) {
      toast.warning("默认语言不能禁用");
      return;
    }
    setSavingLang(lang.id);
    const { error } = await supabase
      .from("language_settings")
      .update({ is_enabled: !lang.is_enabled, updated_at: new Date().toISOString() })
      .eq("id", lang.id);
    if (error) {
      toast.error("更新失败");
    } else {
      toast.success(`${lang.native_name} 已${!lang.is_enabled ? "启用" : "禁用"}`);
      await fetchLanguages();
      await reloadLanguages();
    }
    setSavingLang(null);
  };

  // 设置默认语言
  const setDefaultLanguage = async (lang: Language) => {
    if (lang.is_default) return;
    if (!lang.is_enabled) {
      toast.warning("请先启用该语言再设为默认");
      return;
    }
    const currentDefault = languages.find((l) => l.is_default);
    const updates = [];
    if (currentDefault) {
      updates.push(supabase.from("language_settings").update({ is_default: false, updated_at: new Date().toISOString() }).eq("id", currentDefault.id));
    }
    updates.push(supabase.from("language_settings").update({ is_default: true, updated_at: new Date().toISOString() }).eq("id", lang.id));
    const results = await Promise.all(updates);
    const hasError = results.some((r) => r.error);
    if (hasError) {
      toast.error("设置默认语言失败");
    } else {
      toast.success(`${lang.native_name} 已设为默认语言`);
      await fetchLanguages();
      await reloadLanguages();
    }
  };

  // 更新排序
  const moveLanguage = async (lang: Language, direction: "up" | "down") => {
    const sorted = [...languages].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((l) => l.id === lang.id);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === sorted.length - 1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const swapLang = sorted[swapIdx];
    await Promise.all([
      supabase.from("language_settings").update({ sort_order: swapLang.sort_order, updated_at: new Date().toISOString() }).eq("id", lang.id),
      supabase.from("language_settings").update({ sort_order: lang.sort_order, updated_at: new Date().toISOString() }).eq("id", swapLang.id),
    ]);
    await fetchLanguages();
    await reloadLanguages();
  };

  // 更新引擎配置
  const updateEngineField = (engineId: string, field: "api_key" | "api_secret", value: string) => {
    // 保存时自动去除首尾空格，防止签名错误
    setEngines((prev) => prev.map((e) => (e.id === engineId ? { ...e, [field]: value } : e)));
  };

  const saveEngine = async (engine: Engine) => {
    setSavingEngine(engine.id);
    // 存储时去除首尾空格，确保签名计算正确
    const { error } = await supabase
      .from("translation_engine_settings")
      .update({ api_key: engine.api_key.trim(), api_secret: engine.api_secret.trim(), updated_at: new Date().toISOString() })
      .eq("id", engine.id);
    if (error) toast.error("保存引擎配置失败");
    else {
      // 更新本地状态（去除空格后的值）
      setEngines((prev) => prev.map((e) => e.id === engine.id ? { ...e, api_key: engine.api_key.trim(), api_secret: engine.api_secret.trim() } : e));
      toast.success(`${engine.engine_name} 配置已保存`);
    }
    setSavingEngine(null);
  };

  const toggleEngine = async (engine: Engine) => {
    setSavingEngine(engine.id);
    const { error } = await supabase
      .from("translation_engine_settings")
      .update({ is_active: !engine.is_active, updated_at: new Date().toISOString() })
      .eq("id", engine.id);
    if (error) {
      toast.error("更新失败");
    } else {
      toast.success(`${engine.engine_name} 已${!engine.is_active ? "启用" : "禁用"}`);
      await fetchEngines();
    }
    setSavingEngine(null);
  };

  // 连통性测试
  const testEngine = async (engine: Engine) => {
    setTestResults((prev) => ({ ...prev, [engine.id]: { status: "loading" } }));
    try {
      const { data, error } = await supabase.functions.invoke("translate-text", {
        body: { text: "Hello", sourceLang: "en", targetLang: "zh-CN", testMode: true, engineKey: engine.engine_key },
      });
      if (error) {
        const msg = await error?.context?.text?.();
        throw new Error(msg || error.message);
      }
      const isBaiduEngine = engine.engine_key === "baidu";
      parseTestResult(data, engine.id, isBaiduEngine);
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [engine.id]: { status: "error", message: err instanceof Error ? err.message : "连接失败" },
      }));
    }
  };
  // 清除翻译缓存
  const clearCache = async () => {
    setClearingCache(true);
    const { error } = await supabase.from("translation_cache").delete().gt("hit_count", -1);
    if (error) {
      toast.error("清除缓存失败");
    } else {
      toast.success("翻译缓存已清除");
      setCacheCount(0);
    }
    setClearingCache(false);
  };

  // 联通测试：向 Edge Function 发送测试请求
  const runConnectivityTest = async () => {
    setConnectivityResult({ status: "loading" });
    try {
      const start = Date.now();
      // 联通测试：不指定引擎，走正常优先级链路
      const { data, error } = await supabase.functions.invoke("translate-text", {
        body: { text: "Hello", sourceLang: "en", targetLang: "zh-CN", testMode: true },
      });
      if (error) {
        const msg = await error?.context?.text?.();
        throw new Error(msg || error.message);
      }
      const result = data as { translated?: string; error?: string; quota_exceeded?: boolean };
      if (result?.error) {
        setConnectivityResult({
          status: "error",
          message: result.quota_exceeded
            ? `配额已用完: ${result.error}`
            : result.error,
        });
        return;
      }
      const elapsed = Date.now() - start;
      setConnectivityResult({
        status: "success",
        message: `翻译引擎连通正常，响应 ${elapsed}ms，翻译结果："${result?.translated}"`,
      });
    } catch (err) {
      setConnectivityResult({
        status: "error",
        message: err instanceof Error ? err.message : "连接失败",
      });
    }
  };

  const enabledCount = languages.filter((l) => l.is_enabled).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* 百度 IP 白名单引导弹窗 */}
      <BaiduIPGuideDialog open={showIPGuide} onClose={() => setShowIPGuide(false)} />
      {/* 页头 */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Languages className="h-6 w-6 text-primary" />
            多语言设置
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">管理网站显示语言和翻译引擎配置</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Realtime 同步状态指示器 */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium"
            style={{
              background: syncStatus === "connected" ? "hsl(var(--accent))" : syncStatus === "disconnected" ? "hsl(var(--destructive)/0.1)" : "hsl(var(--muted))",
              borderColor: syncStatus === "connected" ? "hsl(var(--primary)/0.3)" : syncStatus === "disconnected" ? "hsl(var(--destructive)/0.4)" : "hsl(var(--border))",
            }}
          >
            {syncStatus === "connected" ? (
              <><Radio className="h-3.5 w-3.5 text-primary animate-pulse" /><span className="text-primary">前端实时同步已连接</span></>
            ) : syncStatus === "disconnected" ? (
              <><WifiOff className="h-3.5 w-3.5 text-destructive" /><span className="text-destructive">实时同步未连接</span></>
            ) : (
              <><Wifi className="h-3.5 w-3.5 text-muted-foreground animate-pulse" /><span className="text-muted-foreground">检测中...</span></>
            )}
          </div>
          <Badge variant="secondary">{enabledCount} 种语言已启用</Badge>
          <Badge variant="outline">{cacheCount} 条翻译缓存</Badge>
        </div>
      </div>

      {/* 联通测试卡片 */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-2">
              <Radio className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">后台 ↔ 前端联通测试</p>
                <p className="text-xs text-muted-foreground">验证翻译引擎 Edge Function 是否正常可用，语言设置变更通过 Supabase Realtime 实时推送到前端</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={runConnectivityTest}
                disabled={connectivityResult.status === "loading"}
              >
                {connectivityResult.status === "loading" ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <TestTube2 className="h-3.5 w-3.5 mr-1.5" />
                )}
                运行联通测试
              </Button>
              {connectivityResult.status !== "idle" && connectivityResult.status !== "loading" && (
                <div className={`flex items-center gap-1.5 text-sm max-w-xs ${connectivityResult.status === "success" ? "text-green-600" : "text-destructive"}`}>
                  {connectivityResult.status === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
                  <span className="text-xs">{connectivityResult.message}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="languages">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="languages">
            <Globe className="h-4 w-4 mr-2" />
            语言管理
          </TabsTrigger>
          <TabsTrigger value="engines">
            <Settings2 className="h-4 w-4 mr-2" />
            翻译引擎
          </TabsTrigger>
        </TabsList>

        {/* ===== 语言管理 Tab ===== */}
        <TabsContent value="languages" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">可用语言列表</CardTitle>
              <CardDescription>
                启用语言后，前端导航栏的语言切换器会自动显示该语言。至少需保留一种默认语言。
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingLangs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">排序</TableHead>
                      <TableHead>语言</TableHead>
                      <TableHead className="hidden md:table-cell">语言代码</TableHead>
                      <TableHead className="hidden sm:table-cell">状态</TableHead>
                      <TableHead>默认</TableHead>
                      <TableHead className="text-right">启用</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {languages.map((lang, idx) => (
                      <TableRow key={lang.id} className={!lang.is_enabled ? "opacity-50" : ""}>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => moveLanguage(lang, "up")}
                              disabled={idx === 0}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => moveLanguage(lang, "down")}
                              disabled={idx === languages.length - 1}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{lang.flag_emoji}</span>
                            <div>
                              <p className="font-medium text-sm">{lang.native_name}</p>
                              <p className="text-xs text-muted-foreground hidden sm:block">{lang.language_name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{lang.language_code}</code>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {lang.is_enabled ? (
                            <Badge variant="default" className="text-xs">已启用</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">已禁用</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {lang.is_default ? (
                            <Badge variant="outline" className="text-xs border-primary text-primary">默认</Badge>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-muted-foreground hover:text-foreground"
                              onClick={() => setDefaultLanguage(lang)}
                              disabled={!lang.is_enabled}
                            >
                              设为默认
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {savingLang === lang.id ? (
                            <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                          ) : (
                            <Switch
                              checked={lang.is_enabled}
                              onCheckedChange={() => toggleLanguage(lang)}
                              disabled={lang.is_default}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* 缓存管理 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                翻译缓存管理
              </CardTitle>
              <CardDescription>翻译结果会自动缓存以提高访问速度。当前共 {cacheCount} 条缓存记录。</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                onClick={clearCache}
                disabled={clearingCache || cacheCount === 0}
              >
                {clearingCache ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                清除所有翻译缓存
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== 翻译引擎 Tab ===== */}
        <TabsContent value="engines" className="space-y-4 mt-4">
          {/* 说明 */}
          <Card className="bg-muted/40 border-dashed">
            <CardContent className="pt-4 pb-3">
              <div className="flex gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                <p>
                  <strong className="text-foreground">百度翻译为当前主要引擎（优先级 #1）</strong>，DeepL 为备用引擎。
                  翻译时优先使用百度，若百度失败则自动切换至 DeepL。
                  页面加载时会自动检测百度 API 连接状态。
                </p>
              </div>
            </CardContent>
          </Card>

          {loadingEngines ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {[...engines].sort((a, b) => a.priority - b.priority).map((engine) => {
                const tutorial = ENGINE_TUTORIALS[engine.engine_key];
                const testResult = testResults[engine.id];
                const isBaidu = engine.engine_key === "baidu";
                const isPrimary = engine.priority === 1 && engine.is_active;

                return (
                  <Card key={engine.id} className={`${!engine.is_active ? "opacity-60" : ""} ${isPrimary ? "ring-2 ring-primary/40 shadow-md" : ""}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base">{engine.engine_name}</CardTitle>
                          {isPrimary && (
                            <Badge className="text-xs bg-primary text-primary-foreground gap-1">
                              ⭐ 主要引擎
                            </Badge>
                          )}
                          {engine.is_active ? (
                            <Badge variant="default" className="text-xs">已启用</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">已禁用</Badge>
                          )}
                          {!isPrimary && engine.is_active && (
                            <span className="text-xs text-muted-foreground">优先级 #{engine.priority}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {savingEngine === engine.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Switch
                              checked={engine.is_active}
                              onCheckedChange={() => toggleEngine(engine)}
                            />
                          )}
                        </div>
                      </div>
                    </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* API Key */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">
                              {isBaidu ? "APP ID" : "API Key"}
                            </label>
                            <div className="relative">
                              <Input
                                type={showKeys[`${engine.id}_key`] ? "text" : "password"}
                                value={engine.api_key}
                                onChange={(e) => updateEngineField(engine.id, "api_key", e.target.value)}
                                placeholder={isBaidu ? "输入百度 APP ID" : `输入 ${engine.engine_name} API Key`}
                                className="pr-10 font-mono text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => setShowKeys((prev) => ({ ...prev, [`${engine.id}_key`]: !prev[`${engine.id}_key`] }))}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showKeys[`${engine.id}_key`] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                            {/* DeepL Key 类型自动识别提示 */}
                            {engine.engine_key === "deepl" && engine.api_key && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {engine.api_key.trim().endsWith(":fx")
                                  ? "✅ 免费版 Key（以 :fx 结尾）→ 将使用 api-free.deepl.com"
                                  : "✅ 付费版 Key → 将使用 api.deepl.com"}
                              </p>
                            )}
                            {engine.engine_key === "deepl" && !engine.api_key && (
                              <p className="text-xs text-muted-foreground mt-1">
                                💡 免费版 Key 以 <code className="bg-muted px-1 rounded">:fx</code> 结尾，付费版无此后缀，系统自动识别端点。
                              </p>
                            )}
                          </div>

                          {/* Secret Key (仅百度) */}
                          {isBaidu && (
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">Secret Key</label>
                              <div className="relative">
                                <Input
                                  type={showKeys[`${engine.id}_secret`] ? "text" : "password"}
                                  value={engine.api_secret}
                                  onChange={(e) => updateEngineField(engine.id, "api_secret", e.target.value)}
                                  placeholder="输入百度 Secret Key"
                                  className="pr-10 font-mono text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowKeys((prev) => ({ ...prev, [`${engine.id}_secret`]: !prev[`${engine.id}_secret`] }))}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                  {showKeys[`${engine.id}_secret`] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => saveEngine(engine)}
                            disabled={savingEngine === engine.id}
                          >
                            {savingEngine === engine.id ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
                            保存配置
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testEngine(engine)}
                            disabled={testResult?.status === "loading"}
                          >
                            {testResult?.status === "loading" ? (
                              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            ) : (
                              <TestTube2 className="h-3.5 w-3.5 mr-1.5" />
                            )}
                            测试连接
                          </Button>

                          {/* 测试结果 */}
                          {testResult && testResult.status !== "idle" && testResult.status !== "loading" && (
                            <div className={`flex flex-col gap-1 text-sm w-full mt-1 ${testResult.status === "success" ? "text-green-600" : "text-destructive"}`}>
                              <div className="flex items-center gap-1.5">
                                {testResult.status === "success" ? (
                                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                                ) : (
                                  <XCircle className="h-4 w-4 shrink-0" />
                                )}
                                <span className="text-xs font-medium">
                                  {testResult.status === "success" ? "API 连接正常 ✓" : "API 连接失败"}
                                </span>
                              </div>
                              <p className="text-xs ml-5 text-muted-foreground leading-relaxed">{testResult.message}</p>
                              {testResult.quotaExceeded && (
                                <p className="text-xs ml-5 text-amber-600 leading-relaxed">
                                  配额已耗尽，请明日再试或升级账户。
                                </p>
                              )}
                              {testResult.isIPError && (
                                <div className="ml-5 mt-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs border-amber-400 text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:border-amber-600 dark:hover:bg-amber-950/40 gap-1.5"
                                    onClick={() => setShowIPGuide(true)}
                                  >
                                    <Shield className="h-3.5 w-3.5" />
                                    查看 IP 白名单设置指南
                                  </Button>
                                </div>
                              )}
                              {testResult.status === "error" && isBaidu && !testResult.quotaExceeded && !testResult.isIPError && (
                                <p className="text-xs ml-5 text-muted-foreground leading-relaxed">
                                  💡 如报 58000 错误请点击「测试连接」后查看 IP 白名单指南。
                                </p>
                              )}
                            </div>
                          )}
                          {testResult?.status === "loading" && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" /> 正在测试连接…
                            </span>
                          )}
                        </div>
                      </CardContent>

                    {/* 可折叠申请教程 */}
                    {tutorial && (
                      <Collapsible
                        open={openTutorials[engine.engine_key]}
                        onOpenChange={(o) => setOpenTutorials((prev) => ({ ...prev, [engine.engine_key]: o }))}
                      >
                        <CollapsibleTrigger asChild>
                          <button className="w-full flex items-center justify-between px-6 py-3 text-sm text-muted-foreground hover:text-foreground border-t transition-colors hover:bg-muted/40">
                            <span className="flex items-center gap-1.5">
                              <BookOpen className="h-3.5 w-3.5" />
                              {tutorial.title}
                            </span>
                            <ChevronRight
                              className={`h-4 w-4 transition-transform ${openTutorials[engine.engine_key] ? "rotate-90" : ""}`}
                            />
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-6 pb-4 pt-2 border-t bg-muted/20">
                            <ol className="space-y-2.5">
                              {tutorial.steps.map((step, i) => (
                                <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                                  <span className="shrink-0 w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-medium">
                                    {i + 1}
                                  </span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
