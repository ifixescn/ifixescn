import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { getSiteSetting, updateSiteSetting } from "@/db/api";
import { Type, Check } from "lucide-react";

// 字体配置列表
const FONT_OPTIONS = [
  {
    value: "Inter",
    name: "Inter",
    description: "现代、清晰、专业 - 最适合UI界面",
    preview: "The quick brown fox jumps over the lazy dog",
    style: "font-sans",
    googleFont: "Inter:wght@300;400;500;600;700;800",
  },
  {
    value: "Poppins",
    name: "Poppins",
    description: "几何、友好、现代感强",
    preview: "The quick brown fox jumps over the lazy dog",
    style: "font-sans",
    googleFont: "Poppins:wght@300;400;500;600;700;800",
  },
  {
    value: "Roboto",
    name: "Roboto",
    description: "经典、专业、可读性强",
    preview: "The quick brown fox jumps over the lazy dog",
    style: "font-sans",
    googleFont: "Roboto:wght@300;400;500;700;900",
  },
  {
    value: "Montserrat",
    name: "Montserrat",
    description: "都市、时尚、大气",
    preview: "The quick brown fox jumps over the lazy dog",
    style: "font-sans",
    googleFont: "Montserrat:wght@300;400;500;600;700;800",
  },
  {
    value: "Open Sans",
    name: "Open Sans",
    description: "人文主义、友好、通用性强",
    preview: "The quick brown fox jumps over the lazy dog",
    style: "font-sans",
    googleFont: "Open+Sans:wght@300;400;500;600;700;800",
  },
  {
    value: "Lato",
    name: "Lato",
    description: "温暖、稳定、企业级",
    preview: "The quick brown fox jumps over the lazy dog",
    style: "font-sans",
    googleFont: "Lato:wght@300;400;700;900",
  },
  {
    value: "Raleway",
    name: "Raleway",
    description: "优雅、精致、高端",
    preview: "The quick brown fox jumps over the lazy dog",
    style: "font-sans",
    googleFont: "Raleway:wght@300;400;500;600;700;800",
  },
  {
    value: "Nunito",
    name: "Nunito",
    description: "圆润、友好、现代",
    preview: "The quick brown fox jumps over the lazy dog",
    style: "font-sans",
    googleFont: "Nunito:wght@300;400;500;600;700;800",
  },
];

export default function FontSettings() {
  const [selectedFont, setSelectedFont] = useState("Inter");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFontSetting();
  }, []);

  const loadFontSetting = async () => {
    try {
      const setting = await getSiteSetting("site_font");
      if (setting?.value) {
        setSelectedFont(setting.value);
        applyFont(setting.value);
      }
    } catch (error) {
      console.error("加载字体设置失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFont = (fontName: string) => {
    const fontOption = FONT_OPTIONS.find(f => f.value === fontName);
    if (!fontOption) return;

    // 移除旧的字体链接
    const oldLinks = document.querySelectorAll('link[data-font-link]');
    oldLinks.forEach(link => link.remove());

    // 添加新的字体链接
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontOption.googleFont}&display=swap`;
    link.rel = 'stylesheet';
    link.setAttribute('data-font-link', 'true');
    document.head.appendChild(link);

    // 应用字体到根元素
    document.documentElement.style.setProperty('--font-family', `'${fontName}', sans-serif`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSiteSetting("site_font", selectedFont);
      applyFont(selectedFont);
      
      toast({
        title: "保存成功",
        description: "字体设置已更新，刷新页面后生效",
      });

      // 触发自定义事件通知其他组件
      window.dispatchEvent(new CustomEvent('fontSettingsUpdated'));
    } catch (error) {
      console.error("保存字体设置失败:", error);
      toast({
        title: "保存失败",
        description: "无法保存字体设置",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">字体设置</h1>
        <p className="text-muted-foreground">
          选择网站的全局字体，所有字体均来自Google Fonts
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            选择字体
          </CardTitle>
          <CardDescription>
            选择一个适合您网站风格的字体，更改后需要刷新页面才能看到效果
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={selectedFont} onValueChange={setSelectedFont}>
            <div className="grid grid-cols-1 gap-4">
              {FONT_OPTIONS.map((font) => (
                <div
                  key={font.value}
                  className={`relative flex items-start space-x-3 rounded-lg border-2 p-4 transition-all cursor-pointer hover:border-primary/50 ${
                    selectedFont === font.value
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                  onClick={() => setSelectedFont(font.value)}
                >
                  <RadioGroupItem value={font.value} id={font.value} className="mt-1" />
                  <div className="flex-1 space-y-2">
                    <Label
                      htmlFor={font.value}
                      className="text-base font-semibold cursor-pointer flex items-center gap-2"
                    >
                      {font.name}
                      {selectedFont === font.value && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {font.description}
                    </p>
                    <div
                      className="text-lg p-3 bg-muted rounded-md"
                      style={{ fontFamily: `'${font.value}', sans-serif` }}
                    >
                      {font.preview}
                    </div>
                    <div
                      className="text-sm text-muted-foreground"
                      style={{ fontFamily: `'${font.value}', sans-serif` }}
                    >
                      ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
                      abcdefghijklmnopqrstuvwxyz<br />
                      0123456789
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              当前选择: <span className="font-semibold">{selectedFont}</span>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "保存中..." : "保存设置"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>字体预览</CardTitle>
          <CardDescription>
            查看所选字体在不同场景下的效果
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div style={{ fontFamily: `'${selectedFont}', sans-serif` }}>
            <h2 className="text-3xl font-bold mb-4">
              Heading 1 - Professional Content Management System
            </h2>
            <h3 className="text-2xl font-semibold mb-4">
              Heading 2 - Modern and Elegant Design
            </h3>
            <h4 className="text-xl font-medium mb-4">
              Heading 3 - User-Friendly Interface
            </h4>
            <p className="text-base mb-4 leading-relaxed">
              Body Text - This is a sample paragraph to demonstrate how the selected font looks in regular body text. 
              The font should be clear, readable, and comfortable for extended reading. 
              A good font choice enhances the overall user experience and makes your content more accessible.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Small Text - Additional information or captions can be displayed in smaller text. 
              The font should remain legible even at smaller sizes.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button>Primary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="secondary">Secondary Button</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
