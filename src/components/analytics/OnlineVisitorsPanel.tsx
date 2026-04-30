import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, Smartphone, Tablet, MapPin, RefreshCw } from "lucide-react";
import { supabase } from "@/db/supabase";
import { getOnlineVisitors } from "@/db/api";
import type { OnlineVisitor } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

// 国家代码 → emoji 国旗
function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "🌐";
  const pts = [...code.toUpperCase()].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0));
  return String.fromCodePoint(...pts);
}

// 设备图标
function DeviceIcon({ type }: { type: string | null }) {
  switch (type?.toLowerCase()) {
    case "mobile": return <Smartphone className="h-3.5 w-3.5" />;
    case "tablet": return <Tablet className="h-3.5 w-3.5" />;
    default: return <Monitor className="h-3.5 w-3.5" />;
  }
}

// 格式化显示时间（几秒前 / 几分钟前）
function timeAgo(ts: string): string {
  try {
    return formatDistanceToNow(new Date(ts), { addSuffix: true, locale: zhCN });
  } catch {
    return "刚刚";
  }
}

// 缩短 URL 用于展示
function shortUrl(url: string): string {
  try {
    const u = new URL(url, "https://x");
    return u.pathname + (u.search ? u.search : "");
  } catch {
    return url;
  }
}

export default function OnlineVisitorsPanel() {
  const [visitors, setVisitors] = useState<OnlineVisitor[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [updating, setUpdating] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchVisitors = async (silent = false) => {
    if (!silent) setUpdating(true);
    try {
      const data = await getOnlineVisitors(5);
      setVisitors(data as OnlineVisitor[]);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("获取在线访客失败:", err);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    // 初始加载
    fetchVisitors();

    // 30 秒轮询保底刷新
    pollRef.current = setInterval(() => fetchVisitors(true), 30_000);

    // Supabase Realtime：监听 page_views 新 INSERT 事件，立即刷新在线访客
    const channel = supabase
      .channel("online-visitors-tracker")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "page_views" },
        () => {
          // 延迟 200ms 让写入稳定后再查询
          setTimeout(() => fetchVisitors(true), 200);
        }
      )
      .subscribe();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      supabase.removeChannel(channel);
    };
  }, []);

  const count = visitors.length;

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            {/* 脉冲绿点：有访客时绿色，无访客时灰色 */}
            <span className="relative flex h-3 w-3 shrink-0">
              {count > 0 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  count > 0 ? "bg-green-500" : "bg-muted-foreground/40"
                }`}
              />
            </span>
            当前在线访客
            <Badge
              variant={count > 0 ? "default" : "secondary"}
              className="text-sm px-2.5 py-0.5 font-bold tabular-nums"
            >
              {count}
            </Badge>
            <span className="text-sm font-normal text-muted-foreground">
              人 · 最近5分钟活跃
            </span>
          </CardTitle>

          {/* 最后更新时间 + 刷新指示 */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <RefreshCw
              className={`h-3 w-3 ${updating ? "animate-spin" : ""}`}
            />
            <span>
              更新于{" "}
              {lastUpdated.toLocaleTimeString("zh-CN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {count === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <Monitor className="h-5 w-5" />
            </div>
            <p className="text-sm">当前无活跃访客</p>
            <p className="text-xs">有访客浏览页面时将实时显示</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b text-muted-foreground text-xs">
                  <th className="text-left pb-2 pr-4 font-medium whitespace-nowrap">当前页面</th>
                  <th className="text-left pb-2 pr-4 font-medium whitespace-nowrap">归属地</th>
                  <th className="text-left pb-2 pr-4 font-medium whitespace-nowrap">IP 地址</th>
                  <th className="text-left pb-2 pr-4 font-medium whitespace-nowrap">设备 / 浏览器</th>
                  <th className="text-left pb-2 font-medium whitespace-nowrap">最后活跃</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map((v, i) => (
                  <tr
                    key={v.visitor_id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    {/* 当前页面 */}
                    <td className="py-2.5 pr-4 max-w-[200px]">
                      <div
                        className="text-xs font-medium truncate text-foreground"
                        title={v.page_title || v.page_url}
                      >
                        {v.page_title || shortUrl(v.page_url)}
                      </div>
                      <div
                        className="text-xs text-muted-foreground truncate"
                        title={v.page_url}
                      >
                        {shortUrl(v.page_url)}
                      </div>
                    </td>

                    {/* 归属地 */}
                    <td className="py-2.5 pr-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base leading-none">
                          {countryFlag(v.country_code || "")}
                        </span>
                        <div className="text-xs">
                          <div className="text-foreground">
                            {[v.city, v.country].filter(Boolean).join(" · ") || "未知"}
                          </div>
                          {v.isp && (
                            <div className="text-muted-foreground truncate max-w-[120px]" title={v.isp}>
                              {v.isp}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* IP 地址 */}
                    <td className="py-2.5 pr-4 whitespace-nowrap">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                        {v.ip_address || "—"}
                      </code>
                    </td>

                    {/* 设备 / 浏览器 */}
                    <td className="py-2.5 pr-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <DeviceIcon type={v.device_type} />
                        <span>{v.browser || "—"}</span>
                        {v.os && <span className="text-muted-foreground/60">· {v.os}</span>}
                      </div>
                    </td>

                    {/* 最后活跃 */}
                    <td className="py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {timeAgo(v.last_seen)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
