import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Download as DownloadIcon, FileText } from "lucide-react";
import {
  getAllDownloadsForAdmin,
  createDownload,
  updateDownload,
  deleteDownload,
  uploadDownloadFile,
  deleteDownloadFile,
  getCategories,
} from "@/db/api";
import type { Download, Category } from "@/types";

export default function DownloadsManage() {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDownload, setEditingDownload] = useState<Download | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    category_id: "",
    file_url: "",
    file_name: "",
    file_size: 0,
    file_type: "",
    cover_image: "",
    require_member: true,
    is_published: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [downloadsData, categoriesData] = await Promise.all([
        getAllDownloadsForAdmin(),
        getCategories("download"),
      ]);
      setDownloads(downloadsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: "Loading failed",
        description: "Failed to load download list",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size cannot exceed 50MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      const url = await uploadDownloadFile(file);
      setFormData({
        ...formData,
        file_url: url,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
      });
      toast({
        title: "Uploaded successfully",
        description: "File uploaded",
      });
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: "Upload failed",
        description: "FileUpload failed，Please try again",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.file_url) {
      toast({
        title: "验证Failed",
        description: "请填写Title并Upload Files",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingDownload) {
        await updateDownload(editingDownload.id, formData);
        toast({
          title: "Updated successfully",
          description: "Download已Update",
        });
      } else {
        await createDownload(formData);
        toast({
          title: "Created successfully",
          description: "Download已Create",
        });
      }
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error("Save failed:", error);
      toast({
        title: "Save failed",
        description: "Operation failed，Please try again",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (download: Download) => {
    setEditingDownload(download);
    setFormData({
      title: download.title,
      description: download.description || "",
      content: download.content || "",
      category_id: download.category_id || "",
      file_url: download.file_url,
      file_name: download.file_name || "",
      file_size: download.file_size || 0,
      file_type: download.file_type || "",
      cover_image: download.cover_image || "",
      require_member: download.require_member,
      is_published: download.is_published,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (download: Download) => {
    if (!confirm("OK要Delete这个Download吗？")) return;

    try {
      // DeleteFile
      if (download.file_url) {
        await deleteDownloadFile(download.file_url);
      }
      // Delete记录
      await deleteDownload(download.id);
      toast({
        title: "Deleted successfully",
        description: "Download已Delete",
      });
      loadData();
    } catch (error) {
      console.error("Delete failed:", error);
      toast({
        title: "Delete failed",
        description: "Operation failed，Please try again",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingDownload(null);
    setFormData({
      title: "",
      description: "",
      content: "",
      category_id: "",
      file_url: "",
      file_name: "",
      file_size: 0,
      file_type: "",
      cover_image: "",
      require_member: true,
      is_published: false,
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Download Management</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                AddDownload
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingDownload ? "EditDownload" : "AddDownload"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="输入DownloadTitle"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">简介</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="输入简介"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="file">File *</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    accept=".pdf,.zip,.rar,.7z,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  />
                  {formData.file_url && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      已上传: {formData.file_name} ({formatFileSize(formData.file_size)})
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="require_member"
                    checked={formData.require_member}
                    onCheckedChange={(checked) => setFormData({ ...formData, require_member: checked })}
                  />
                  <Label htmlFor="require_member">仅Member可Download</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                  <Label htmlFor="is_published">发布</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={uploading}>
                    {editingDownload ? "Update" : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {downloads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              NoDownload，点击上方按钮Add
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Download Count</TableHead>
                  <TableHead>Member限制</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {downloads.map((download) => (
                  <TableRow key={download.id}>
                    <TableCell className="font-medium">{download.title}</TableCell>
                    <TableCell>
                      {categories.find((c) => c.id === download.category_id)?.name || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <div className="text-sm">
                          <div>{download.file_name}</div>
                          <div className="text-muted-foreground">
                            {formatFileSize(download.file_size || 0)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{download.download_count}</TableCell>
                    <TableCell>
                      <Badge variant={download.require_member ? "default" : "secondary"}>
                        {download.require_member ? "仅Member" : "公开"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={download.is_published ? "default" : "secondary"}>
                        {download.is_published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(download)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(download)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
