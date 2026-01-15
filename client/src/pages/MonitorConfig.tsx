import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Bell, Clock, Save } from 'lucide-react';

export default function MonitorConfig() {
  // Using sonner toast
  const [barkDeviceKey, setBarkDeviceKey] = useState('');
  const [cronExpression, setCronExpression] = useState('45 14 * * *');
  const [enabled, setEnabled] = useState(true);
  const [configId, setConfigId] = useState<number | null>(null);

  // 获取现有配置
  const { data: configs, refetch } = trpc.config.getAll.useQuery();
  const updateConfig = trpc.config.update.useMutation();
  const createConfig = trpc.config.create.useMutation();
  const testBark = trpc.config.testBark.useMutation();

  useEffect(() => {
    if (configs && configs.length > 0) {
      const config = configs[0];
      setConfigId(config.id);
      setBarkDeviceKey(config.barkDeviceKey || '');
      setCronExpression(config.cronExpression);
      setEnabled(config.enabled);
    }
  }, [configs]);

  const handleSave = async () => {
    try {
      if (configId) {
        // 更新现有配置
        await updateConfig.mutateAsync({
          id: configId,
          barkDeviceKey: barkDeviceKey || undefined,
          cronExpression,
          enabled,
        });
      } else {
        // 创建新配置
        await createConfig.mutateAsync({
          name: '默认监控配置',
          discountThreshold: 0,
          cronExpression,
          barkDeviceKey: barkDeviceKey || undefined,
          enabled,
        });
      }

      toast.success('监控配置已更新');

      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '未知错误');
    }
  };

  const handleTestBark = async () => {
    if (!barkDeviceKey) {
      toast.error('请先输入 Bark Device Key');
      return;
    }

    try {
      await testBark.mutateAsync({
        deviceKey: barkDeviceKey,
      });
      toast.success('测试成功，请检查您的 Bark 应用');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '测试失败');
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bell className="h-8 w-8" />
          监控配置
        </h1>
        <p className="text-muted-foreground mt-2">
          配置 Bark 推送服务和定时监控任务
        </p>
      </div>

      <div className="space-y-6">
        {/* Bark 推送配置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Bark 推送配置
            </CardTitle>
            <CardDescription>
              配置 Bark Device Key，在发现套利机会时自动推送到您的 iOS 设备
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="barkDeviceKey">Bark Device Key</Label>
              <Input
                id="barkDeviceKey"
                placeholder="例如：esrag47APctLhTF6nSXBoX"
                value={barkDeviceKey}
                onChange={(e) => setBarkDeviceKey(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                在 Bark 应用中可以找到您的 Device Key
              </p>
            </div>

            <Button onClick={handleTestBark} variant="outline">
              测试推送
            </Button>
          </CardContent>
        </Card>

        {/* 定时任务配置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              定时任务配置
            </CardTitle>
            <CardDescription>
              设置自动监控的触发时间（使用 Cron 表达式）
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cronExpression">Cron 表达式</Label>
              <Input
                id="cronExpression"
                placeholder="例如：45 14 * * * (每天 14:45)"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                格式：秒 分 时 日 月 周，例如 "45 14 * * *" 表示每天 14:45 执行
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
              <Label htmlFor="enabled">启用定时监控</Label>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">常用时间设置：</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => setCronExpression('0 30 9 * * *')}
                >
                  每天 9:30
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => setCronExpression('0 45 14 * * *')}
                >
                  每天 14:45
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => setCronExpression('0 0 10,14 * * *')}
                >
                  每天 10:00 和 14:00
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => setCronExpression('0 30 9,14 * * 1-5')}
                >
                  工作日 9:30 和 14:30
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 保存按钮 */}
        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg">
            <Save className="h-4 w-4 mr-2" />
            保存配置
          </Button>
        </div>
      </div>
    </div>
  );
}
