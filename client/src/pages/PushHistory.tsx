import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, CheckCircle, XCircle, TrendingUp } from "lucide-react";

export default function PushHistory() {
  const { data: histories, isLoading } = trpc.history.getAll.useQuery({ limit: 50 });

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
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <History className="w-6 h-6 text-primary" />
              推送历史
            </h1>
            <p className="text-sm text-muted-foreground mt-1">查看历史推送记录</p>
          </div>
        </div>
      </header>

      <main className="container py-6">
        {!histories || histories.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">暂无推送历史</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {histories.map((history) => {
              const opportunities = JSON.parse(history.content);
              return (
                <Card key={history.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {history.status === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-success" />
                          ) : (
                            <XCircle className="w-5 h-5 text-destructive" />
                          )}
                          {new Date(history.pushTime).toLocaleString('zh-CN')}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {history.status === 'success' 
                            ? `成功推送 ${history.fundCount} 个套利机会`
                            : '推送失败'}
                        </CardDescription>
                      </div>
                      <Badge variant={history.status === 'success' ? 'default' : 'destructive'}>
                        {history.status === 'success' ? '成功' : '失败'}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  {history.status === 'success' && opportunities.length > 0 && (
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground mb-2">
                          推送内容：
                        </p>
                        <div className="space-y-1">
                          {opportunities.slice(0, 5).map((opp: any, index: number) => (
                            <div 
                              key={index}
                              className="flex items-center justify-between text-sm p-2 rounded bg-muted/50"
                            >
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-success" />
                                <span className="font-medium">{opp.fundName}</span>
                                <span className="text-muted-foreground">({opp.fundId})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  +{opp.discountRate.toFixed(2)}%
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {opp.applyStatus}
                                </span>
                              </div>
                            </div>
                          ))}
                          {opportunities.length > 5 && (
                            <p className="text-xs text-muted-foreground text-center pt-2">
                              ... 还有 {opportunities.length - 5} 个机会
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}

                  {history.status === 'failed' && history.errorMessage && (
                    <CardContent>
                      <div className="p-3 rounded bg-destructive/10 border border-destructive/20">
                        <p className="text-sm text-destructive">
                          错误信息: {history.errorMessage}
                        </p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
