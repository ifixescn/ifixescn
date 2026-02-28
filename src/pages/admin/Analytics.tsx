import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  getRecentPageViews,
} from "@/db/api";
import type {
  AnalyticsOverview,
  RealtimeAnalytics,
  TopPage,
  LocationStats,
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
} from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [realtimeData, setRealtimeData] = useState<RealtimeAnalytics[]>([]);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [locationStats, setLocationStats] = useState<LocationStats[]>([]);
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
        realtimeData,
        topPagesData,
        locationData,
        deviceData,
        recentData,
      ] = await Promise.all([
        getAnalyticsOverview(),
        getRealtimeAnalytics(days),
        getTopPages(10, days),
        getLocationStats(days),
        getDeviceStats(days),
        getRecentPageViews(20),
      ]);

      setOverview(overviewData);
      setRealtimeData(realtimeData);
      setTopPages(topPagesData);
      setLocationStats(locationData);
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
    switch (type.toLowerCase()) {
      case "mobile":
        return <Smartphone className="h-4 w-4" />;
      case "tablet":
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  // 准备设备类型饼图数据
  const deviceTypeData = deviceStats.reduce((acc, stat) => {
    const existing = acc.find((item) => item.name === stat.device_type);
    if (existing) {
      existing.value += Number(stat.view_count);
    } else {
      acc.push({
        name: stat.device_type,
        value: Number(stat.view_count),
      });
    }
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
            实时查看网站访问数据和用户行为分析
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

      {/* 概览卡片 */}
      <div className="grid gap-4 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日访问量</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.today_views || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              总访问量: {overview?.total_views || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日访客</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.today_visitors || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              总访客数: {overview?.total_visitors || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均停留时长</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(overview?.avg_duration || 0)}
            </div>
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
        <TabsList>
          <TabsTrigger value="trend">
            <Activity className="h-4 w-4 mr-2" />
            访问趋势
          </TabsTrigger>
          <TabsTrigger value="pages">
            <BarChart3 className="h-4 w-4 mr-2" />
            页面排行
          </TabsTrigger>
          <TabsTrigger value="location">
            <MapPin className="h-4 w-4 mr-2" />
            地区分布
          </TabsTrigger>
          <TabsTrigger value="device">
            <Monitor className="h-4 w-4 mr-2" />
            设备统计
          </TabsTrigger>
          <TabsTrigger value="realtime">
            <Globe className="h-4 w-4 mr-2" />
            实时访问
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
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      format(new Date(value), "MM-dd", { locale: zhCN })
                    }
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) =>
                      format(new Date(value as string), "yyyy年MM月dd日", {
                        locale: zhCN,
                      })
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total_views"
                    stroke="#3b82f6"
                    name="访问量"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="unique_visitors"
                    stroke="#10b981"
                    name="访客数"
                    strokeWidth={2}
                  />
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
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 地区分布 */}
        <TabsContent value="location" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>地区分布</CardTitle>
                <CardDescription>访客地理位置统计</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {locationStats.slice(0, 10).map((location, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {location.country} {location.region} {location.city}
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span className="text-muted-foreground">
                          访问: <span className="font-medium text-foreground">{location.view_count}</span>
                        </span>
                        <span className="text-muted-foreground">
                          访客: <span className="font-medium text-foreground">{location.unique_visitors}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>访问量分布</CardTitle>
                <CardDescription>各地区访问量占比</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={locationStats.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="city"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="view_count" fill="#3b82f6" name="访问量" />
                  </BarChart>
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
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {deviceTypeData.map((entry, index) => (
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
                        <span className="text-muted-foreground">
                          访问: <span className="font-medium text-foreground">{device.view_count}</span>
                        </span>
                        <span className="text-muted-foreground">
                          访客: <span className="font-medium text-foreground">{device.unique_visitors}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 实时访问 */}
        <TabsContent value="realtime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>最近访问记录</CardTitle>
              <CardDescription>实时访问日志</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentViews.map((view) => (
                  <div
                    key={view.id}
                    className="flex items-center justify-between p-3 border rounded text-sm"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{view.page_title || view.page_url}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {view.page_url}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {getDeviceIcon(view.device_type || "desktop")}
                        <span>{view.device_type}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{view.city || view.region || view.country || "未知"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(new Date(view.created_at), "HH:mm:ss", {
                            locale: zhCN,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
