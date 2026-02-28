import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getSystemSettings, updateSystemSettings } from "@/db/api";
import { Settings, Mail, MessageSquare, Loader2 } from "lucide-react";

interface EmailTemplate {
  enabled: boolean;
  subject: string;
  content: string;
}

interface WelcomeTemplate {
  enabled: boolean;
  title: string;
  content: string;
}

export default function SystemSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 邮箱验证模板
  const [emailVerificationTemplate, setEmailVerificationTemplate] = useState<EmailTemplate>({
    enabled: true,
    subject: "Email Verification Code - iFixes",
    content: "Hello,\n\nYour email verification code is: {code}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this code, please ignore this email.\n\nBest regards,\niFixes Team"
  });

  // 欢迎消息模板
  const [welcomeMessageTemplate, setWelcomeMessageTemplate] = useState<WelcomeTemplate>({
    enabled: true,
    title: "Welcome to iFixes Official Platform!",
    content: "Dear {username},\n\nWelcome to iFixes Official Platform!\n\nWe are glad to have you join us. Here you can:\n- Communicate with technical experts online\n- Get the latest technical information\n- Enjoy exclusive member services\n\nTip: After verifying your email, you will automatically be upgraded to Silver membership and enjoy more privileges!\n\nIf you have any questions, please feel free to contact our customer service team.\n\nEnjoy using our platform!\n\niFixes Team"
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // 加载邮箱验证模板
      const emailTemplate = await getSystemSettings("email_verification_template");
      if (emailTemplate) {
        setEmailVerificationTemplate(emailTemplate as EmailTemplate);
      }

      // 加载欢迎消息模板
      const welcomeTemplate = await getSystemSettings("welcome_message_template");
      if (welcomeTemplate) {
        setWelcomeMessageTemplate(welcomeTemplate as WelcomeTemplate);
      }
    } catch (error: any) {
      console.error("Failed to load settings:", error);
      toast({
        title: "Error",
        description: "Failed to load system settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmailTemplate = async () => {
    setSaving(true);
    try {
      await updateSystemSettings("email_verification_template", emailVerificationTemplate);
      toast({
        title: "Success",
        description: "Email verification template saved successfully",
      });
    } catch (error: any) {
      console.error("Failed to save email template:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save email template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWelcomeTemplate = async () => {
    setSaving(true);
    try {
      await updateSystemSettings("welcome_message_template", welcomeMessageTemplate);
      toast({
        title: "Success",
        description: "Welcome message template saved successfully",
      });
    } catch (error: any) {
      console.error("Failed to save welcome template:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save welcome template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          System Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure system-wide settings and templates
        </p>
      </div>

      <Tabs defaultValue="email" className="space-y-4">
        <TabsList>
          <TabsTrigger value="email">
            <Mail className="mr-2 h-4 w-4" />
            Email Verification
          </TabsTrigger>
          <TabsTrigger value="welcome">
            <MessageSquare className="mr-2 h-4 w-4" />
            Welcome Message
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Verification Template</CardTitle>
              <CardDescription>
                Configure the email template sent to users for email verification.
                Use {"{code}"} as a placeholder for the verification code.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Email Verification</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to verify their email addresses
                  </p>
                </div>
                <Switch
                  checked={emailVerificationTemplate.enabled}
                  onCheckedChange={(checked) =>
                    setEmailVerificationTemplate({ ...emailVerificationTemplate, enabled: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-subject">Email Subject</Label>
                <Input
                  id="email-subject"
                  value={emailVerificationTemplate.subject}
                  onChange={(e) =>
                    setEmailVerificationTemplate({ ...emailVerificationTemplate, subject: e.target.value })
                  }
                  placeholder="Email Verification Code - iFixes"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-content">Email Content</Label>
                <Textarea
                  id="email-content"
                  value={emailVerificationTemplate.content}
                  onChange={(e) =>
                    setEmailVerificationTemplate({ ...emailVerificationTemplate, content: e.target.value })
                  }
                  placeholder="Enter email content..."
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Available placeholders: {"{code}"} - verification code
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={loadSettings}>
                  Reset
                </Button>
                <Button onClick={handleSaveEmailTemplate} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="welcome">
          <Card>
            <CardHeader>
              <CardTitle>Welcome Message Template</CardTitle>
              <CardDescription>
                Configure the welcome message sent to new members.
                Use {"{username}"} as a placeholder for the user's name.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Welcome Message</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically send welcome messages to new members
                  </p>
                </div>
                <Switch
                  checked={welcomeMessageTemplate.enabled}
                  onCheckedChange={(checked) =>
                    setWelcomeMessageTemplate({ ...welcomeMessageTemplate, enabled: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcome-title">Message Title</Label>
                <Input
                  id="welcome-title"
                  value={welcomeMessageTemplate.title}
                  onChange={(e) =>
                    setWelcomeMessageTemplate({ ...welcomeMessageTemplate, title: e.target.value })
                  }
                  placeholder="Welcome to iFixes Official Platform!"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcome-content">Message Content</Label>
                <Textarea
                  id="welcome-content"
                  value={welcomeMessageTemplate.content}
                  onChange={(e) =>
                    setWelcomeMessageTemplate({ ...welcomeMessageTemplate, content: e.target.value })
                  }
                  placeholder="Enter welcome message content..."
                  rows={12}
                />
                <p className="text-xs text-muted-foreground">
                  Available placeholders: {"{username}"} - user's username or nickname
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={loadSettings}>
                  Reset
                </Button>
                <Button onClick={handleSaveWelcomeTemplate} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
