import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  MousePointer, 
  Eye, 
  Copy, 
  Check, 
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/db/supabase';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface VisualSelectorProps {
  url: string;
  onSelectorSelected: (selector: string, type: 'title' | 'content' | 'excerpt' | 'cover' | 'author' | 'date') => void;
}

interface SelectedElement {
  selector: string;
  text: string;
  html: string;
  type: string;
}

export default function VisualSelector({ url, onSelectorSelected }: VisualSelectorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectMode, setSelectMode] = useState<'title' | 'content' | 'excerpt' | 'cover' | 'author' | 'date' | null>(null);
  const [selectedElements, setSelectedElements] = useState<Record<string, SelectedElement>>({});
  const [previewUrl, setPreviewUrl] = useState('');
  const [pageLoaded, setPageLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (url) {
      setPreviewUrl(url);
    }
  }, [url]);

  const loadPage = async () => {
    if (!previewUrl) {
      toast({
        title: '错误',
        description: '请先输入URL',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    setPageLoaded(false);
    
    try {
      console.log('开始加载页面:', previewUrl);
      
      // 通过代理服务获取页面
      const { data, error } = await supabase.functions.invoke('proxy-page', {
        body: { url: previewUrl }
      });

      if (error) {
        console.error('Edge Function调用失败:', error);
        throw new Error(error.message || '无法连接到代理服务');
      }

      if (!data) {
        throw new Error('代理服务返回空数据');
      }

      console.log('页面数据已获取，准备写入iframe');

      // 将HTML加载到iframe中
      if (iframeRef.current) {
        const iframe = iframeRef.current;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(data);
          iframeDoc.close();

          // 等待页面加载完成
          iframe.onload = () => {
            console.log('iframe加载完成');
            
            // 检查是否是错误页面
            const errorContainer = iframeDoc.querySelector('.error-container');
            if (errorContainer) {
              const errorMsg = iframeDoc.querySelector('.error-details')?.textContent || '页面加载失败';
              toast({
                title: '加载失败',
                description: errorMsg.replace('错误信息：', '').trim(),
                variant: 'destructive'
              });
              setPageLoaded(false);
              return;
            }
            
            setupIframeInteraction();
            setPageLoaded(true);
            toast({
              title: '加载成功',
              description: '页面已加载，现在可以选择元素'
            });
          };

          // 添加错误处理
          iframe.onerror = () => {
            console.error('iframe加载错误');
            toast({
              title: '加载失败',
              description: 'iframe加载失败，请检查URL是否正确',
              variant: 'destructive'
            });
            setPageLoaded(false);
          };
        } else {
          throw new Error('无法访问iframe文档');
        }
      } else {
        throw new Error('iframe引用不存在');
      }
    } catch (error: any) {
      console.error('加载页面失败:', error);
      toast({
        title: '加载失败',
        description: error.message || '无法加载页面，请检查URL是否正确',
        variant: 'destructive'
      });
      setPageLoaded(false);
    } finally {
      setLoading(false);
    }
  };

  const setupIframeInteraction = () => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (!iframeDoc) return;

    // 移除之前的事件监听器
    const oldListener = (iframeDoc as any)._scraperClickListener;
    if (oldListener) {
      iframeDoc.removeEventListener('click', oldListener, true);
    }

    // 添加点击事件监听器
    const clickListener = (event: MouseEvent) => {
      if (!selectMode) return;

      event.preventDefault();
      event.stopPropagation();

      const target = event.target as HTMLElement;
      
      // 移除之前的高亮
      iframeDoc.querySelectorAll('.scraper-selector-highlight').forEach(el => {
        el.classList.remove('scraper-selector-highlight');
      });

      // 高亮当前元素
      target.classList.add('scraper-selector-highlight');

      // 生成选择器
      const selector = generateSelector(target, iframeDoc);
      const text = target.textContent?.trim() || '';
      const html = target.innerHTML || '';

      const selected: SelectedElement = {
        selector,
        text: text.substring(0, 100),
        html: html.substring(0, 200),
        type: selectMode
      };

      setSelectedElements(prev => ({
        ...prev,
        [selectMode]: selected
      }));

      onSelectorSelected(selector, selectMode);

      toast({
        title: '选择成功',
        description: `已选择${getTypeLabel(selectMode)}元素`
      });

      setSelectMode(null);
    };

    // 保存监听器引用
    (iframeDoc as any)._scraperClickListener = clickListener;
    iframeDoc.addEventListener('click', clickListener, true);

    // 添加鼠标悬停效果
    iframeDoc.addEventListener('mouseover', (event: MouseEvent) => {
      if (!selectMode) return;
      
      const target = event.target as HTMLElement;
      target.style.outline = '2px solid #3b82f6';
      target.style.outlineOffset = '2px';
      target.style.cursor = 'pointer';
    }, true);

    iframeDoc.addEventListener('mouseout', (event: MouseEvent) => {
      if (!selectMode) return;
      
      const target = event.target as HTMLElement;
      if (!target.classList.contains('scraper-selector-highlight')) {
        target.style.outline = '';
        target.style.outlineOffset = '';
        target.style.cursor = '';
      }
    }, true);
  };

  const startSelectMode = (type: 'title' | 'content' | 'excerpt' | 'cover' | 'author' | 'date') => {
    if (!pageLoaded) {
      toast({
        title: '提示',
        description: '请先加载页面',
        variant: 'destructive'
      });
      return;
    }

    setSelectMode(type);
    toast({
      title: '选择模式',
      description: `请在预览窗口中点击要提取${getTypeLabel(type)}的元素`
    });
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      title: '标题',
      content: '内容',
      excerpt: '摘要',
      cover: '封面图',
      author: '作者',
      date: '发布日期'
    };
    return labels[type] || type;
  };

  const generateSelector = (element: HTMLElement, doc: Document): string => {
    // 优先使用ID
    if (element.id) {
      return `#${element.id}`;
    }

    // 使用class（选择最具体的class）
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter(c => 
        c && 
        !c.match(/^(css-|MuiBox-|makeStyles|scraper-selector)/) &&
        c.length < 30
      );
      if (classes.length > 0) {
        return `${element.tagName.toLowerCase()}.${classes[0]}`;
      }
    }

    // 使用标签名 + 属性
    const attrs = element.attributes;
    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i];
      if (attr.name === 'data-testid' || attr.name === 'data-id') {
        return `${element.tagName.toLowerCase()}[${attr.name}="${attr.value}"]`;
      }
    }

    // 使用标签名 + nth-child
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(element) + 1;
      const parentSelector = parent.tagName.toLowerCase();
      return `${parentSelector} > ${element.tagName.toLowerCase()}:nth-child(${index})`;
    }

    return element.tagName.toLowerCase();
  };

  const copySelector = (selector: string) => {
    navigator.clipboard.writeText(selector);
    toast({
      title: '已复制',
      description: 'CSS选择器已复制到剪贴板'
    });
  };

  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <Card>
        <CardHeader>
          <CardTitle>可视化选择器</CardTitle>
          <CardDescription>
            点击下方按钮进入选择模式，然后在预览窗口中点击要提取的元素
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL输入 */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                value={previewUrl}
                onChange={(e) => setPreviewUrl(e.target.value)}
                placeholder="输入要采集的网页URL"
              />
            </div>
            <Button onClick={loadPage} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  加载中...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  加载页面
                </>
              )}
            </Button>
          </div>

          {/* 选择按钮 */}
          {pageLoaded && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <Button
                variant={selectMode === 'title' ? 'default' : 'outline'}
                onClick={() => startSelectMode('title')}
                className="w-full"
              >
                <MousePointer className="w-4 h-4 mr-2" />
                选择标题
              </Button>
              <Button
                variant={selectMode === 'content' ? 'default' : 'outline'}
                onClick={() => startSelectMode('content')}
                className="w-full"
              >
                <MousePointer className="w-4 h-4 mr-2" />
                选择内容
              </Button>
              <Button
                variant={selectMode === 'excerpt' ? 'default' : 'outline'}
                onClick={() => startSelectMode('excerpt')}
                className="w-full"
              >
                <MousePointer className="w-4 h-4 mr-2" />
                选择摘要
              </Button>
              <Button
                variant={selectMode === 'cover' ? 'default' : 'outline'}
                onClick={() => startSelectMode('cover')}
                className="w-full"
              >
                <MousePointer className="w-4 h-4 mr-2" />
                选择封面图
              </Button>
              <Button
                variant={selectMode === 'author' ? 'default' : 'outline'}
                onClick={() => startSelectMode('author')}
                className="w-full"
              >
                <MousePointer className="w-4 h-4 mr-2" />
                选择作者
              </Button>
              <Button
                variant={selectMode === 'date' ? 'default' : 'outline'}
                onClick={() => startSelectMode('date')}
                className="w-full"
              >
                <MousePointer className="w-4 h-4 mr-2" />
                选择日期
              </Button>
            </div>
          )}

          {/* 当前选择模式提示 */}
          {selectMode && (
            <Alert>
              <MousePointer className="h-4 w-4" />
              <AlertTitle>选择模式已激活</AlertTitle>
              <AlertDescription>
                正在选择：<strong>{getTypeLabel(selectMode)}</strong>
                <br />
                请在下方预览窗口中点击要提取的元素
              </AlertDescription>
            </Alert>
          )}

          {/* 已选择的元素 */}
          {Object.keys(selectedElements).length > 0 && (
            <div className="space-y-2">
              <Label>已选择的元素</Label>
              <div className="space-y-2">
                {Object.entries(selectedElements).map(([type, element]) => (
                  <div key={type} className="flex items-start gap-2 p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{getTypeLabel(type)}</Badge>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {element.selector}
                        </code>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {element.text}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copySelector(element.selector)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 预览窗口 */}
      <Card>
        <CardHeader>
          <CardTitle>页面预览</CardTitle>
          <CardDescription>
            在下方预览窗口中点击元素来选择CSS选择器
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pageLoaded ? (
            <div className="border rounded-lg overflow-hidden">
              <iframe
                ref={iframeRef}
                className="w-full h-[600px]"
                sandbox="allow-same-origin allow-scripts"
                title="页面预览"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed rounded-lg">
              <Eye className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">输入URL并加载页面以开始选择元素</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 使用提示 */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>使用提示</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>输入URL后点击"加载页面"按钮</li>
            <li>等待页面加载完成</li>
            <li>点击"选择XX"按钮进入选择模式</li>
            <li>在预览窗口中点击要提取的元素</li>
            <li>系统会自动生成最优的CSS选择器</li>
            <li>可以点击复制按钮复制选择器</li>
            <li>选择器会自动填充到表单中</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
