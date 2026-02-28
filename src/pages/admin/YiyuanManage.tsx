import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useToast } from '@/hooks/use-toast';
import type { YiyuanProduct, YiyuanContent, YiyuanVerificationGuide, YiyuanManufacturer } from '@/types';

export default function YiyuanManagePage() {
  const [products, setProducts] = useState<YiyuanProduct[]>([]);
  const [content, setContent] = useState<YiyuanContent[]>([]);
  const [verificationSteps, setVerificationSteps] = useState<YiyuanVerificationGuide[]>([]);
  const [manufacturer, setManufacturer] = useState<YiyuanManufacturer | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Partial<YiyuanProduct> | null>(null);
  const [editingContent, setEditingContent] = useState<Partial<YiyuanContent> | null>(null);
  const [editingStep, setEditingStep] = useState<Partial<YiyuanVerificationGuide> | null>(null);
  const [editingManufacturer, setEditingManufacturer] = useState<Partial<YiyuanManufacturer> | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isContentDialogOpen, setIsContentDialogOpen] = useState(false);
  const [isStepDialogOpen, setIsStepDialogOpen] = useState(false);
  const [isManufacturerDialogOpen, setIsManufacturerDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [productsRes, contentRes, stepsRes, manufacturerRes] = await Promise.all([
        supabase.from('yiyuan_products').select('*').order('display_order'),
        supabase.from('yiyuan_content').select('*'),
        supabase.from('yiyuan_verification_guide').select('*').order('display_order'),
        supabase.from('yiyuan_manufacturer').select('*').limit(1).single()
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      if (contentRes.data) setContent(contentRes.data);
      if (stepsRes.data) setVerificationSteps(stepsRes.data);
      if (manufacturerRes.data) setManufacturer(manufacturerRes.data);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast({
        title: '加载失败',
        description: '无法加载数据，请刷新页面重试',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // 产品管理
  const handleSaveProduct = async () => {
    if (!editingProduct) return;

    try {
      if (editingProduct.id) {
        // 更新
        const { error } = await supabase
          .from('yiyuan_products')
          .update({
            ...editingProduct,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast({ title: '更新成功', description: '产品信息已更新' });
      } else {
        // 新增
        const { error } = await supabase
          .from('yiyuan_products')
          .insert([editingProduct]);

        if (error) throw error;
        toast({ title: '添加成功', description: '新产品已添加' });
      }

      setIsProductDialogOpen(false);
      setEditingProduct(null);
      loadData();
    } catch (error) {
      console.error('保存产品失败:', error);
      toast({
        title: '保存失败',
        description: '无法保存产品信息',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('确定要删除这个产品吗？')) return;

    try {
      const { error } = await supabase
        .from('yiyuan_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: '删除成功', description: '产品已删除' });
      loadData();
    } catch (error) {
      console.error('删除产品失败:', error);
      toast({
        title: '删除失败',
        description: '无法删除产品',
        variant: 'destructive'
      });
    }
  };

  // 内容管理
  const handleSaveContent = async () => {
    if (!editingContent) return;

    try {
      if (editingContent.id) {
        const { error } = await supabase
          .from('yiyuan_content')
          .update({
            ...editingContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingContent.id);

        if (error) throw error;
        toast({ title: '更新成功', description: '内容已更新' });
      }

      setIsContentDialogOpen(false);
      setEditingContent(null);
      loadData();
    } catch (error) {
      console.error('保存内容失败:', error);
      toast({
        title: '保存失败',
        description: '无法保存内容',
        variant: 'destructive'
      });
    }
  };

  // 验证步骤管理
  const handleSaveStep = async () => {
    if (!editingStep) return;

    try {
      if (editingStep.id) {
        const { error } = await supabase
          .from('yiyuan_verification_guide')
          .update({
            ...editingStep,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingStep.id);

        if (error) throw error;
        toast({ title: '更新成功', description: '验证步骤已更新' });
      } else {
        const { error } = await supabase
          .from('yiyuan_verification_guide')
          .insert([editingStep]);

        if (error) throw error;
        toast({ title: '添加成功', description: '新验证步骤已添加' });
      }

      setIsStepDialogOpen(false);
      setEditingStep(null);
      loadData();
    } catch (error) {
      console.error('保存验证步骤失败:', error);
      toast({
        title: '保存失败',
        description: '无法保存验证步骤',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteStep = async (id: string) => {
    if (!confirm('确定要删除这个验证步骤吗？')) return;

    try {
      const { error } = await supabase
        .from('yiyuan_verification_guide')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: '删除成功', description: '验证步骤已删除' });
      loadData();
    } catch (error) {
      console.error('删除验证步骤失败:', error);
      toast({
        title: '删除失败',
        description: '无法删除验证步骤',
        variant: 'destructive'
      });
    }
  };

  // 生产商信息管理
  const handleSaveManufacturer = async () => {
    if (!editingManufacturer) return;

    try {
      if (manufacturer?.id) {
        // 更新现有记录
        const { error } = await supabase
          .from('yiyuan_manufacturer')
          .update({
            ...editingManufacturer,
            updated_at: new Date().toISOString()
          })
          .eq('id', manufacturer.id);

        if (error) throw error;
        toast({ title: '更新成功', description: '生产商信息已更新' });
      } else {
        // 创建新记录
        const { error } = await supabase
          .from('yiyuan_manufacturer')
          .insert([editingManufacturer]);

        if (error) throw error;
        toast({ title: '添加成功', description: '生产商信息已添加' });
      }

      setIsManufacturerDialogOpen(false);
      setEditingManufacturer(null);
      loadData();
    } catch (error) {
      console.error('保存生产商信息失败:', error);
      toast({
        title: '保存失败',
        description: '无法保存生产商信息',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">翊鸢化工管理</h1>
        <p className="text-muted-foreground">管理产品、内容、防伪验证和生产商信息</p>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products">产品管理</TabsTrigger>
          <TabsTrigger value="content">内容管理</TabsTrigger>
          <TabsTrigger value="verification">防伪验证</TabsTrigger>
          <TabsTrigger value="manufacturer">生产商信息</TabsTrigger>
        </TabsList>

        {/* 产品管理 */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>产品列表</CardTitle>
                  <CardDescription>管理翊鸢化工的产品信息</CardDescription>
                </div>
                <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingProduct({
                      name_zh: '',
                      name_en: '',
                      description_zh: '',
                      description_en: '',
                      specifications_zh: '',
                      specifications_en: '',
                      features_zh: [],
                      features_en: [],
                      applications_zh: [],
                      applications_en: [],
                      display_order: 0,
                      is_active: true
                    })}>
                      <Plus className="h-4 w-4 mr-2" />
                      添加产品
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingProduct?.id ? '编辑产品' : '添加产品'}</DialogTitle>
                      <DialogDescription>填写产品的中英文信息</DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>产品名称（中文）*</Label>
                          <Input
                            value={editingProduct?.name_zh || ''}
                            onChange={(e) => setEditingProduct({ ...editingProduct, name_zh: e.target.value })}
                            placeholder="例如：工业级乙醇"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Product Name (English)*</Label>
                          <Input
                            value={editingProduct?.name_en || ''}
                            onChange={(e) => setEditingProduct({ ...editingProduct, name_en: e.target.value })}
                            placeholder="e.g., Industrial Grade Ethanol"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>产品描述（中文）</Label>
                          <Textarea
                            value={editingProduct?.description_zh || ''}
                            onChange={(e) => setEditingProduct({ ...editingProduct, description_zh: e.target.value })}
                            placeholder="产品简介"
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Product Description (English)</Label>
                          <Textarea
                            value={editingProduct?.description_en || ''}
                            onChange={(e) => setEditingProduct({ ...editingProduct, description_en: e.target.value })}
                            placeholder="Product description"
                            rows={3}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>产品规格（中文）</Label>
                          <Textarea
                            value={editingProduct?.specifications_zh || ''}
                            onChange={(e) => setEditingProduct({ ...editingProduct, specifications_zh: e.target.value })}
                            placeholder="纯度：≥99.5%&#10;包装：200L/桶"
                            rows={4}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Specifications (English)</Label>
                          <Textarea
                            value={editingProduct?.specifications_en || ''}
                            onChange={(e) => setEditingProduct({ ...editingProduct, specifications_en: e.target.value })}
                            placeholder="Purity: ≥99.5%&#10;Packaging: 200L/drum"
                            rows={4}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>产品特点（中文，逗号分隔）</Label>
                          <Input
                            value={editingProduct?.features_zh?.join(',') || ''}
                            onChange={(e) => setEditingProduct({ 
                              ...editingProduct, 
                              features_zh: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                            })}
                            placeholder="高纯度,低杂质,稳定性好"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Features (English, comma separated)</Label>
                          <Input
                            value={editingProduct?.features_en?.join(',') || ''}
                            onChange={(e) => setEditingProduct({ 
                              ...editingProduct, 
                              features_en: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                            })}
                            placeholder="High purity,Low impurity,Good stability"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>应用领域（中文，逗号分隔）</Label>
                          <Input
                            value={editingProduct?.applications_zh?.join(',') || ''}
                            onChange={(e) => setEditingProduct({ 
                              ...editingProduct, 
                              applications_zh: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                            })}
                            placeholder="溶剂,清洗剂,化工原料"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Applications (English, comma separated)</Label>
                          <Input
                            value={editingProduct?.applications_en?.join(',') || ''}
                            onChange={(e) => setEditingProduct({ 
                              ...editingProduct, 
                              applications_en: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                            })}
                            placeholder="Solvent,Cleaning agent,Chemical raw material"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>图片URL</Label>
                          <Input
                            value={editingProduct?.image_url || ''}
                            onChange={(e) => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                            placeholder="https://..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>显示顺序</Label>
                          <Input
                            type="number"
                            value={editingProduct?.display_order || 0}
                            onChange={(e) => setEditingProduct({ ...editingProduct, display_order: parseInt(e.target.value) })}
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={editingProduct?.is_active ?? true}
                          onCheckedChange={(checked) => setEditingProduct({ ...editingProduct, is_active: checked })}
                        />
                        <Label>启用产品</Label>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setIsProductDialogOpen(false);
                        setEditingProduct(null);
                      }}>
                        <X className="h-4 w-4 mr-2" />
                        取消
                      </Button>
                      <Button onClick={handleSaveProduct}>
                        <Save className="h-4 w-4 mr-2" />
                        保存
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>产品名称</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>顺序</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <div>{product.name_zh}</div>
                        <div className="text-sm text-muted-foreground">{product.name_en}</div>
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {product.description_zh}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.is_active ? 'default' : 'secondary'}>
                          {product.is_active ? '启用' : '禁用'}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.display_order}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingProduct(product);
                              setIsProductDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 内容管理 */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>页面内容管理</CardTitle>
              <CardDescription>编辑页面各个部分的内容</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {content.map((item) => (
                  <Card key={item.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{item.section_key}</CardTitle>
                          <CardDescription>{item.title_zh} / {item.title_en}</CardDescription>
                        </div>
                        <Dialog open={isContentDialogOpen && editingContent?.id === item.id} onOpenChange={(open) => {
                          setIsContentDialogOpen(open);
                          if (!open) setEditingContent(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingContent(item)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              编辑
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>编辑内容 - {item.section_key}</DialogTitle>
                            </DialogHeader>
                            
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>标题（中文）</Label>
                                  <Input
                                    value={editingContent?.title_zh || ''}
                                    onChange={(e) => setEditingContent({ ...editingContent, title_zh: e.target.value })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Title (English)</Label>
                                  <Input
                                    value={editingContent?.title_en || ''}
                                    onChange={(e) => setEditingContent({ ...editingContent, title_en: e.target.value })}
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>内容（中文）</Label>
                                  <Textarea
                                    value={editingContent?.content_zh || ''}
                                    onChange={(e) => setEditingContent({ ...editingContent, content_zh: e.target.value })}
                                    rows={6}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Content (English)</Label>
                                  <Textarea
                                    value={editingContent?.content_en || ''}
                                    onChange={(e) => setEditingContent({ ...editingContent, content_en: e.target.value })}
                                    rows={6}
                                  />
                                </div>
                              </div>
                            </div>

                            <DialogFooter>
                              <Button variant="outline" onClick={() => {
                                setIsContentDialogOpen(false);
                                setEditingContent(null);
                              }}>
                                取消
                              </Button>
                              <Button onClick={handleSaveContent}>
                                <Save className="h-4 w-4 mr-2" />
                                保存
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium mb-1">中文内容：</p>
                          <p className="text-muted-foreground">{item.content_zh}</p>
                        </div>
                        <div>
                          <p className="font-medium mb-1">English Content:</p>
                          <p className="text-muted-foreground">{item.content_en}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 防伪验证管理 */}
        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>防伪验证步骤</CardTitle>
                  <CardDescription>管理防伪验证说明步骤</CardDescription>
                </div>
                <Dialog open={isStepDialogOpen} onOpenChange={setIsStepDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingStep({
                      step_number: verificationSteps.length + 1,
                      title_zh: '',
                      title_en: '',
                      description_zh: '',
                      description_en: '',
                      display_order: verificationSteps.length + 1
                    })}>
                      <Plus className="h-4 w-4 mr-2" />
                      添加步骤
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>{editingStep?.id ? '编辑步骤' : '添加步骤'}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>步骤编号</Label>
                          <Input
                            type="number"
                            value={editingStep?.step_number || 1}
                            onChange={(e) => setEditingStep({ ...editingStep, step_number: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>显示顺序</Label>
                          <Input
                            type="number"
                            value={editingStep?.display_order || 1}
                            onChange={(e) => setEditingStep({ ...editingStep, display_order: parseInt(e.target.value) })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>标题（中文）*</Label>
                          <Input
                            value={editingStep?.title_zh || ''}
                            onChange={(e) => setEditingStep({ ...editingStep, title_zh: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Title (English)*</Label>
                          <Input
                            value={editingStep?.title_en || ''}
                            onChange={(e) => setEditingStep({ ...editingStep, title_en: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>描述（中文）</Label>
                          <Textarea
                            value={editingStep?.description_zh || ''}
                            onChange={(e) => setEditingStep({ ...editingStep, description_zh: e.target.value })}
                            rows={4}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description (English)</Label>
                          <Textarea
                            value={editingStep?.description_en || ''}
                            onChange={(e) => setEditingStep({ ...editingStep, description_en: e.target.value })}
                            rows={4}
                          />
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setIsStepDialogOpen(false);
                        setEditingStep(null);
                      }}>
                        取消
                      </Button>
                      <Button onClick={handleSaveStep}>
                        <Save className="h-4 w-4 mr-2" />
                        保存
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>步骤</TableHead>
                    <TableHead>标题</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>顺序</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verificationSteps.map((step) => (
                    <TableRow key={step.id}>
                      <TableCell>
                        <Badge>{step.step_number}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>{step.title_zh}</div>
                        <div className="text-sm text-muted-foreground">{step.title_en}</div>
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {step.description_zh}
                      </TableCell>
                      <TableCell>{step.display_order}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingStep(step);
                              setIsStepDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteStep(step.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 生产商信息管理 */}
        <TabsContent value="manufacturer" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>生产商信息</CardTitle>
                  <CardDescription>管理生产商的详细信息</CardDescription>
                </div>
                {manufacturer && (
                  <Button
                    onClick={() => {
                      setEditingManufacturer(manufacturer);
                      setIsManufacturerDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    编辑信息
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {manufacturer ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">执行标准（中文）</Label>
                      <p className="mt-1 text-base">{manufacturer.standard_zh}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">执行标准（英文）</Label>
                      <p className="mt-1 text-base">{manufacturer.standard_en}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">产地（中文）</Label>
                      <p className="mt-1 text-base">{manufacturer.origin_zh}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">产地（英文）</Label>
                      <p className="mt-1 text-base">{manufacturer.origin_en}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">公司名称（中文）</Label>
                      <p className="mt-1 text-base font-medium">{manufacturer.company_name_zh}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">公司名称（英文）</Label>
                      <p className="mt-1 text-base font-medium">{manufacturer.company_name_en}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">地址（中文）</Label>
                      <p className="mt-1 text-base">{manufacturer.address_zh}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">地址（英文）</Label>
                      <p className="mt-1 text-base">{manufacturer.address_en}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">网址</Label>
                      <p className="mt-1 text-base">
                        <a 
                          href={manufacturer.website.startsWith('http') ? manufacturer.website : `https://${manufacturer.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {manufacturer.website}
                        </a>
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">邮箱</Label>
                      <p className="mt-1 text-base">
                        <a 
                          href={`mailto:${manufacturer.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {manufacturer.email}
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">暂无生产商信息</p>
                  <Button
                    onClick={() => {
                      setEditingManufacturer({
                        standard_zh: '符合行业标准',
                        standard_en: 'Complies with industry standards',
                        origin_zh: '广东·深圳',
                        origin_en: 'Shenzhen, Guangdong',
                        company_name_zh: '',
                        company_name_en: '',
                        address_zh: '',
                        address_en: '',
                        website: '',
                        email: ''
                      });
                      setIsManufacturerDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    添加生产商信息
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 生产商信息编辑对话框 */}
      <Dialog open={isManufacturerDialogOpen} onOpenChange={setIsManufacturerDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑生产商信息</DialogTitle>
            <DialogDescription>修改生产商的详细信息</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="standard_zh">执行标准（中文）*</Label>
                <Input
                  id="standard_zh"
                  value={editingManufacturer?.standard_zh || ''}
                  onChange={(e) => setEditingManufacturer({ ...editingManufacturer, standard_zh: e.target.value })}
                  placeholder="符合行业标准"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="standard_en">执行标准（英文）*</Label>
                <Input
                  id="standard_en"
                  value={editingManufacturer?.standard_en || ''}
                  onChange={(e) => setEditingManufacturer({ ...editingManufacturer, standard_en: e.target.value })}
                  placeholder="Complies with industry standards"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="origin_zh">产地（中文）*</Label>
                <Input
                  id="origin_zh"
                  value={editingManufacturer?.origin_zh || ''}
                  onChange={(e) => setEditingManufacturer({ ...editingManufacturer, origin_zh: e.target.value })}
                  placeholder="广东·深圳"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="origin_en">产地（英文）*</Label>
                <Input
                  id="origin_en"
                  value={editingManufacturer?.origin_en || ''}
                  onChange={(e) => setEditingManufacturer({ ...editingManufacturer, origin_en: e.target.value })}
                  placeholder="Shenzhen, Guangdong"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name_zh">公司名称（中文）*</Label>
                <Input
                  id="company_name_zh"
                  value={editingManufacturer?.company_name_zh || ''}
                  onChange={(e) => setEditingManufacturer({ ...editingManufacturer, company_name_zh: e.target.value })}
                  placeholder="义乌市颂祝浔礼文化创意有限公司"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_name_en">公司名称（英文）*</Label>
                <Input
                  id="company_name_en"
                  value={editingManufacturer?.company_name_en || ''}
                  onChange={(e) => setEditingManufacturer({ ...editingManufacturer, company_name_en: e.target.value })}
                  placeholder="Yiwu Songzhuxunli Cultural Creative Co., Ltd."
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address_zh">地址（中文）*</Label>
                <Textarea
                  id="address_zh"
                  value={editingManufacturer?.address_zh || ''}
                  onChange={(e) => setEditingManufacturer({ ...editingManufacturer, address_zh: e.target.value })}
                  placeholder="浙江省义乌市甘三里街道春潮路11号3楼"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_en">地址（英文）*</Label>
                <Textarea
                  id="address_en"
                  value={editingManufacturer?.address_en || ''}
                  onChange={(e) => setEditingManufacturer({ ...editingManufacturer, address_en: e.target.value })}
                  placeholder="3rd Floor, No. 11 Chunchao Road, Gansanli Street, Yiwu City, Zhejiang Province"
                  rows={3}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">网址*</Label>
                <Input
                  id="website"
                  type="url"
                  value={editingManufacturer?.website || ''}
                  onChange={(e) => setEditingManufacturer({ ...editingManufacturer, website: e.target.value })}
                  placeholder="www.ifixes.com.cn"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">邮箱*</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingManufacturer?.email || ''}
                  onChange={(e) => setEditingManufacturer({ ...editingManufacturer, email: e.target.value })}
                  placeholder="dps@ifixes.com.cn"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManufacturerDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              取消
            </Button>
            <Button onClick={handleSaveManufacturer}>
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
