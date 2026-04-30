import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  getAnalyticsOverview,
  getRealtimeAnalytics,
  getTopPages,
  getLocationStats,
  getDeviceStats,
  getCountryStats,
  getIspStats,
  getRecentViewsWithIp,
} from "@/db/api";
import type {
  AnalyticsOverview,
  RealtimeAnalytics,
  TopPage,
  LocationStats,
  CountryStats,
  IspStats,
  DeviceStats,
  PageView,
} from "@/types";
import {
  TrendingUp,
  Users,
  Eye,
  Clock,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  BarChart3,
  Activity,
  Wifi,
  Network,
} from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import OnlineVisitorsPanel from "@/components/analytics/OnlineVisitorsPanel";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

// 国家代码 → emoji 国旗
function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "🌐";
  const pts = [...code.toUpperCase()].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0));
  return String.fromCodePoint(...pts);
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [realtimeData, setRealtimeData] = useState<RealtimeAnalytics[]>([]);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [locationStats, setLocationStats] = useState<LocationStats[]>([]);
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);
  const [ispStats, setIspStats] = useState<IspStats[]>([]);
  const [deviceStats, setDeviceStats] = useState<DeviceStats[]>([]);
  const [recentViews, setRecentViews] = useState<PageView[]>([]);

  useEffect(() => {
    loadAnalyticsData();
  }, [days]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [
        overviewData,
        rtData,
        topPagesData,
        locationData,
        countryData,
        ispData,
        deviceData,
        recentData,
      ] = await Promise.all([
        getAnalyticsOverview(),
        getRealtimeAnalytics(days),
        getTopPages(10, days),
        getLocationStats(days),
        getCountryStats(days),
        getIspStats(days),
        getDeviceStats(days),
        getRecentViewsWithIp(50),
      ]);

      setOverview(overviewData);
      setRealtimeData(rtData);
      setTopPages(topPagesData);
      setLocationStats(locationData);
      setCountryStats(countryData);
      setIspStats(ispData);
      setDeviceStats(deviceData);
      setRecentViews(recentData);
    } catch (error) {
      console.error("Failed to load analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  // 格式化时长
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };

  // 设备类型图标
  const getDeviceIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "mobile": return <Smartphone className="h-4 w-4" />;
      case "tablet": return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  // 设备饼图数据
  const deviceTypeData = deviceStats.reduce((acc, stat) => {
    const existing = acc.find((item) => item.name === stat.device_type);
    if (existing) { existing.value += Number(stat.view_count); }
    else { acc.push({ name: stat.device_type, value: Number(stat.view_count) }); }
    return acc;
  }, [] as { name: string; value: number }[]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载统计数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            流量统计
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            实时查看网站访问数据、IP 归属地及用户行为分析
          </p>
        </div>
        <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">今天</SelectItem>
            <SelectItem value="7">最近7天</SelectItem>
            <SelectItem value="30">最近30天</SelectItem>
            <SelectItem value="90">最近90天</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 当前在线访客面板（Realtime 实时刷新） */}
      <OnlineVisitorsPanel />

      {/* 概览卡片 */}
      <div className="grid gap-4 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日访问量</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.today_views || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">总访问量: {overview?.total_views || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日访客</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.today_visitors || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">总访客数: {overview?.total_visitors || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均停留时长</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(overview?.avg_duration || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">今日平均</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">跳出率</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.bounce_rate || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">单页访问比例</p>
          </CardContent>
        </Card>
      </div>

      {/* 详细统计标签页 */}
      <Tabs defaultValue="trend" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="trend">
            <Activity className="h-4 w-4 mr-2" />访问趋势
          </TabsTrigger>
          <TabsTrigger value="pages">
            <BarChart3 className="h-4 w-4 mr-2" />页面排行
          </TabsTrigger>
          <TabsTrigger value="location">
            <MapPin className="h-4 w-4 mr-2" />地区分布
          </TabsTrigger>
          <TabsTrigger value="country">
            <Globe className="h-4 w-4 mr-2" />国家排行
          </TabsTrigger>
          <TabsTrigger value="device">
            <Monitor className="h-4 w-4 mr-2" />设备统计
          </TabsTrigger>
          <TabsTrigger value="isp">
            <Wifi className="h-4 w-4 mr-2" />运营商
          </TabsTrigger>
          <TabsTrigger value="ipdetail">
            <Network className="h-4 w-4 mr-2" />IP 明细
          </TabsTrigger>
        </TabsList>

        {/* 访问趋势 */}
        <TabsContent value="trend" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>访问趋势</CardTitle>
              <CardDescription>最近{days}天的访问量和访客数趋势</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={realtimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), "MM-dd", { locale: zhCN })} />
                  <YAxis />
                  <Tooltip labelFormatter={(v) => format(new Date(v as string), "yyyy年MM月dd日", { locale: zhCN })} />
                  <Legend />
                  <Line type="monotone" dataKey="total_views" stroke="#3b82f6" name="访问量" strokeWidth={2} />
                  <Line type="monotone" dataKey="unique_visitors" stroke="#10b981" name="访客数" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 页面排行 */}
        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>热门页面</CardTitle>
              <CardDescription>访问量最高的页面</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPages.map((page, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{page.page_title || page.page_url}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{page.page_url}</p>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-bold">{page.view_count}</div>
                        <div className="text-muted-foreground">访问量</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">{page.unique_visitors}</div>
                        <div className="text-muted-foreground">访客数</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">{formatDuration(Number(page.avg_duration))}</div>
                        <div className="text-muted-foreground">平均停留</div>
                      </div>
                    </div>
                  </div>
                ))}
                {topPages.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">暂无数据</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 地区分布（城市级） */}
        <TabsContent value="location" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>城市访问排行</CardTitle>
                <CardDescription>访客城市级地理位置统计（Top 10）</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {locationStats.slice(0, 10).map((loc, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">{countryFlag(loc.country_code)}</span>
                        <div className="min-w-0">
                          <span className="text-sm font-medium truncate block">
                            {[loc.city, loc.region, loc.country].filter(Boolean).join(" · ") || "未知"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm shrink-0 ml-2">
                        <span className="text-muted-foreground">访问: <span className="font-medium text-foreground">{loc.view_count}</span></span>
                        <span className="text-muted-foreground">访客: <span className="font-medium text-foreground">{loc.unique_visitors}</span></span>
                      </div>
                    </div>
                  ))}
                  {locationStats.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">暂无地区数据（IP 归属地需要访问才能记录）</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>城市访问量柱状图</CardTitle>
                <CardDescription>各城市访问量对比</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={locationStats.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="city" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="view_count" fill="#3b82f6" name="访问量" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 国家排行 */}
        <TabsContent value="country" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>国家/地区访问排行</CardTitle>
                <CardDescription>各国家访客占比统计</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {countryStats.slice(0, 15).map((c, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xl leading-none">{countryFlag(c.country_code)}</span>
                          <span className="font-medium">{c.country || "未知"}</span>
                          {c.country_code && (
                            <Badge variant="outline" className="text-xs">{c.country_code}</Badge>
                          )}
                        </div>
                        <div className="flex gap-3 text-muted-foreground">
                          <span>访问 <span className="font-semibold text-foreground">{c.view_count}</span></span>
                          <span>访客 <span className="font-semibold text-foreground">{c.unique_visitors}</span></span>
                          <span className="font-bold text-foreground">{c.percentage}%</span>
                        </div>
                      </div>
                      <Progress value={Number(c.percentage)} className="h-1.5 bg-muted" />
                    </div>
                  ))}
                  {countryStats.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">暂无国家数据</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>国家访问量分布</CardTitle>
                <CardDescription>各国家访问量占比饼图</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={countryStats.slice(0, 8).map((c) => ({ name: c.country || "未知", value: Number(c.view_count) }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {countryStats.slice(0, 8).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 设备统计 */}
        <TabsContent value="device" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>设备类型分布</CardTitle>
                <CardDescription>访客使用的设备类型</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={deviceTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {deviceTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>浏览器和操作系统</CardTitle>
                <CardDescription>访客使用的浏览器和系统</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deviceStats.slice(0, 10).map((device, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(device.device_type)}
                        <div>
                          <div className="text-sm font-medium">{device.browser}</div>
                          <div className="text-xs text-muted-foreground">{device.os}</div>
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span className="text-muted-foreground">访问: <span className="font-medium text-foreground">{device.view_count}</span></span>
                        <span className="text-muted-foreground">访客: <span className="font-medium text-foreground">{device.unique_visitors}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 运营商/ISP */}
        <TabsContent value="isp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>网络运营商分布</CardTitle>
              <CardDescription>访客使用的网络运营商（ISP）统计</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="space-y-3">
                  {ispStats.slice(0, 15).map((isp, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <Wifi className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium truncate">{isp.isp}</span>
                      </div>
                      <div className="flex gap-4 text-sm shrink-0">
                        <span className="text-muted-foreground">访问: <span className="font-medium text-foreground">{isp.view_count}</span></span>
                        <span className="text-muted-foreground">访客: <span className="font-medium text-foreground">{isp.unique_visitors}</span></span>
                      </div>
                    </div>
                  ))}
                  {ispStats.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">暂无运营商数据</p>
                  )}
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={ispStats.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="isp" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="view_count" fill="#8b5cf6" name="访问量" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* IP 明细 */}
        <TabsContent value="ipdetail" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>IP 访问明细</CardTitle>
              <CardDescription>最近50条访问记录，含完整 IP 归属地信息</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left pb-2 pr-4 font-medium">时间</th>
                      <th className="text-left pb-2 pr-4 font-medium">IP 地址</th>
                      <th className="text-left pb-2 pr-4 font-medium">归属地</th>
                      <th className="text-left pb-2 pr-4 font-medium">运营商</th>
                      <th className="text-left pb-2 pr-4 font-medium">页面</th>
                      <th className="text-left pb-2 font-medium">设备</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentViews.map((view) => (
                      <tr key={view.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
                          {format(new Date(view.created_at), "MM-dd HH:mm:ss", { locale: zhCN })}
                        </td>
                        <td className="py-2 pr-4">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                            {view.ip_address || "—"}
                          </code>
                        </td>
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-1.5">
                            <span>{countryFlag((view as PageView & { country_code?: string }).country_code || "")}</span>
                            <span className="text-xs">
                              {[view.city, view.region, view.country].filter(Boolean).join(" · ") || "未知"}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 pr-4 text-xs text-muted-foreground max-w-[160px] truncate">
                          {(view as PageView & { isp?: string }).isp || "—"}
                        </td>
                        <td className="py-2 pr-4 max-w-[200px]">
                          <div className="truncate text-xs" title={view.page_url}>
                            {view.page_title || view.page_url}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{view.page_url}</div>
                        </td>
                        <td className="py-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {getDeviceIcon(view.device_type || "desktop")}
                            <span>{view.browser}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {recentViews.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">暂无访问记录</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

