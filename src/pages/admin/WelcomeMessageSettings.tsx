import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { getWelcomeMessageTemplate, updateWelcomeMessageTemplate } from "@/db/api";
import type { WelcomeMessageTemplate } from "@/types";
import { Mail, Save, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function WelcomeMessageSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<WelcomeMessageTemplate>({
    enabled: true,
    title: "",
    content: "",
  });

  useEffect(() => {
    loadTemplate();
  }, []);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const data = await getWelcomeMessageTemplate();
      if (data) {
        setTemplate(data);
      }
    } catch (error) {
      console.error("加载欢迎消息模板失败:", error);
      toast({
        title: "错误",
        description: "加载欢迎消息模板失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const newTemplate: WelcomeMessageTemplate = {
      enabled: template.enabled,
      title: formData.get("title") as string,
      content: formData.get("content") as string,
    };

    try {
      setSaving(true);
      await updateWelcomeMessageTemplate(newTemplate);
      setTemplate(newTemplate);
      toast({
        title: "成功",
        description: "欢迎消息模板已保存",
      });
    } catch (error) {
      console.error("保存欢迎消息模板失败:", error);
      toast({
        title: "错误",
        description: "保存欢迎消息模板失败",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">欢迎消息设置</h1>
        <p className="text-muted-foreground mt-2">
          配置新会员注册时自动发送的欢迎消息
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>可用变量：</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><code>{"{username}"}</code> - 会员用户名</li>
          </ul>
          <p className="mt-2">
            这些变量会在发送消息时自动替换为实际值。
          </p>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            欢迎消息模板
          </CardTitle>
          <CardDescription>
            设置新会员注册时收到的欢迎消息内容
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enabled">启用欢迎消息</Label>
                <p className="text-sm text-muted-foreground">
                  新会员注册时自动发送欢迎消息
                </p>
              </div>
              <Switch
                id="enabled"
                checked={template.enabled}
                onCheckedChange={(checked) =>
                  setTemplate({ ...template, enabled: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">消息标题</Label>
              <Input
                id="title"
                name="title"
                placeholder="例如：欢迎加入iFixes官方平台！"
                defaultValue={template.title}
                required
                disabled={!template.enabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">消息内容</Label>
              <Textarea
                id="content"
                name="content"
                placeholder="输入欢迎消息内容，可以使用 {username} 变量"
                defaultValue={template.content}
                required
                disabled={!template.enabled}
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                支持换行，使用 {"{username}"} 插入会员用户名
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={loadTemplate}
                disabled={saving}
              >
                重置
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    保存设置
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>预览效果</CardTitle>
          <CardDescription>
            查看会员收到的消息效果（示例用户名：张三）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-muted/50">
            <h3 className="font-semibold text-lg mb-2">
              {template.title || "（未设置标题）"}
            </h3>
            <div className="whitespace-pre-wrap text-sm">
              {template.content.replace("{username}", "张三") || "（未设置内容）"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
