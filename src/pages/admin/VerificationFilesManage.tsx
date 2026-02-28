import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Upload, FileText, CheckCircle, Download, Info, ExternalLink } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface VerificationFile {
  id: string;
  filename: string;
  content: string;
  created_at: string;
  created_by: string;
}

export default function VerificationFilesManage() {
  const [files, setFiles] = useState<VerificationFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [testingFile, setTestingFile] = useState<string | null>(null);
  const { toast } = useToast();

  // 加载验证文件列表
  const loadFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('verification_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('加载验证文件失败:', error);
      toast({
        title: '加载失败',
        description: '无法加载验证文件列表',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型（支持 .txt 和 .html）
    if (!file.name.endsWith('.txt') && !file.name.endsWith('.html')) {
      toast({
        title: '文件类型错误',
        description: '只能上传 .txt 或 .html 文件',
        variant: 'destructive',
      });
      return;
    }

    // 验证文件大小（不超过50KB）
    if (file.size > 50 * 1024) {
      toast({
        title: '文件过大',
        description: '验证文件大小不应超过50KB',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
  };

  // 上传文件
  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);

      // 读取文件内容
      const content = await selectedFile.text();

      // 确定文件类型
      const fileType = selectedFile.name.endsWith('.html') ? 'html' : 'txt';

      // 获取当前用户
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      // 检查文件是否已存在
      const { data: existingFile } = await supabase
        .from('verification_files')
        .select('id')
        .eq('filename', selectedFile.name)
        .maybeSingle();

      if (existingFile) {
        // 更新现有文件
        const { error } = await supabase
          .from('verification_files')
          .update({
            content: content,
            file_type: fileType,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingFile.id);

        if (error) throw error;

        toast({
          title: '更新成功',
          description: `验证文件 ${selectedFile.name} 已更新`,
        });
      } else {
        // 插入新文件
        const { error } = await supabase.from('verification_files').insert({
          filename: selectedFile.name,
          content: content,
          file_type: fileType,
          created_by: user.email || 'admin',
        });

        if (error) throw error;

        toast({
          title: '上传成功',
          description: `验证文件 ${selectedFile.name} 已上传`,
        });
      }

      // 重新加载列表
      loadFiles();
      setSelectedFile(null);

      // 清空文件选择
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('上传失败:', error);
      toast({
        title: '上传失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  // 删除文件
  const handleDelete = async (id: string, filename: string) => {
    if (!confirm(`确定要删除验证文件 ${filename} 吗？`)) return;

    try {
      const { error } = await supabase
        .from('verification_files')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: '删除成功',
        description: `验证文件 ${filename} 已删除`,
      });

      loadFiles();
    } catch (error) {
      console.error('删除失败:', error);
      toast({
        title: '删除失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  // 测试文件访问
  const testFileAccess = async (filename: string) => {
    setTestingFile(filename);
    
    try {
      // 测试Edge Function访问
      const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verification-file/${filename}`;
      
      const response = await fetch(edgeFunctionUrl, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        }
      });
      
      if (response.ok) {
        const content = await response.text();
        const preview = content.length > 100 ? content.substring(0, 100) + '...' : content;
        
        toast({
          title: '✅ Edge Function访问成功',
          description: (
            <div className="space-y-2 text-sm">
              <p>验证文件可以通过Edge Function正常访问。</p>
              <div className="bg-muted p-2 rounded font-mono text-xs">
                {preview}
              </div>
              <p className="text-xs text-muted-foreground">
                Edge Function URL: {edgeFunctionUrl}
              </p>
              <div className="border-t pt-2 mt-2">
                <p className="font-semibold">⚠️ 下一步：配置Nginx</p>
                <p className="text-xs">
                  为了让搜索引擎能访问验证文件，您需要配置Nginx将根路径请求重写到Edge Function。
                  <br />
                  目标URL: https://yourdomain.com/{filename}
                </p>
              </div>
            </div>
          ),
        });
      } else {
        const errorText = await response.text();
        toast({
          title: '❌ Edge Function访问失败',
          description: (
            <div className="space-y-2 text-sm">
              <p>HTTP {response.status}: {response.statusText}</p>
              {errorText && (
                <div className="bg-muted p-2 rounded font-mono text-xs">
                  {errorText}
                </div>
              )}
              <div className="border-t pt-2 mt-2">
                <p className="font-semibold">可能的原因：</p>
                <ul className="list-disc list-inside text-xs space-y-1">
                  <li>Edge Function未部署或部署失败</li>
                  <li>文件名不匹配（区分大小写）</li>
                  <li>数据库中没有该文件记录</li>
                  <li>Supabase配置错误</li>
                </ul>
              </div>
            </div>
          ),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('测试访问失败:', error);
      toast({
        title: '❌ 测试失败',
        description: (
          <div className="space-y-2 text-sm">
            <p>无法连接到Edge Function</p>
            <div className="border-t pt-2 mt-2">
              <p className="font-semibold">可能的原因：</p>
              <ul className="list-disc list-inside text-xs space-y-1">
                <li>网络连接问题</li>
                <li>Edge Function未部署</li>
                <li>Supabase服务不可用</li>
                <li>CORS配置问题</li>
              </ul>
            </div>
          </div>
        ),
        variant: 'destructive',
      });
    } finally {
      setTestingFile(null);
    }
  };

  // 下载文件
  const handleDownload = (file: VerificationFile) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">搜索引擎验证文件管理</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Info className="h-4 w-4 mr-2" />
                使用说明
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>搜索引擎验证文件使用说明</DialogTitle>
                <DialogDescription>
                  支持Google、Bing、Baidu、360、Sogou、微信等所有搜索引擎和平台的验证
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 text-sm">
                {/* Google Search Console */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    🔍 Google Search Console
                  </h3>
                  <ol className="list-decimal list-inside space-y-1 ml-2 text-muted-foreground">
                    <li>访问 <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Search Console</a></li>
                    <li>添加资源 → 选择"网址前缀"</li>
                    <li>选择"HTML文件"验证方法</li>
                    <li>下载验证文件（如：google1234567890abcdef.html）</li>
                    <li>在本页面上传该文件</li>
                    <li>点击"测试访问"确认可访问</li>
                    <li>返回Google，点击"验证"</li>
                  </ol>
                  <div className="mt-2 bg-muted p-2 rounded text-xs font-mono">
                    示例：https://yourdomain.com/google1234567890abcdef.html
                  </div>
                </div>

                {/* Bing Webmaster Tools */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    🔷 Bing Webmaster Tools
                  </h3>
                  <ol className="list-decimal list-inside space-y-1 ml-2 text-muted-foreground">
                    <li>访问 <a href="https://www.bing.com/webmasters" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Bing Webmaster Tools</a></li>
                    <li>添加站点 → 选择"HTML文件"验证</li>
                    <li>下载验证文件（如：BingSiteAuth.xml）</li>
                    <li>在本页面上传该文件（需手动改为.txt或.html）</li>
                    <li>返回Bing，点击"验证"</li>
                  </ol>
                  <div className="mt-2 bg-muted p-2 rounded text-xs font-mono">
                    示例：https://yourdomain.com/BingSiteAuth.xml
                  </div>
                </div>

                {/* Baidu Webmaster */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    🐾 百度站长平台
                  </h3>
                  <ol className="list-decimal list-inside space-y-1 ml-2 text-muted-foreground">
                    <li>访问 <a href="https://ziyuan.baidu.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">百度站长平台</a></li>
                    <li>用户中心 → 站点管理 → 添加网站</li>
                    <li>选择"文件验证"</li>
                    <li>下载验证文件（如：baidu_verify_xxxxx.html）</li>
                    <li>在本页面上传该文件</li>
                    <li>返回百度，点击"完成验证"</li>
                  </ol>
                  <div className="mt-2 bg-muted p-2 rounded text-xs font-mono">
                    示例：https://yourdomain.com/baidu_verify_xxxxx.html
                  </div>
                </div>

                {/* 360 Search */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    🔰 360站长平台
                  </h3>
                  <ol className="list-decimal list-inside space-y-1 ml-2 text-muted-foreground">
                    <li>访问 <a href="https://zhanzhang.so.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">360站长平台</a></li>
                    <li>添加网站 → 选择"文件验证"</li>
                    <li>下载验证文件</li>
                    <li>在本页面上传该文件</li>
                    <li>返回360，点击"验证"</li>
                  </ol>
                </div>

                {/* WeChat */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    💬 微信公众平台
                  </h3>
                  <ol className="list-decimal list-inside space-y-1 ml-2 text-muted-foreground">
                    <li>访问 <a href="https://mp.weixin.qq.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">微信公众平台</a></li>
                    <li>设置与开发 → 公众号设置 → 功能设置</li>
                    <li>配置"网页授权域名"或"JS接口安全域名"</li>
                    <li>下载验证文件（MP_verify_xxxxx.txt）</li>
                    <li>在本页面上传该文件</li>
                    <li>返回微信，点击"确定"完成验证</li>
                  </ol>
                  <div className="mt-2 bg-muted p-2 rounded text-xs font-mono">
                    示例：https://yourdomain.com/MP_verify_xxxxx.txt
                  </div>
                </div>

                {/* 通用说明 */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">⚠️ 重要提示：</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                    <li>支持 .txt 和 .html 格式的验证文件</li>
                    <li>文件大小不超过50KB</li>
                    <li>不要修改文件内容</li>
                    <li>确保网站已配置HTTPS（部分平台要求）</li>
                    <li>验证文件必须可以通过根目录访问</li>
                    <li>上传后请使用"测试访问"功能确认文件可访问</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">🔗 访问地址格式：</h3>
                  <div className="bg-muted p-3 rounded-md font-mono text-xs space-y-1">
                    <div>https://yourdomain.com/google1234567890abcdef.html</div>
                    <div>https://yourdomain.com/BingSiteAuth.xml</div>
                    <div>https://yourdomain.com/baidu_verify_xxxxx.html</div>
                    <div>https://yourdomain.com/MP_verify_xxxxx.txt</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">❓ 常见问题：</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                    <li>如果测试访问失败，请检查文件是否已上传</li>
                    <li>如果验证失败，请确认文件内容未被修改</li>
                    <li>支持同时上传多个验证文件（多个域名）</li>
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-muted-foreground">
          管理搜索引擎验证文件，支持Google、Bing、Baidu、360、Sogou、微信等所有平台
        </p>
      </div>

      {/* 使用说明卡片 */}
      <Alert className="mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-900 dark:text-blue-100">
          <div className="space-y-2">
            <p className="font-semibold">快速开始：</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>从搜索引擎平台下载验证文件（.txt 或 .html 格式）</li>
              <li>在下方上传验证文件</li>
              <li>点击"测试访问"确认文件可访问</li>
              <li>返回搜索引擎平台完成验证</li>
            </ol>
            <p className="text-xs mt-2 text-blue-700 dark:text-blue-300">
              💡 提示：验证文件通过Edge Function提供访问。如果测试访问失败，请查看配置文档。
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* 配置说明卡片 */}
      <Alert className="mb-6 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
        <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertDescription className="text-amber-900 dark:text-amber-100">
          <div className="space-y-3">
            <p className="font-semibold text-base">⚠️ 重要：Nginx配置要求</p>
            <p className="text-sm">
              为了让搜索引擎能够访问验证文件（如 <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">https://ifixescn.com/ByteDanceVerify.html</code> 和 <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">https://www.ifixescn.com/ByteDanceVerify.html</code>），
              您需要配置Nginx将验证文件请求重写到Edge Function。
            </p>
            
            <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-md text-xs space-y-2">
              <div>
                <div className="font-semibold mb-1">✅ 支持的域名：</div>
                <div className="font-mono">• https://ifixescn.com/验证文件.txt</div>
                <div className="font-mono">• https://www.ifixescn.com/验证文件.txt</div>
                <div className="font-mono">• https://ifixescn.com/验证文件.html</div>
                <div className="font-mono">• https://www.ifixescn.com/验证文件.html</div>
              </div>
              
              <div className="border-t border-amber-200 dark:border-amber-800 pt-2">
                <div className="font-semibold mb-1">📝 配置示例：</div>
                <div className="bg-amber-50 dark:bg-amber-950 p-2 rounded font-mono text-[10px] overflow-x-auto">
                  location ~ ^/[^/]+\.(txt|html)$ {'{'}<br />
                  &nbsp;&nbsp;proxy_pass https://backend.appmiaoda.com/...<br />
                  {'}'}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('/STATIC_FILE_SOLUTION.md', '_blank')}
                className="text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-0 font-bold shadow-lg animate-pulse"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                🚀 最简单方案（30秒搞定）
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('/VERIFICATION_FILE_ONE_CLICK_FIX.md', '_blank')}
                className="text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 border-0 font-semibold shadow-md"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                🔧 自动修复脚本
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('/IFIXESCN_NGINX_CONFIG_ACTUAL.md', '_blank')}
                className="text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                📋 Nginx配置示例
              </Button>
            </div>
            
            <div className="border-t border-amber-200 dark:border-amber-800 pt-2">
              <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold mb-1">
                💡 配置步骤：
              </p>
              <ol className="text-xs text-amber-700 dark:text-amber-300 space-y-1 ml-4 list-decimal">
                <li>点击上方"查看实际Nginx配置"按钮</li>
                <li>复制完整的Nginx配置内容</li>
                <li>SSH登录服务器，编辑 /etc/nginx/sites-available/ifixescn.com</li>
                <li>运行 sudo nginx -t 测试配置</li>
                <li>运行 sudo systemctl reload nginx 重启服务</li>
                <li>访问 https://www.ifixescn.com/ByteDanceVerify.html 验证</li>
              </ol>
            </div>
            
            <p className="text-xs mt-2 text-amber-700 dark:text-amber-300">
              ⚠️ 如果无法配置Nginx，可以使用静态文件方案（下载文件后手动上传到服务器根目录）。
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* 上传区域 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>上传验证文件</CardTitle>
          <CardDescription>
            选择从搜索引擎平台下载的验证文件（支持 .txt 和 .html 格式）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-input">选择文件</Label>
              <Input
                id="file-input"
                type="file"
                accept=".txt,.html"
                onChange={handleFileSelect}
                className="mt-2"
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                支持的格式：.txt、.html | 最大大小：50KB | 示例：google123.html、MP_verify_xxx.txt
              </p>
            </div>

            {selectedFile && (
              <div className="flex items-center gap-2 p-4 bg-muted rounded-md border">
                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    大小: {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  size="sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? '上传中...' : '上传'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 文件列表 */}
      <Card>
        <CardHeader>
          <CardTitle>已上传的验证文件</CardTitle>
          <CardDescription>
            当前系统中的所有验证文件（共 {files.length} 个）
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2">加载中...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">暂无验证文件</p>
              <p className="text-sm text-muted-foreground">
                请从微信公众平台下载验证文件并上传
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.filename}</p>
                        <p className="text-sm text-muted-foreground">
                          上传时间: {new Date(file.created_at).toLocaleString('zh-CN')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          上传者: {file.created_by}
                        </p>
                      </div>
                    </div>

                    {/* 访问地址 */}
                    <div className="mt-2 space-y-2">
                      <div className="text-xs text-muted-foreground">
                        微信验证地址（需要配置Nginx）:
                      </div>
                      <div className="p-2 bg-muted rounded text-xs font-mono break-all">
                        {window.location.origin}/{file.filename}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Edge Function地址（当前可用）:
                      </div>
                      <div className="p-2 bg-muted rounded text-xs font-mono break-all">
                        {import.meta.env.VITE_SUPABASE_URL}/functions/v1/verification-file/{file.filename}
                      </div>
                    </div>

                    {/* 内容预览 */}
                    <details className="mt-2">
                      <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                        查看文件内容
                      </summary>
                      <div className="mt-2 p-2 bg-muted rounded text-xs font-mono whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                        {file.content}
                      </div>
                    </details>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testFileAccess(file.filename)}
                      disabled={testingFile === file.filename}
                    >
                      {testingFile === file.filename ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2"></div>
                          测试中
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          测试访问
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/${file.filename}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      打开
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(file)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      下载
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(file.id, file.filename)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      删除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 底部提示 */}
      {files.length > 0 && (
        <Alert className="mt-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold mb-2">💡 提示：</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>验证文件上传后立即生效，无需重启服务</li>
              <li>建议先点击"测试访问"确认文件可访问，再进行微信验证</li>
              <li>如果测试访问失败，请检查Nginx配置或联系技术支持</li>
              <li>验证完成后，建议保留验证文件，以便后续重新验证</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
