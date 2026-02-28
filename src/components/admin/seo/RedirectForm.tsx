import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createRedirect, updateRedirect } from "@/db/api";
import type { Redirect, RedirectFormData, RedirectType } from "@/types";

interface RedirectFormProps {
  redirect: Redirect | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function RedirectForm({ redirect, onSuccess, onCancel }: RedirectFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<RedirectFormData>({
    defaultValues: {
      from_path: redirect?.from_path || '',
      to_path: redirect?.to_path || '',
      redirect_type: redirect?.redirect_type || 301,
      is_active: redirect?.is_active ?? true,
    },
  });

  const isActive = watch("is_active");

  useEffect(() => {
    if (redirect) {
      reset({
        from_path: redirect.from_path,
        to_path: redirect.to_path,
        redirect_type: redirect.redirect_type,
        is_active: redirect.is_active,
      });
    }
  }, [redirect, reset]);

  const onSubmit = async (data: RedirectFormData) => {
    try {
      setLoading(true);
      
      if (redirect) {
        // 更新现有重定向规则
        const success = await updateRedirect(redirect.id, data);
        if (!success) {
          throw new Error("更新失败");
        }
      } else {
        // 创建新重定向规则
        const result = await createRedirect(data);
        if (!result) {
          throw new Error("创建失败");
        }
      }
      
      toast({
        title: "保存成功",
        description: `重定向规则已${redirect ? '更新' : '创建'}`,
      });
      onSuccess();
    } catch (error) {
      console.error("保存重定向规则失败:", error);
      toast({
        title: "保存失败",
        description: "无法保存重定向规则，请重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="from_path">源路径 *</Label>
        <Input
          id="from_path"
          {...register("from_path", { required: "请输入源路径" })}
          placeholder="/old-page"
          disabled={!!redirect}
        />
        {errors.from_path && (
          <p className="text-sm text-destructive">{errors.from_path.message}</p>
        )}
        <p className="text-sm text-muted-foreground">
          需要重定向的旧 URL 路径
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="to_path">目标路径 *</Label>
        <Input
          id="to_path"
          {...register("to_path", { required: "请输入目标路径" })}
          placeholder="/new-page"
        />
        {errors.to_path && (
          <p className="text-sm text-destructive">{errors.to_path.message}</p>
        )}
        <p className="text-sm text-muted-foreground">
          重定向到的新 URL 路径
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="redirect_type">重定向类型 *</Label>
        <Select
          value={String(watch("redirect_type"))}
          onValueChange={(value) => setValue("redirect_type", Number(value) as RedirectType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="301">301 - 永久重定向</SelectItem>
            <SelectItem value="302">302 - 临时重定向</SelectItem>
            <SelectItem value="307">307 - 临时重定向（保持方法）</SelectItem>
            <SelectItem value="308">308 - 永久重定向（保持方法）</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          选择合适的重定向类型
        </p>
      </div>

      <div className="flex items-center justify-between space-x-2">
        <div className="space-y-0.5">
          <Label htmlFor="is_active">启用规则</Label>
          <p className="text-sm text-muted-foreground">
            是否立即启用此重定向规则
          </p>
        </div>
        <Switch
          id="is_active"
          checked={isActive}
          onCheckedChange={(checked) => setValue("is_active", checked)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "保存中..." : "保存"}
        </Button>
      </div>
    </form>
  );
}
