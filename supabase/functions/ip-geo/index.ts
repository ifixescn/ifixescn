const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// 从请求头中提取真实客户端 IP（支持多种代理头）
function getClientIP(req: Request): string | null {
  const h = req.headers;
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for 可能包含多个 IP，取第一个（最原始的客户端 IP）
    return forwarded.split(",")[0].trim();
  }
  return (
    h.get("cf-connecting-ip") ||
    h.get("true-client-ip") ||
    h.get("x-real-ip") ||
    null
  );
}

// 将国家代码转换为 emoji 国旗
function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return "🌐";
  const pts = [...code.toUpperCase()].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0));
  return String.fromCodePoint(...pts);
}

// 判断是否是私有/本地 IP
function isPrivateIP(ip: string): boolean {
  return (
    /^127\./.test(ip) ||
    /^10\./.test(ip) ||
    /^192\.168\./.test(ip) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    /^::1$/.test(ip) ||
    /^localhost$/.test(ip) ||
    /^fc00:/i.test(ip) ||
    /^fe80:/i.test(ip)
  );
}

type GeoResult = {
  ip: string;
  country: string;
  countryCode: string;
  flag: string;
  region: string;
  city: string;
  isp: string;
  timezone: string;
  lat?: number | null;
  lon?: number | null;
};

// 使用 ipapi.co（HTTPS，免费，1000次/天）查询地理信息
async function fetchFromIpapiCo(ip: string, signal: AbortSignal): Promise<GeoResult | null> {
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, { signal });
    if (!res.ok) return null;
    const d = await res.json();
    if (d.error) return null;
    return {
      ip: d.ip || ip,
      country: d.country_name || "",
      countryCode: d.country_code || "",
      flag: countryCodeToFlag(d.country_code || ""),
      region: d.region || "",
      city: d.city || "",
      isp: d.org || "",
      timezone: d.timezone || "",
      lat: d.latitude || null,
      lon: d.longitude || null,
    };
  } catch {
    return null;
  }
}

// 使用 freeipapi.com（HTTPS，免费备用）查询地理信息
async function fetchFromFreeIpApi(ip: string, signal: AbortSignal): Promise<GeoResult | null> {
  try {
    const res = await fetch(`https://freeipapi.com/api/json/${ip}`, { signal });
    if (!res.ok) return null;
    const d = await res.json();
    return {
      ip: d.ipAddress || ip,
      country: d.countryName || "",
      countryCode: d.countryCode || "",
      flag: countryCodeToFlag(d.countryCode || ""),
      region: d.regionName || "",
      city: d.cityName || "",
      isp: "",
      timezone: d.timeZone || "",
      lat: d.latitude || null,
      lon: d.longitude || null,
    };
  } catch {
    return null;
  }
}

// 使用 ip-api.com（HTTP，45次/分钟，仅作最后备用）
async function fetchFromIpApiCom(ip: string, signal: AbortSignal): Promise<GeoResult | null> {
  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,isp,timezone,lat,lon,query`,
      { signal }
    );
    if (!res.ok) return null;
    const d = await res.json();
    if (d.status !== "success") return null;
    return {
      ip: d.query || ip,
      country: d.country || "",
      countryCode: d.countryCode || "",
      flag: countryCodeToFlag(d.countryCode || ""),
      region: d.regionName || "",
      city: d.city || "",
      isp: d.isp || "",
      timezone: d.timezone || "",
      lat: d.lat || null,
      lon: d.lon || null,
    };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const clientIP = getClientIP(req);

    if (!clientIP) {
      // IP 无法获取时返回 400（不影响页面访问记录，前端会用 null）
      return new Response(
        JSON.stringify({ error: "无法获取客户端 IP 地址" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 私有/本地 IP 直接返回（无需 geo 查询）
    if (isPrivateIP(clientIP)) {
      return new Response(
        JSON.stringify({
          ip: clientIP,
          country: "本地网络",
          countryCode: "",
          flag: "🏠",
          region: "",
          city: "",
          isp: "",
          timezone: "",
          isPrivate: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 依次尝试多个 geo 服务（主：ipapi.co HTTPS → 备1：freeipapi.com HTTPS → 备2：ip-api.com HTTP）
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);

    let geo: GeoResult | null = null;
    try {
      geo = await fetchFromIpapiCo(clientIP, controller.signal);
      if (!geo) geo = await fetchFromFreeIpApi(clientIP, controller.signal);
      if (!geo) geo = await fetchFromIpApiCom(clientIP, controller.signal);
    } finally {
      clearTimeout(timer);
    }

    // 至少保证返回 IP 地址，即使 geo 全部失败
    if (!geo) {
      return new Response(
        JSON.stringify({
          ip: clientIP,
          country: "",
          countryCode: "",
          flag: "🌐",
          region: "",
          city: "",
          isp: "",
          timezone: "",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(geo),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("ip-geo error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "IP 归属地查询失败" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
