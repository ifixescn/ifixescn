import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getSiteSetting, updateSiteSetting } from "@/db/api";
import { Save, Plus, Trash2 } from "lucide-react";

interface FooterLink {
  name: string;
  url: string;
}

export default function FooterSettings() {
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [copyrightText, setCopyrightText] = useState("");
  const [aboutUs, setAboutUs] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [businessHours, setBusinessHours] = useState("");
  const [icpNumber, setIcpNumber] = useState("");
  const [policeNumber, setPoliceNumber] = useState("");
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [
        companyNameSetting,
        copyrightSetting,
        aboutUsSetting,
        addressSetting,
        phoneSetting,
        emailSetting,
        hoursSetting,
        icpSetting,
        policeSetting,
        linksSetting,
      ] = await Promise.all([
        getSiteSetting("company_name"),
        getSiteSetting("copyright_text"),
        getSiteSetting("about_us"),
        getSiteSetting("contact_address"),
        getSiteSetting("contact_phone"),
        getSiteSetting("contact_email"),
        getSiteSetting("business_hours"),
        getSiteSetting("icp_number"),
        getSiteSetting("police_number"),
        getSiteSetting("footer_links"),
      ]);

      setCompanyName(companyNameSetting?.value || "");
      setCopyrightText(copyrightSetting?.value || "");
      setAboutUs(aboutUsSetting?.value || "");
      setContactAddress(addressSetting?.value || "");
      setContactPhone(phoneSetting?.value || "");
      setContactEmail(emailSetting?.value || "");
      setBusinessHours(hoursSetting?.value || "");
      setIcpNumber(icpSetting?.value || "");
      setPoliceNumber(policeSetting?.value || "");

      if (linksSetting?.value) {
        try {
          const links = JSON.parse(linksSetting.value);
          setFooterLinks(Array.isArray(links) ? links : []);
        } catch (e) {
          console.error("Failed to parse footer URL:", e);
          setFooterLinks([]);
        }
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast({
        title: "Loading failed",
        description: "Failed to load footer settings",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      await Promise.all([
        updateSiteSetting("company_name", companyName),
        updateSiteSetting("copyright_text", copyrightText),
        updateSiteSetting("about_us", aboutUs),
        updateSiteSetting("contact_address", contactAddress),
        updateSiteSetting("contact_phone", contactPhone),
        updateSiteSetting("contact_email", contactEmail),
        updateSiteSetting("business_hours", businessHours),
        updateSiteSetting("icp_number", icpNumber),
        updateSiteSetting("police_number", policeNumber),
        updateSiteSetting("footer_links", JSON.stringify(footerLinks)),
      ]);

      // Trigger settings update event
      window.dispatchEvent(new Event("settingsUpdated"));

      toast({
        title: "Saved successfully",
        description: "Footer settings updated",
      });
    } catch (error) {
      console.error("Save failed:", error);
      toast({
        title: "Save failed",
        description: "无法SavePage脚Settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addFooterLink = () => {
    setFooterLinks([...footerLinks, { name: "", url: "" }]);
  };

  const removeFooterLink = (index: number) => {
    setFooterLinks(footerLinks.filter((_, i) => i !== index));
  };

  const updateFooterLink = (index: number, field: "name" | "url", value: string) => {
    const newLinks = [...footerLinks];
    newLinks[index][field] = value;
    setFooterLinks(newLinks);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Page脚Settings</h1>
        <p className="text-muted-foreground mt-2">
          配置网站Page脚的Copyright、Contact Info等Content
        </p>
      </div>

      <div className="grid gap-6">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>Settings公司Name和Copyright</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">公司/组织Name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="例如：iFixes"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="copyrightText">版权文本</Label>
              <Input
                id="copyrightText"
                value={copyrightText}
                onChange={(e) => setCopyrightText(e.target.value)}
                placeholder="例如：iFixes"
              />
              <p className="text-xs text-muted-foreground">
                将自动添加年份，显示为：© 2025 {copyrightText || "您的版权文本"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="aboutUs">关于我们</Label>
              <Textarea
                id="aboutUs"
                value={aboutUs}
                onChange={(e) => setAboutUs(e.target.value)}
                placeholder="简要介绍您的公司或组织"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Info</CardTitle>
            <CardDescription>Settings联系Address、电话和Email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactAddress">联系Address</Label>
              <Input
                id="contactAddress"
                value={contactAddress}
                onChange={(e) => setContactAddress(e.target.value)}
                placeholder="例如：北京市朝阳区xxx街道xxx号"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="例如：010-12345678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="例如：contact@example.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Business Hours</CardTitle>
            <CardDescription>Settings营业或服务时间</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessHours">Business Hours</Label>
              <Input
                id="businessHours"
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
                placeholder="例如：周一至周五 9:00-18:00"
              />
            </div>
          </CardContent>
        </Card>

        {/* 备案信息 */}
        <Card>
          <CardHeader>
            <CardTitle>备案信息</CardTitle>
            <CardDescription>SettingsICP Number和公安备案号</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="icpNumber">ICP Number</Label>
              <Input
                id="icpNumber"
                value={icpNumber}
                onChange={(e) => setIcpNumber(e.target.value)}
                placeholder="例如：京ICP备12345678号"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="policeNumber">公安备案号</Label>
              <Input
                id="policeNumber"
                value={policeNumber}
                onChange={(e) => setPoliceNumber(e.target.value)}
                placeholder="例如：京公网安备 11010502012345号"
              />
            </div>
          </CardContent>
        </Card>

        {/* 页脚链接 */}
        <Card>
          <CardHeader>
            <CardTitle>Page脚URL</CardTitle>
            <CardDescription>AddPage脚的快捷URL</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {footerLinks.map((link, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Input
                    value={link.name}
                    onChange={(e) => updateFooterLink(index, "name", e.target.value)}
                    placeholder="URLName"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    value={link.url}
                    onChange={(e) => updateFooterLink(index, "url", e.target.value)}
                    placeholder="URLAddress（/path 或 https://...）"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeFooterLink(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" onClick={addFooterLink} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              AddURL
            </Button>
          </CardContent>
        </Card>

        {/* 保存按钮 */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading} size="lg">
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Save中..." : "SaveSettings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
