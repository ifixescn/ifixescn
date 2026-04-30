import { createClient } from "npm:@supabase/supabase-js@2";
import { createHash } from "node:crypto";

// MD5 签名（使用 Deno 内置的 node:crypto，稳定可靠）
function md5hex(input: string): string {
  return createHash("md5").update(input, "utf8").digest("hex");
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};



// Google Translate v2
async function translateGoogle(text: string, sourceLang: string, targetLang: string, apiKey: string): Promise<string> {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, source: sourceLang === "auto" ? undefined : sourceLang, target: targetLang, format: "text" }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google Translate HTTP ${res.status}: ${err}`);
    }
    const data = await res.json();
    return data.data.translations[0].translatedText;
  } catch (err) {
    if ((err as Error).name === "AbortError") throw new Error("Google Translate 请求超时（12s），请检查网络连接或稍后重试");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// DeepL 翻译（自动识别免费/付费 Key，选择正确的 API 端点）
async function translateDeepL(text: string, sourceLang: string, targetLang: string, apiKey: string): Promise<string> {
  // 免费 Key 以 ":fx" 结尾，使用 api-free 端点；付费 Key 使用 api 端点
  const cleanKey = apiKey.trim();
  const baseUrl = cleanKey.endsWith(":fx")
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";

  // DeepL 语言代码映射
  const langMap: Record<string, string> = {
    "zh-CN": "ZH",
    "zh-TW": "ZH",
    "en": "EN",
    "ja": "JA",
    "ko": "KO",
    "fr": "FR",
    "de": "DE",
    "es": "ES",
    "pt": "PT",
    "ru": "RU",
    "ar": "AR",
    "vi": "VI",
    "th": "TH",
  };
  const tl = langMap[targetLang] ?? targetLang.toUpperCase().split("-")[0];
  const sl = sourceLang === "auto" ? undefined : (langMap[sourceLang] ?? sourceLang.toUpperCase().split("-")[0]);

  const params = new URLSearchParams({ text, target_lang: tl });
  if (sl) params.set("source_lang", sl);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { Authorization: `DeepL-Auth-Key ${cleanKey}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      signal: controller.signal,
    });
    if (!res.ok) {
      const err = await res.text();
      if (res.status === 403) throw new Error(`DeepL 认证失败（403）：请检查 API Key 是否正确，免费 Key 须以 ":fx" 结尾`);
      if (res.status === 456) throw new Error(`DeepL 配额已用完（456）：本月翻译字符数已达上限`);
      throw new Error(`DeepL HTTP ${res.status}: ${err}`);
    }
    const data = await res.json();
    return data.translations[0].text;
  } catch (err) {
    if ((err as Error).name === "AbortError") throw new Error("DeepL 请求超时（12s），请检查网络连接或稍后重试");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// 百度翻译
async function translateBaidu(text: string, sourceLang: string, targetLang: string, appId: string, secretKey: string): Promise<string> {
  const errMessages: Record<string, string> = {
    "52001": "请求超时，请重试",
    "52002": "系统错误，请重试",
    "52003": "未授权用户，请检查 APP ID 是否正确",
    "54000": "必填参数为空，请检查 APP ID 和 Secret Key",
    "54001": "签名错误，请确认 APP ID 和 Secret Key 填写无误（注意不要有空格）",
    "54003": "访问频率受限，请降低调用频率或升级套餐",
    "54004": "账户余额不足，请前往百度翻译开放平台充值",
    "54005": "长文本请求频繁，请降低频率",
    "58000": "客户端 IP 受限（错误码 58000）——请登录百度翻译开放平台 → 开发者信息 → 将「服务器地址（白名单）」设置为「不限制 IP」",
    "58001": "该语言方向暂不支持",
    "58002": "服务已关闭，请前往百度翻译控制台开启通用文本翻译服务",
    "90107": "认证未通过或未生效，请在百度控制台完成实名认证",
  };
  // 百度语言代码映射（百度使用自己的语言代码）
  const langMap: Record<string, string> = {
    "zh-CN": "zh",
    "zh-TW": "cht",
    "auto": "auto",
    "ja": "jp",    // 日语：百度用 jp 而非 ja
    "ko": "kor",   // 韩语：百度用 kor 而非 ko
    "fr": "fra",   // 法语
    "es": "spa",   // 西班牙语
    "ar": "ara",   // 阿拉伯语
    "vi": "vie",   // 越南语
    "th": "th",
    "pt": "pt",
    "ru": "ru",
    "de": "de",
    "en": "en",
  };
  const sl = langMap[sourceLang] ?? sourceLang;
  const tl = langMap[targetLang] ?? targetLang;
  // 去除可能存在的首尾空格，防止签名错误（54001）
  const cleanAppId = appId.trim();
  const cleanSecret = secretKey.trim();
  const salt = Date.now().toString();
  // 使用 node:crypto MD5（稳定可靠，正确处理 UTF-8）
  const sign = md5hex(cleanAppId + text + salt + cleanSecret);
  const params = new URLSearchParams({ q: text, from: sl, to: tl, appid: cleanAppId, salt, sign });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch("https://fanyi-api.baidu.com/api/trans/vip/translate", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`百度翻译 HTTP ${res.status}`);
    const data = await res.json();
    if (data.error_code) {
      const msg = errMessages[String(data.error_code)] || `错误码 ${data.error_code}: ${data.error_msg}`;
      const err = new Error(`百度翻译: ${msg}`) as Error & { isIPError?: boolean };
      if (String(data.error_code) === "58000") err.isIPError = true;
      throw err;
    }
    if (!data.trans_result?.length) throw new Error("百度翻译：返回结果为空");
    return data.trans_result.map((r: { dst: string }) => r.dst).join("\n");
  } catch (err) {
    if ((err as Error).name === "AbortError") throw new Error("百度翻译请求超时（12s）：可能是服务器与百度 API 之间的网络问题，请检查 IP 白名单设置或稍后重试");
    // 网络层错误（DNS 解析失败、连接被拒等）
    if ((err as Error).message?.includes("error sending request") || (err as Error).message?.includes("ConnectionRefused") || (err as Error).message?.includes("dns")) {
      throw new Error("百度翻译：网络连接失败，请检查 IP 白名单是否设为「不限制 IP」，或稍后重试");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { text, sourceLang = "en", targetLang, useCache = true, testMode = false, engineKey } = await req.json();

    if (!text || !targetLang) {
      return new Response(JSON.stringify({ error: "缺少必要参数: text, targetLang" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 相同语言直接返回
    if (sourceLang === targetLang || (sourceLang === "en" && targetLang === "en")) {
      return new Response(JSON.stringify({ translated: text, engine: "none", cached: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 检查缓存
    if (useCache && !testMode) {
      const { data: cached } = await supabase
        .from("translation_cache")
        .select("id, translated_text, engine, hit_count")
        .eq("source_lang", sourceLang)
        .eq("target_lang", targetLang)
        .eq("source_text", text)
        .maybeSingle();

      if (cached) {
        await supabase.from("translation_cache").update({ hit_count: cached.hit_count + 1, updated_at: new Date().toISOString() }).eq("id", cached.id);
        return new Response(JSON.stringify({ translated: cached.translated_text, engine: cached.engine, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 获取激活的翻译引擎，按优先级列排序（priority 越小越优先）
    const { data: engines } = await supabase
      .from("translation_engine_settings")
      .select("engine_key, api_key, api_secret, is_active, priority")
      .eq("is_active", true)
      .not("engine_key", "eq", "browser_detection")
      .order("priority", { ascending: true });

    const activeEngines = (engines || []).filter((e: { engine_key: string; is_active: boolean }) => e.is_active);

    let translated = "";
    let usedEngine = "none";
    let lastError = "";
    let isQuotaExceeded = false;
    let lastIPError = false;

    // 引擎列表已按 priority 列排序，无需再次排序
    let sortedEngines = [...activeEngines];

    // testMode + 指定引擎：只用该引擎，不降级
    if (testMode && engineKey) {
      const target = sortedEngines.find((e) => e.engine_key === engineKey);
      if (target) {
        sortedEngines = [target];
      } else {
        return new Response(
          JSON.stringify({ error: `引擎 "${engineKey}" 未启用，请先在设置中开启该引擎。` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    for (const engine of sortedEngines) {
      try {
        if (engine.engine_key === "google" && engine.api_key) {
          translated = await translateGoogle(text, sourceLang, targetLang, engine.api_key.trim());
          usedEngine = "google";
        } else if (engine.engine_key === "deepl" && engine.api_key) {
          translated = await translateDeepL(text, sourceLang, targetLang, engine.api_key.trim());
          usedEngine = "deepl";
        } else if (engine.engine_key === "baidu" && engine.api_key && engine.api_secret) {
          translated = await translateBaidu(text, sourceLang, targetLang, engine.api_key, engine.api_secret);
          usedEngine = "baidu";
        } else {
          // 凭据缺失，跳过
          const missing = engine.engine_key === "baidu"
            ? (!engine.api_key ? "APP ID 未填写" : "Secret Key 未填写")
            : "API Key 未填写";
          lastError = `${engine.engine_key}: ${missing}，请在设置中填写后保存`;
          console.warn(`跳过引擎 ${engine.engine_key}：${missing}`);
          continue;
        }
        break; // 翻译成功，退出循环
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const isIPErr = (err as Error & { isIPError?: boolean }).isIPError === true;
        // 记录配额耗尽标记
        if (errMsg.startsWith("QUOTA_EXCEEDED:")) {
          isQuotaExceeded = true;
          lastError = errMsg.replace("QUOTA_EXCEEDED:", "");
        } else {
          lastError = errMsg;
        }
        if (isIPErr) lastIPError = true;
        console.error(`引擎 ${engine.engine_key} 翻译失败:`, errMsg);
        continue; // 尝试下一个引擎
      }
    }

    if (!translated) {
      // testMode 下返回明确错误（含引擎名称）
      if (testMode) {
        const friendlyError = isQuotaExceeded
          ? lastError
          : lastError || "翻译引擎连接失败，请检查 API Key 配置";
        return new Response(JSON.stringify({ error: friendlyError, quota_exceeded: isQuotaExceeded, ip_error: lastIPError }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // 正常翻译模式：优雅降级，返回原文而非抛出错误
      return new Response(
        JSON.stringify({
          translated: text,
          engine: "fallback_original",
          cached: false,
          warning: isQuotaExceeded ? "quota_exceeded" : "all_engines_failed",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 存入缓存（非测试模式）
    if (!testMode) {
      await supabase.from("translation_cache").upsert(
        { source_text: text, source_lang: sourceLang, target_lang: targetLang, translated_text: translated, engine: usedEngine, hit_count: 0, updated_at: new Date().toISOString() },
        { onConflict: "source_lang,target_lang,engine,source_text", ignoreDuplicates: false }
      );
    }

    return new Response(JSON.stringify({ translated, engine: usedEngine, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("translate-text error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "翻译服务异常" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
