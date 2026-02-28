import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, FolderOpen, Settings } from "lucide-react";
import VideosManage from "./VideosManage";
import VideoSettings from "./VideoSettings";
import ModuleCategoriesManage from "@/components/admin/ModuleCategoriesManage";

export default function VideosModule() {
  const [activeTab, setActiveTab] = useState("content");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Video className="h-8 w-8 text-primary" />
          Video Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage video content, categories and module settings
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Content Management
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Category Management
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Module Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          <VideosManage />
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Video CategoryManagement</CardTitle>
              <CardDescription>
                Manage video categories, set display order and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ModuleCategoriesManage moduleType="video" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <VideoSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
