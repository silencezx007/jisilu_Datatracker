import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, TrendingUp, AlertCircle, Filter } from "lucide-react";
import { toast } from "sonner";

export default function LofList() {
  const [customThreshold, setCustomThreshold] = useState(2.0);
  const { data: records, isLoading, refetch } = trpc.lof.getLatest.useQuery({ limit: 200 });
  const triggerMonitoring = trpc.lof.triggerMonitoring.useMutation({
    onSuccess: () => {
      toast.success("监控任务已触发，请稍后刷新查看结果");
      setTimeout(() => {
        refetch();
      }, 3000);
    },
    onError: (error) => {
      toast.error(error.message || "触发监控失败");
    },
  });

  // 前端实时筛选：根据自定义阈值过滤数据
  const filteredRecords = useMemo(() => {
    if (!records) return [];
    
    return records.filter(record => {
      const discountRate = parseFloat(record.discountRate);
      const hasLimit = record.applyStatus.includes('限');
      return discountRate > customThreshold && hasLimit;
    });
  }, [records, customThreshold]);

  const handleRefresh = () => {
    refetch();
    toast.info("正在刷新数据...");
  };

  const handleTrigger = () => {
    triggerMonitoring.mutate({ discountThreshold: 2.0 });
  };

  const handleThresholdChange = (value: number[]) => {
    setCustomThreshold(value[0]);
  };

  const setQuickThreshold = (value: number) => {
    setCustomThreshold(value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                LOF Hunter
              </h1>
              <p className="text-sm text-muted-foreground mt-1">溢价套利监控系统</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                刷新
              </Button>
              <Button size="sm" onClick={handleTrigger} disabled={triggerMonitoring.isPending}>
                {triggerMonitoring.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    触发中...
                  </>
                ) : (
                  "立即监控"
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container py-6">
        {/* 筛选控件 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              自定义筛选条件
            </CardTitle>
            <CardDescription>
              调整溢价率阈值，实时查看不同条件下的套利机会
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="threshold-slider" className="text-sm font-medium">
                  溢价率阈值
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={customThreshold}
                    onChange={(e) => setCustomThreshold(parseFloat(e.target.value) || 0)}
                    className="w-20 h-8 text-sm"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
              
              <Slider
                id="threshold-slider"
                min={0}
                max={10}
                step={0.1}
                value={[customThreshold]}
                onValueChange={handleThresholdChange}
                className="w-full"
              />
              
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={customThreshold === 1.0 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuickThreshold(1.0)}
                >
                  1.0%
                </Button>
                <Button
                  variant={customThreshold === 1.5 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuickThreshold(1.5)}
                >
                  1.5%
                </Button>
                <Button
                  variant={customThreshold === 2.0 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuickThreshold(2.0)}
                >
                  2.0%
                </Button>
                <Button
                  variant={customThreshold === 3.0 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuickThreshold(3.0)}
                >
                  3.0%
                </Button>
                <Button
                  variant={customThreshold === 5.0 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuickThreshold(5.0)}
                >
                  5.0%
                </Button>
              </div>
            </div>

            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  当前筛选条件：溢价率 &gt; {customThreshold.toFixed(1)}% 且限购
                </span>
                <Badge variant="secondary" className="text-sm">
                  {filteredRecords.length} 个机会
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 基金列表 */}
        {filteredRecords.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground mb-2">暂无套利机会</p>
              <p className="text-sm text-muted-foreground">
                当前没有符合条件的 LOF 基金（溢价率 &gt; {customThreshold.toFixed(1)}% 且限购）
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                尝试降低溢价率阈值查看更多机会
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                找到 <span className="font-semibold text-foreground">{filteredRecords.length}</span> 个套利机会
              </p>
              {records && records.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  最后更新: {new Date(records[0]?.monitorTime || Date.now()).toLocaleString('zh-CN')}
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredRecords.map((record) => (
                <Card key={record.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{record.fundName}</CardTitle>
                        <CardDescription className="mt-1">{record.fundId}</CardDescription>
                      </div>
                      <Badge 
                        variant="default" 
                        className="ml-2 bg-success text-success-foreground"
                      >
                        +{parseFloat(record.discountRate).toFixed(2)}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">现价</p>
                        <p className="font-semibold text-foreground">
                          {record.price ? parseFloat(record.price).toFixed(4) : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">净值</p>
                        <p className="font-semibold text-foreground">
                          {record.fundNav ? parseFloat(record.fundNav).toFixed(4) : '-'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">申购状态</span>
                        <Badge variant="outline" className="text-xs">
                          {record.applyStatus}
                        </Badge>
                      </div>
                    </div>

                    {record.issuerName && (
                      <div className="text-xs text-muted-foreground">
                        {record.issuerName}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
