import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { getPointsRules, updatePointsRule } from "@/db/api";
import type { PointsRule } from "@/types";
import { Settings, TrendingUp, Save } from "lucide-react";

export default function MemberSettings() {
  const [pointsRules, setPointsRules] = useState<PointsRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const rules = await getPointsRules();
      setPointsRules(rules);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: "Load Failed",
        description: "Unable to load points rules settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePointsRule = async (rule: PointsRule) => {
    try {
      setSaving(true);
      await updatePointsRule(rule.action, rule.points, rule.description, rule.enabled);
      toast({
        title: "Saved Successfully",
        description: "Points rule has been updated",
      });
      await loadData();
    } catch (error) {
      console.error("Failed to update points rule:", error);
      toast({
        title: "Save Failed",
        description: "Unable to update points rule",
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
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Member System Settings</h1>
          <p className="text-muted-foreground">Configure points rules and member interaction features</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Points Rules Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Points Earning Rules</CardTitle>
            </div>
            <CardDescription>
              Configure the number of points users earn through different actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {pointsRules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <Label className="text-base font-semibold">{rule.description}</Label>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) => {
                        const updatedRule = { ...rule, enabled: checked };
                        handleUpdatePointsRule(updatedRule);
                      }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">Action: {rule.action}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={rule.points}
                      onChange={(e) => {
                        const newPoints = parseInt(e.target.value) || 0;
                        setPointsRules(prev =>
                          prev.map(r => r.id === rule.id ? { ...r, points: newPoints } : r)
                        );
                      }}
                      className="w-20 text-center"
                      min="0"
                    />
                    <span className="text-sm text-muted-foreground">Points</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleUpdatePointsRule(rule)}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Browsing Points Information */}
        <Card>
          <CardHeader>
            <CardTitle>Browsing Points Information</CardTitle>
            <CardDescription>
              Rules for automatically earning points when browsing content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-2" />
              <p className="text-sm">Each content can only earn browsing points once per day to prevent abuse</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-2" />
              <p className="text-sm">Browsing history is automatically saved and viewable in Member Center</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-2" />
              <p className="text-sm">Maximum of 100 browsing records per user</p>
            </div>
          </CardContent>
        </Card>

        {/* Member Interaction Features */}
        <Card>
          <CardHeader>
            <CardTitle>Member Interaction Features</CardTitle>
            <CardDescription>
              Enabled member system interaction features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
              <div>
                <p className="text-sm font-semibold">Browsing History Tracking</p>
                <p className="text-xs text-muted-foreground">Automatically records articles, products, videos, downloads, and Q&A viewed by users</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
              <div>
                <p className="text-sm font-semibold">Automatic Points Earning</p>
                <p className="text-xs text-muted-foreground">Users automatically earn points when browsing, publishing content, and answering questions</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
              <div>
                <p className="text-sm font-semibold">Member Level System</p>
                <p className="text-xs text-muted-foreground">Automatically upgrade member levels based on points to enjoy different benefits</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
              <div>
                <p className="text-sm font-semibold">Points History Query</p>
                <p className="text-xs text-muted-foreground">Users can view detailed points earning records in Member Center</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
