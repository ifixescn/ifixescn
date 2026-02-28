import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Copy, Check, Smartphone, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  getWeChatConfigs,
  createWeChatConfig,
  updateWeChatConfig,
  deleteWeChatConfig,
  toggleWeChatConfigStatus,
} from '@/db/api';
import type { WeChatConfig, WeChatConfigFormData, WeChatConfigType } from '@/types';

export default function WeChatConfigManage() {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<WeChatConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<WeChatConfig | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WeChatConfigType>('miniprogram');

  // 表单状态
  const [formData, setFormData] = useState<WeChatConfigFormData>({
    type: 'miniprogram',
    name: '',
    app_id: '',
    app_secret: '',
    token: '',
    encoding_aes_key: '',
    config_data: {},
    is_active: true,
  });

  // 加载配置列表
  const loadConfigs = async () => {
    try {
      setLoading(true);
      const data = await getWeChatConfigs();
      setConfigs(data);
    } catch (error) {
      console.error('加载微信配置失败:', error);
      toast({
        title: '加载失败',
        description: '无法加载微信配置列表',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  // 打开新建对话框
  const handleCreate = () => {
    setEditingConfig(null);
    setFormData({
      type: activeTab,
      name: '',
      app_id: '',
      app_secret: '',
      token: '',
      encoding_aes_key: '',
      config_data: {},
      is_active: true,
    });
    setDialogOpen(true);
  };

  // 打开编辑对话框
  const handleEdit = (config: WeChatConfig) => {
    setEditingConfig(config);
    setFormData({
      type: config.type,
      name: config.name,
      app_id: config.app_id,
      app_secret: config.app_secret,
      token: config.token || '',
      encoding_aes_key: config.encoding_aes_key || '',
      config_data: config.config_data || {},
      is_active: config.is_active,
    });
    setDialogOpen(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      // 验证必填字段
      if (!formData.name || !formData.app_id || !formData.app_secret) {
        toast({
          title: '验证失败',
          description: '请填写所有必填字段',
          variant: 'destructive',
        });
        return;
      }

      if (editingConfig) {
        // 更新
        await updateWeChatConfig(editingConfig.id, formData);
        toast({
          title: '更新成功',
          description: '微信配置已更新',
        });
      } else {
        // 创建
        await createWeChatConfig(formData);
        toast({
          title: '创建成功',
          description: '微信配置已创建',
        });
      }

      setDialogOpen(false);
      loadConfigs();
    } catch (error: any) {
      console.error('保存微信配置失败:', error);
      toast({
        title: '保存失败',
        description: error.message || '无法保存微信配置',
        variant: 'destructive',
      });
    }
  };

  // 删除配置
  const handleDelete = async (config: WeChatConfig) => {
    if (!confirm(`确定要删除配置"${config.name}"吗？`)) {
      return;
    }

    try {
      await deleteWeChatConfig(config.id);
      toast({
        title: '删除成功',
        description: '微信配置已删除',
      });
      loadConfigs();
    } catch (error: any) {
      console.error('删除微信配置失败:', error);
      toast({
        title: '删除失败',
        description: error.message || '无法删除微信配置',
        variant: 'destructive',
      });
    }
  };

  // 切换激活状态
  const handleToggleStatus = async (config: WeChatConfig) => {
    try {
      await toggleWeChatConfigStatus(config.id, !config.is_active);
      toast({
        title: '状态已更新',
        description: `配置已${!config.is_active ? '启用' : '禁用'}`,
      });
      loadConfigs();
    } catch (error: any) {
      console.error('切换状态失败:', error);
      toast({
        title: '操作失败',
        description: error.message || '无法切换配置状态',
        variant: 'destructive',
      });
    }
  };

  // 切换密钥显示
  const toggleSecretVisibility = (configId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [configId]: !prev[configId],
    }));
  };

  // 复制到剪贴板
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: '已复制',
        description: '内容已复制到剪贴板',
      });
    } catch (error) {
      toast({
        title: '复制失败',
        description: '无法复制到剪贴板',
        variant: 'destructive',
      });
    }
  };

  // 隐藏敏感信息
  const maskSecret = (secret: string) => {
    if (!secret) return '';
    if (secret.length <= 8) return '***';
    return secret.substring(0, 4) + '***' + secret.substring(secret.length - 4);
  };

  // 获取类型图标
  const getTypeIcon = (type: WeChatConfigType) => {
    return type === 'miniprogram' ? <Smartphone className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />;
  };

  // 获取类型标签
  const getTypeLabel = (type: WeChatConfigType) => {
    return type === 'miniprogram' ? '小程序' : '公众号';
  };

  // 按类型筛选配置
  const filteredConfigs = configs.filter(config => config.type === activeTab);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">微信配置管理</h1>
          <p className="text-muted-foreground mt-2">
            管理微信小程序和公众号的接口配置
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          添加配置
        </Button>
      </div>

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as WeChatConfigType)}>
        <TabsList>
          <TabsTrigger value="miniprogram" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            微信小程序
          </TabsTrigger>
          <TabsTrigger value="official_account" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            微信公众号
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-muted-foreground">加载中...</p>
            </div>
          ) : filteredConfigs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  暂无{getTypeLabel(activeTab)}配置
                </p>
                <Button onClick={handleCreate} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  添加配置
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredConfigs.map((config) => (
                <Card key={config.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(config.type)}
                        <CardTitle>{config.name}</CardTitle>
                      </div>
                      <Badge variant={config.is_active ? 'default' : 'secondary'}>
                        {config.is_active ? '已启用' : '已禁用'}
                      </Badge>
                    </div>
                    <CardDescription>
                      创建于 {new Date(config.created_at).toLocaleString('zh-CN')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* AppID */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">AppID</Label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-2 py-1 bg-muted rounded text-sm">
                          {config.app_id}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(config.app_id, `appid-${config.id}`)}
                        >
                          {copiedField === `appid-${config.id}` ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* AppSecret */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">AppSecret</Label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-2 py-1 bg-muted rounded text-sm">
                          {showSecrets[config.id] ? config.app_secret : maskSecret(config.app_secret)}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleSecretVisibility(config.id)}
                        >
                          {showSecrets[config.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(config.app_secret, `secret-${config.id}`)}
                        >
                          {copiedField === `secret-${config.id}` ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Token */}
                    {config.token && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Token</Label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-2 py-1 bg-muted rounded text-sm truncate">
                            {config.token}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(config.token!, `token-${config.id}`)}
                          >
                            {copiedField === `token-${config.id}` ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(config)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        编辑
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(config)}
                      >
                        {config.is_active ? '禁用' : '启用'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(config)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        删除
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 编辑/新建对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? '编辑配置' : '添加配置'}
            </DialogTitle>
            <DialogDescription>
              {editingConfig ? '修改微信配置信息' : '添加新的微信配置'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 类型选择 */}
            <div className="space-y-2">
              <Label htmlFor="type">类型 *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: WeChatConfigType) =>
                  setFormData({ ...formData, type: value })
                }
                disabled={!!editingConfig}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="miniprogram">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      微信小程序
                    </div>
                  </SelectItem>
                  <SelectItem value="official_account">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      微信公众号
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 配置名称 */}
            <div className="space-y-2">
              <Label htmlFor="name">配置名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：主小程序、测试公众号"
              />
            </div>

            {/* AppID */}
            <div className="space-y-2">
              <Label htmlFor="app_id">AppID *</Label>
              <Input
                id="app_id"
                value={formData.app_id}
                onChange={(e) => setFormData({ ...formData, app_id: e.target.value })}
                placeholder="wx1234567890abcdef"
              />
            </div>

            {/* AppSecret */}
            <div className="space-y-2">
              <Label htmlFor="app_secret">AppSecret *</Label>
              <Input
                id="app_secret"
                type="password"
                value={formData.app_secret}
                onChange={(e) => setFormData({ ...formData, app_secret: e.target.value })}
                placeholder="请输入 AppSecret"
              />
            </div>

            {/* Token */}
            <div className="space-y-2">
              <Label htmlFor="token">Token</Label>
              <Input
                id="token"
                value={formData.token}
                onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                placeholder="用于消息验证"
              />
            </div>

            {/* EncodingAESKey */}
            <div className="space-y-2">
              <Label htmlFor="encoding_aes_key">EncodingAESKey</Label>
              <Input
                id="encoding_aes_key"
                value={formData.encoding_aes_key}
                onChange={(e) => setFormData({ ...formData, encoding_aes_key: e.target.value })}
                placeholder="用于消息加密"
              />
            </div>

            {/* 其他配置 */}
            <div className="space-y-2">
              <Label htmlFor="config_data">其他配置 (JSON)</Label>
              <Textarea
                id="config_data"
                value={JSON.stringify(formData.config_data, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setFormData({ ...formData, config_data: parsed });
                  } catch (error) {
                    // 忽略 JSON 解析错误，等待用户输入完整
                  }
                }}
                placeholder='{"description": "配置说明", "version": "1.0.0"}'
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                可选的额外配置信息，格式为 JSON
              </p>
            </div>

            {/* 是否启用 */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>启用配置</Label>
                <p className="text-sm text-muted-foreground">
                  启用后该配置将生效
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingConfig ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
