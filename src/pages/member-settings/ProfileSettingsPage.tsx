import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getProfile, updateProfileSettings } from "@/db/api";
import { ProfileSettingsFormData, ProfileVisibility } from "@/types";
import { Loader2, Eye, Users, Lock, ExternalLink } from "lucide-react";

export default function ProfileSettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ProfileSettingsFormData>({
    profile_visibility: "public",
    show_email: false,
    show_articles: true,
    show_questions: true,
    show_sns: true,
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadSettings();
  }, [user, navigate]);

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const profile = await getProfile(user.id);
      if (profile) {
        setSettings({
          profile_visibility: profile.profile_visibility,
          show_email: profile.show_email,
          show_articles: profile.show_articles,
          show_questions: profile.show_questions,
          show_sns: profile.show_sns,
        });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      await updateProfileSettings(user.id, settings);
      toast({
        title: "Success",
        description: "Profile settings saved successfully",
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getVisibilityIcon = (visibility: ProfileVisibility) => {
    switch (visibility) {
      case "public":
        return <Eye className="h-4 w-4" />;
      case "friends":
        return <Users className="h-4 w-4" />;
      case "private":
        return <Lock className="h-4 w-4" />;
    }
  };

  const getVisibilityLabel = (visibility: ProfileVisibility) => {
    switch (visibility) {
      case "public":
        return "Public";
      case "friends":
        return "Friends Only";
      case "private":
        return "Private";
    }
  };

  const getVisibilityDescription = (visibility: ProfileVisibility) => {
    switch (visibility) {
      case "public":
        return "Everyone can view your profile";
      case "friends":
        return "Only your friends can view your profile";
      case "private":
        return "Only you can view your profile";
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
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile visibility and display preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Access Control Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Access Control</CardTitle>
            <CardDescription>
              Control who can view your profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Profile Visibility</Label>
              <Select
                value={settings.profile_visibility}
                onValueChange={(value: ProfileVisibility) =>
                  setSettings({ ...settings, profile_visibility: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      {getVisibilityIcon("public")}
                      <span>{getVisibilityLabel("public")}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="friends">
                    <div className="flex items-center gap-2">
                      {getVisibilityIcon("friends")}
                      <span>{getVisibilityLabel("friends")}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      {getVisibilityIcon("private")}
                      <span>{getVisibilityLabel("private")}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {getVisibilityDescription(settings.profile_visibility)}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Email Address</Label>
                <p className="text-sm text-muted-foreground">
                  Display email address on your profile
                </p>
              </div>
              <Switch
                checked={settings.show_email}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, show_email: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Content Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Content Display</CardTitle>
            <CardDescription>
              Choose what content to display on your profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Articles</Label>
                <p className="text-sm text-muted-foreground">
                  Display published articles on your profile
                </p>
              </div>
              <Switch
                checked={settings.show_articles}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, show_articles: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Q&A</Label>
                <p className="text-sm text-muted-foreground">
                  Display your questions and answers on your profile
                </p>
              </div>
              <Switch
                checked={settings.show_questions}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, show_questions: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show SNS Posts</Label>
                <p className="text-sm text-muted-foreground">
                  Display SNS posts on your profile
                </p>
              </div>
              <Switch
                checked={settings.show_sns}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, show_sns: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate(`/profile/${user?.id}`)}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Preview Profile
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/member-center")}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
