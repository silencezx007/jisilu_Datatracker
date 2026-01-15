import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, TrendingUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function LofList() {
  const { data: records, isLoading, refetch } = trpc.lof.getLatest.useQuery({ limit: 50 });
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

  const handleRefresh = () => {
    refetch();
    toast.info("正在刷新数据...");
  };

  const handleTrigger = () => {
    triggerMonitoring.mutate({ discountThreshold: 2.0 });
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
        {!records || records.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground mb-2">暂无套利机会</p>
              <p className="text-sm text-muted-foreground">
                当前没有符合条件的 LOF 基金（溢价率 &gt; 2% 且限购）
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                找到 <span className="font-semibold text-foreground">{records.length}</span> 个套利机会
              </p>
              <p className="text-xs text-muted-foreground">
                最后更新: {new Date(records[0]?.monitorTime || Date.now()).toLocaleString('zh-CN')}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {records.map((record) => (
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
