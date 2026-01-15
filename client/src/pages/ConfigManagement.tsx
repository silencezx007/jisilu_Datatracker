import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Settings, Plus, Save } from "lucide-react";
import { toast } from "sonner";

export default function ConfigManagement() {
  const { data: configs, isLoading, refetch } = trpc.config.getAll.useQuery();
  const [isCreating, setIsCreating] = useState(false);
  const [newConfig, setNewConfig] = useState({
    name: "",
    discountThreshold: 2.0,
    cronExpression: "45 14 * * *",
    enabled: true,
  });

  const createConfig = trpc.config.create.useMutation({
    onSuccess: () => {
      toast.success("配置创建成功");
      setIsCreating(false);
      setNewConfig({
        name: "",
        discountThreshold: 2.0,
        cronExpression: "45 14 * * *",
        enabled: true,
      });
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "创建配置失败");
    },
  });

  const updateConfig = trpc.config.update.useMutation({
    onSuccess: () => {
      toast.success("配置更新成功");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "更新配置失败");
    },
  });

  const handleCreate = () => {
    if (!newConfig.name) {
      toast.error("请输入配置名称");
      return;
    }
    createConfig.mutate(newConfig);
  };

  const handleToggle = (id: number, enabled: boolean) => {
    updateConfig.mutate({ id, enabled });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Settings className="w-6 h-6 text-primary" />
                监控配置
              </h1>
              <p className="text-sm text-muted-foreground mt-1">管理监控规则和定时任务</p>
            </div>
            <Button onClick={() => setIsCreating(!isCreating)}>
              <Plus className="w-4 h-4 mr-2" />
              新建配置
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* 创建新配置表单 */}
        {isCreating && (
          <Card>
            <CardHeader>
              <CardTitle>新建监控配置</CardTitle>
              <CardDescription>设置溢价率阈值和定时任务时间</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">配置名称</Label>
                <Input
                  id="name"
                  value={newConfig.name}
                  onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
                  placeholder="例如：默认监控配置"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="threshold">溢价率阈值 (%)</Label>
                <Input
                  id="threshold"
                  type="number"
                  step="0.1"
                  value={newConfig.discountThreshold}
                  onChange={(e) =>
                    setNewConfig({ ...newConfig, discountThreshold: parseFloat(e.target.value) })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  只监控溢价率大于此值的基金
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cron">定时任务 (Cron 表达式)</Label>
                <Input
                  id="cron"
                  value={newConfig.cronExpression}
                  onChange={(e) => setNewConfig({ ...newConfig, cronExpression: e.target.value })}
                  placeholder="45 14 * * *"
                />
                <p className="text-xs text-muted-foreground">
                  默认: 45 14 * * * (每日 14:45)，多个时间用逗号分隔
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={newConfig.enabled}
                  onCheckedChange={(checked) => setNewConfig({ ...newConfig, enabled: checked })}
                />
                <Label htmlFor="enabled">启用此配置</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={createConfig.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  {createConfig.isPending ? "创建中..." : "创建配置"}
                </Button>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  取消
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 现有配置列表 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">现有配置</h2>
          {!configs || configs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">暂无配置，请创建新配置</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {configs.map((config) => (
                <Card key={config.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{config.name}</CardTitle>
                        <CardDescription className="mt-1">
                          创建于 {new Date(config.createdAt).toLocaleString('zh-CN')}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={config.enabled ? "default" : "secondary"}>
                          {config.enabled ? "已启用" : "已禁用"}
                        </Badge>
                        <Switch
                          checked={config.enabled}
                          onCheckedChange={(checked) => handleToggle(config.id, checked)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">溢价率阈值</p>
                        <p className="font-semibold text-foreground">
                          {parseFloat(config.discountThreshold).toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">定时任务</p>
                        <p className="font-mono text-xs text-foreground">
                          {config.cronExpression}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
