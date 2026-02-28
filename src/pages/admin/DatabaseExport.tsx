import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/db/supabase";
import { 
  Database, 
  Download, 
  FileText, 
  Table, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info
} from "lucide-react";

interface TableInfo {
  table_name: string;
  row_count: number;
  total_size: string;
  selected: boolean;
}

interface ExportOptions {
  exportType: "structure" | "data" | "full";
  selectedTables: string[];
  includeConstraints: boolean;
  includeIndexes: boolean;
  includePolicies: boolean;
}

export default function DatabaseExport() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    exportType: "full",
    selectedTables: [],
    includeConstraints: true,
    includeIndexes: true,
    includePolicies: false
  });

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      setLoading(true);
      
      // 查询所有表及其统计信息
      const { data, error } = await supabase.rpc('get_table_statistics');
      
      if (error) {
        console.error("加载表信息失败:", error);
        // 如果RPC不存在，使用备用方法
        await loadTablesAlternative();
        return;
      }

      if (data) {
        setTables(data.map((t: any) => ({
          ...t,
          selected: false
        })));
      }
    } catch (error) {
      console.error("加载表信息失败:", error);
      await loadTablesAlternative();
    } finally {
      setLoading(false);
    }
  };

  const loadTablesAlternative = async () => {
    try {
      // 备用方法：直接查询表名
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_type', 'BASE TABLE');

      if (error) throw error;

      if (data) {
        setTables(data.map((t: any) => ({
          table_name: t.table_name,
          row_count: 0,
          total_size: "未知",
          selected: false
        })));
      }
    } catch (error) {
      console.error("备用方法加载失败:", error);
    }
  };

  const toggleTableSelection = (tableName: string) => {
    setTables(prev => prev.map(t => 
      t.table_name === tableName ? { ...t, selected: !t.selected } : t
    ));
  };

  const selectAllTables = () => {
    setTables(prev => prev.map(t => ({ ...t, selected: true })));
  };

  const deselectAllTables = () => {
    setTables(prev => prev.map(t => ({ ...t, selected: false })));
  };

  const exportDatabase = async () => {
    try {
      setExporting(true);
      
      const selectedTables = tables.filter(t => t.selected).map(t => t.table_name);
      
      if (selectedTables.length === 0) {
        alert("请至少选择一个表进行导出");
        return;
      }

      let sqlContent = generateSQLHeader();

      // 导出表结构
      if (exportOptions.exportType === "structure" || exportOptions.exportType === "full") {
        sqlContent += await exportTableStructures(selectedTables);
        
        if (exportOptions.includeConstraints) {
          sqlContent += await exportConstraints(selectedTables);
        }
        
        if (exportOptions.includeIndexes) {
          sqlContent += await exportIndexes(selectedTables);
        }
      }

      // 导出数据
      if (exportOptions.exportType === "data" || exportOptions.exportType === "full") {
        sqlContent += await exportTableData(selectedTables);
      }

      // 导出RLS策略
      if (exportOptions.includePolicies) {
        sqlContent += await exportPolicies(selectedTables);
      }

      // 下载文件
      downloadSQL(sqlContent);
      
      alert("数据库导出成功！");
    } catch (error) {
      console.error("导出失败:", error);
      alert("导出失败，请查看控制台了解详情");
    } finally {
      setExporting(false);
    }
  };

  const generateSQLHeader = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    return `-- ============================================
-- 数据库导出
-- 导出时间: ${timestamp}
-- 数据库: iFixes CMS
-- 导出类型: ${exportOptions.exportType === "structure" ? "仅结构" : exportOptions.exportType === "data" ? "仅数据" : "完整导出"}
-- 表数量: ${tables.filter(t => t.selected).length}
-- ============================================

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

`;
  };

  const exportTableStructures = async (tableNames: string[]) => {
    let sql = "\n-- ============================================\n";
    sql += "-- 表结构\n";
    sql += "-- ============================================\n\n";

    for (const tableName of tableNames) {
      try {
        const { data, error } = await supabase
          .rpc('get_table_structure', { table_name_param: tableName });

        if (error) {
          console.error(`获取表 ${tableName} 结构失败:`, error);
          sql += `-- 错误: 无法获取表 ${tableName} 的结构\n\n`;
          continue;
        }

        if (data && data.length > 0) {
          sql += `-- 表: ${tableName}\n`;
          sql += data[0].create_statement + "\n\n";
        }
      } catch (error) {
        console.error(`导出表 ${tableName} 结构失败:`, error);
      }
    }

    return sql;
  };

  const exportConstraints = async (tableNames: string[]) => {
    let sql = "\n-- ============================================\n";
    sql += "-- 约束和外键\n";
    sql += "-- ============================================\n\n";

    // 这里可以添加约束导出逻辑
    sql += "-- 约束导出功能开发中\n\n";

    return sql;
  };

  const exportIndexes = async (tableNames: string[]) => {
    let sql = "\n-- ============================================\n";
    sql += "-- 索引\n";
    sql += "-- ============================================\n\n";

    // 这里可以添加索引导出逻辑
    sql += "-- 索引导出功能开发中\n\n";

    return sql;
  };

  const exportTableData = async (tableNames: string[]) => {
    let sql = "\n-- ============================================\n";
    sql += "-- 表数据\n";
    sql += "-- ============================================\n\n";

    for (const tableName of tableNames) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1000); // 限制每个表最多1000条记录

        if (error) {
          console.error(`获取表 ${tableName} 数据失败:`, error);
          sql += `-- 错误: 无法获取表 ${tableName} 的数据\n\n`;
          continue;
        }

        if (data && data.length > 0) {
          sql += `-- 表: ${tableName} (${data.length} 条记录)\n`;
          
          for (const row of data) {
            const columns = Object.keys(row);
            const values = columns.map(col => {
              const value = row[col];
              if (value === null) return 'NULL';
              if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
              if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
              if (value instanceof Date) return `'${value.toISOString()}'`;
              if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
              return value;
            });

            sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
          }
          
          sql += "\n";
        }
      } catch (error) {
        console.error(`导出表 ${tableName} 数据失败:`, error);
      }
    }

    return sql;
  };

  const exportPolicies = async (tableNames: string[]) => {
    let sql = "\n-- ============================================\n";
    sql += "-- RLS策略\n";
    sql += "-- ============================================\n\n";

    // 这里可以添加RLS策略导出逻辑
    sql += "-- RLS策略导出功能开发中\n\n";

    return sql;
  };

  const downloadSQL = (content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `database_export_${new Date().toISOString().split('T')[0]}.sql`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportQuickGuide = () => {
    const guideContent = `# 数据库导出快速指南

## 使用Supabase SQL Editor导出

1. 登录Supabase Dashboard
2. 进入SQL Editor
3. 运行以下SQL查询导出表结构：

\`\`\`sql
SELECT 
  'CREATE TABLE ' || table_name || ' (' || 
  string_agg(
    column_name || ' ' || 
    CASE 
      WHEN data_type = 'character varying' THEN 'VARCHAR(' || character_maximum_length || ')'
      WHEN data_type = 'timestamp with time zone' THEN 'TIMESTAMPTZ'
      WHEN data_type = 'USER-DEFINED' THEN udt_name
      ELSE UPPER(data_type)
    END ||
    CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
    ', '
  ) || ');' as create_statement
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'your_table_name'
GROUP BY table_name;
\`\`\`

## 使用pg_dump导出完整数据库

\`\`\`bash
pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" > full_backup.sql
\`\`\`

## 使用Supabase CLI

\`\`\`bash
supabase db dump -f backup.sql
\`\`\`

更多详细信息请参考导出文档。
`;

    const blob = new Blob([guideContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'database_export_guide.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const selectedCount = tables.filter(t => t.selected).length;
  const totalSize = tables
    .filter(t => t.selected)
    .reduce((sum, t) => sum + (t.row_count || 0), 0);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Database className="h-8 w-8" />
          数据库导出
        </h1>
        <p className="text-muted-foreground">
          导出数据库表结构和数据，支持选择性导出和多种导出格式
        </p>
      </div>

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>提示：</strong>
          大表数据导出可能需要较长时间，建议使用pg_dump或Supabase CLI进行完整备份。
          本工具适合导出部分表或小型数据库。
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：表选择 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>选择要导出的表</CardTitle>
                  <CardDescription>
                    共 {tables.length} 个表，已选择 {selectedCount} 个
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllTables}
                  >
                    全选
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deselectAllTables}
                  >
                    取消全选
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">加载表信息中...</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {tables.map((table) => (
                    <div
                      key={table.table_name}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={table.selected}
                          onCheckedChange={() => toggleTableSelection(table.table_name)}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <Table className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{table.table_name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {table.row_count > 0 ? `${table.row_count} 条记录` : "无数据"} · {table.total_size}
                          </div>
                        </div>
                      </div>
                      {table.selected && (
                        <Badge variant="secondary">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          已选择
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右侧：导出选项 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>导出选项</CardTitle>
              <CardDescription>配置导出内容和格式</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 导出类型 */}
              <div className="space-y-3">
                <Label>导出类型</Label>
                <RadioGroup
                  value={exportOptions.exportType}
                  onValueChange={(value: any) =>
                    setExportOptions({ ...exportOptions, exportType: value })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="structure" id="structure" />
                    <Label htmlFor="structure" className="font-normal cursor-pointer">
                      仅结构
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="data" id="data" />
                    <Label htmlFor="data" className="font-normal cursor-pointer">
                      仅数据
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="full" id="full" />
                    <Label htmlFor="full" className="font-normal cursor-pointer">
                      完整导出（结构+数据）
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* 附加选项 */}
              <div className="space-y-3">
                <Label>附加选项</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="constraints"
                      checked={exportOptions.includeConstraints}
                      onCheckedChange={(checked) =>
                        setExportOptions({
                          ...exportOptions,
                          includeConstraints: checked as boolean
                        })
                      }
                    />
                    <Label htmlFor="constraints" className="font-normal cursor-pointer">
                      包含约束和外键
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="indexes"
                      checked={exportOptions.includeIndexes}
                      onCheckedChange={(checked) =>
                        setExportOptions({
                          ...exportOptions,
                          includeIndexes: checked as boolean
                        })
                      }
                    />
                    <Label htmlFor="indexes" className="font-normal cursor-pointer">
                      包含索引
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="policies"
                      checked={exportOptions.includePolicies}
                      onCheckedChange={(checked) =>
                        setExportOptions({
                          ...exportOptions,
                          includePolicies: checked as boolean
                        })
                      }
                    />
                    <Label htmlFor="policies" className="font-normal cursor-pointer">
                      包含RLS策略
                    </Label>
                  </div>
                </div>
              </div>

              {/* 导出统计 */}
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">已选择表</span>
                  <span className="font-medium">{selectedCount} 个</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">预计记录数</span>
                  <span className="font-medium">{totalSize} 条</span>
                </div>
              </div>

              {/* 导出按钮 */}
              <Button
                className="w-full"
                size="lg"
                onClick={exportDatabase}
                disabled={selectedCount === 0 || exporting}
              >
                {exporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    导出中...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    导出数据库
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 快速指南 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">快速指南</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={exportQuickGuide}
              >
                <FileText className="mr-2 h-4 w-4" />
                下载导出指南
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                包含使用Supabase SQL Editor、pg_dump和Supabase CLI的详细说明
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 底部提示 */}
      <Alert className="mt-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>注意事项：</strong>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li>每个表最多导出1000条记录，完整备份请使用pg_dump</li>
            <li>敏感数据（如用户密码）请妥善保管导出文件</li>
            <li>大表数据可能导致浏览器内存不足，建议分批导出</li>
            <li>导出文件为SQL格式，可直接在PostgreSQL中执行</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
