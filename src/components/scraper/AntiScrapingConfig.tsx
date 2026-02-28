import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, Clock, Globe, Settings } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface AntiScrapingConfig {
  user_agent: string;
  delay_min: number;
  delay_max: number;
  use_referer: boolean;
  use_cookies: boolean;
  custom_headers: Record<string, string>;
  timeout: number;
  retry_times: number;
  retry_delay: number;
}

interface RateLimitConfig {
  max_requests_per_minute: number;
  max_requests_per_hour: number;
  concurrent_requests: number;
}

interface ProxyConfig {
  enabled: boolean;
  proxy_url: string | null;
  rotate_proxy: boolean;
}

interface AntiScrapingConfigProps {
  antiScrapingConfig: AntiScrapingConfig;
  rateLimitConfig: RateLimitConfig;
  proxyConfig: ProxyConfig;
  onAntiScrapingConfigChange: (config: AntiScrapingConfig) => void;
  onRateLimitConfigChange: (config: RateLimitConfig) => void;
  onProxyConfigChange: (config: ProxyConfig) => void;
}

const USER_AGENTS = [
  {
    label: 'Chrome (Windows)',
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },
  {
    label: 'Chrome (Mac)',
    value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },
  {
    label: 'Firefox (Windows)',
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
  },
  {
    label: 'Safari (Mac)',
    value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
  },
  {
    label: 'Edge (Windows)',
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
  },
  {
    label: '随机（推荐）',
    value: 'random'
  }
];

export default function AntiScrapingConfigPanel({
  antiScrapingConfig,
  rateLimitConfig,
  proxyConfig,
  onAntiScrapingConfigChange,
  onRateLimitConfigChange,
  onProxyConfigChange
}: AntiScrapingConfigProps) {
  const [customHeadersText, setCustomHeadersText] = useState(
    JSON.stringify(antiScrapingConfig.custom_headers || {}, null, 2)
  );

  const updateAntiScrapingConfig = (key: keyof AntiScrapingConfig, value: any) => {
    onAntiScrapingConfigChange({
      ...antiScrapingConfig,
      [key]: value
    });
  };

  const updateRateLimitConfig = (key: keyof RateLimitConfig, value: any) => {
    onRateLimitConfigChange({
      ...rateLimitConfig,
      [key]: value
    });
  };

  const updateProxyConfig = (key: keyof ProxyConfig, value: any) => {
    onProxyConfigChange({
      ...proxyConfig,
      [key]: value
    });
  };

  const handleCustomHeadersChange = (text: string) => {
    setCustomHeadersText(text);
    try {
      const headers = JSON.parse(text);
      updateAntiScrapingConfig('custom_headers', headers);
    } catch (error) {
      // 忽略JSON解析错误，等待用户输入完整
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          <CardTitle>反爬虫配置</CardTitle>
        </div>
        <CardDescription>
          配置反爬虫策略，模拟真实用户行为，提高采集成功率
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {/* 基础配置 */}
          <AccordionItem value="basic">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                基础配置
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              {/* User-Agent */}
              <div className="space-y-2">
                <Label>User-Agent</Label>
                <Select
                  value={antiScrapingConfig.user_agent}
                  onValueChange={(value) => updateAntiScrapingConfig('user_agent', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_AGENTS.map((ua) => (
                      <SelectItem key={ua.value} value={ua.value}>
                        {ua.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  选择"随机"将在每次请求时随机选择User-Agent
                </p>
              </div>

              {/* 请求超时 */}
              <div className="space-y-2">
                <Label>请求超时（毫秒）</Label>
                <Input
                  type="number"
                  value={antiScrapingConfig.timeout}
                  onChange={(e) => updateAntiScrapingConfig('timeout', parseInt(e.target.value))}
                  min={5000}
                  max={60000}
                  step={1000}
                />
                <p className="text-sm text-muted-foreground">
                  建议设置为30000ms（30秒）
                </p>
              </div>

              {/* 重试配置 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>重试次数</Label>
                  <Input
                    type="number"
                    value={antiScrapingConfig.retry_times}
                    onChange={(e) => updateAntiScrapingConfig('retry_times', parseInt(e.target.value))}
                    min={0}
                    max={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label>重试延迟（毫秒）</Label>
                  <Input
                    type="number"
                    value={antiScrapingConfig.retry_delay}
                    onChange={(e) => updateAntiScrapingConfig('retry_delay', parseInt(e.target.value))}
                    min={1000}
                    max={30000}
                    step={1000}
                  />
                </div>
              </div>

              {/* 开关选项 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>使用Referer</Label>
                    <p className="text-sm text-muted-foreground">
                      自动添加Referer头，模拟从网站内部跳转
                    </p>
                  </div>
                  <Switch
                    checked={antiScrapingConfig.use_referer}
                    onCheckedChange={(checked) => updateAntiScrapingConfig('use_referer', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>使用Cookies</Label>
                    <p className="text-sm text-muted-foreground">
                      保持会话状态（需要先登录获取Cookie）
                    </p>
                  </div>
                  <Switch
                    checked={antiScrapingConfig.use_cookies}
                    onCheckedChange={(checked) => updateAntiScrapingConfig('use_cookies', checked)}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 延迟配置 */}
          <AccordionItem value="delay">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                请求延迟（模拟人类行为）
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>最小延迟（毫秒）</Label>
                  <Input
                    type="number"
                    value={antiScrapingConfig.delay_min}
                    onChange={(e) => updateAntiScrapingConfig('delay_min', parseInt(e.target.value))}
                    min={0}
                    max={10000}
                    step={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label>最大延迟（毫秒）</Label>
                  <Input
                    type="number"
                    value={antiScrapingConfig.delay_max}
                    onChange={(e) => updateAntiScrapingConfig('delay_max', parseInt(e.target.value))}
                    min={0}
                    max={10000}
                    step={100}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                系统会在每次请求前随机延迟{antiScrapingConfig.delay_min}-{antiScrapingConfig.delay_max}毫秒，
                模拟真实用户的浏览行为。建议设置为2000-5000ms。
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* 频率限制 */}
          <AccordionItem value="rate-limit">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                频率限制
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>每分钟最大请求数</Label>
                  <Input
                    type="number"
                    value={rateLimitConfig.max_requests_per_minute}
                    onChange={(e) => updateRateLimitConfig('max_requests_per_minute', parseInt(e.target.value))}
                    min={1}
                    max={60}
                  />
                </div>
                <div className="space-y-2">
                  <Label>每小时最大请求数</Label>
                  <Input
                    type="number"
                    value={rateLimitConfig.max_requests_per_hour}
                    onChange={(e) => updateRateLimitConfig('max_requests_per_hour', parseInt(e.target.value))}
                    min={1}
                    max={1000}
                  />
                </div>
                <div className="space-y-2">
                  <Label>并发请求数</Label>
                  <Input
                    type="number"
                    value={rateLimitConfig.concurrent_requests}
                    onChange={(e) => updateRateLimitConfig('concurrent_requests', parseInt(e.target.value))}
                    min={1}
                    max={10}
                  />
                  <p className="text-sm text-muted-foreground">
                    建议设置为1，避免同时发送多个请求被检测
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 代理配置 */}
          <AccordionItem value="proxy">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                代理配置（高级）
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>启用代理</Label>
                  <p className="text-sm text-muted-foreground">
                    使用代理IP访问目标网站
                  </p>
                </div>
                <Switch
                  checked={proxyConfig.enabled}
                  onCheckedChange={(checked) => updateProxyConfig('enabled', checked)}
                />
              </div>

              {proxyConfig.enabled && (
                <>
                  <div className="space-y-2">
                    <Label>代理URL</Label>
                    <Input
                      value={proxyConfig.proxy_url || ''}
                      onChange={(e) => updateProxyConfig('proxy_url', e.target.value)}
                      placeholder="http://proxy.example.com:8080"
                    />
                    <p className="text-sm text-muted-foreground">
                      格式：http://host:port 或 socks5://host:port
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>轮换代理</Label>
                      <p className="text-sm text-muted-foreground">
                        每次请求使用不同的代理IP
                      </p>
                    </div>
                    <Switch
                      checked={proxyConfig.rotate_proxy}
                      onCheckedChange={(checked) => updateProxyConfig('rotate_proxy', checked)}
                    />
                  </div>
                </>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* 自定义Headers */}
          <AccordionItem value="headers">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                自定义HTTP头（高级）
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>自定义Headers（JSON格式）</Label>
                <Textarea
                  value={customHeadersText}
                  onChange={(e) => handleCustomHeadersChange(e.target.value)}
                  placeholder='{\n  "X-Custom-Header": "value"\n}'
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  添加自定义HTTP请求头，例如API密钥、认证令牌等
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
