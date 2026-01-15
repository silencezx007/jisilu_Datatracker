import * as cron from 'node-cron';
import { monitorLofOpportunities } from './jisiluService';
import { insertLofRecords, insertPushHistory, getActiveMonitorConfig } from './db';
import { notifyOwner } from './_core/notification';

/**
 * 定时任务调度器
 */
class SchedulerService {
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  
  /**
   * 初始化调度器，加载活跃的监控配置
   */
  async initialize() {
    console.log('[Scheduler] Initializing scheduler service...');
    
    try {
      const config = await getActiveMonitorConfig();
      
      if (config) {
        console.log(`[Scheduler] Found active config: ${config.name}`);
        this.scheduleMonitoring(config.cronExpression, parseFloat(config.discountThreshold));
      } else {
        console.log('[Scheduler] No active config found, using default schedule');
        // 默认配置：每日 14:45，抓取所有溢价率 > 0% 且限购的基金
        this.scheduleMonitoring('45 14 * * *', 0);
      }
    } catch (error) {
      console.error('[Scheduler] Failed to initialize:', error);
      // 使用默认配置作为后备
      this.scheduleMonitoring('45 14 * * *', 0);
    }
  }
  
  /**
   * 安排监控任务
   * @param cronExpression cron 表达式（支持多个，用逗号分隔）
   * @param discountThreshold 溢价率阈值
   */
  scheduleMonitoring(cronExpression: string, discountThreshold: number) {
    // 停止所有现有任务
    this.stopAll();
    
    // 解析 cron 表达式（支持多个）
    const expressions = cronExpression.split(',').map(e => e.trim());
    
    for (const expr of expressions) {
      if (!cron.validate(expr)) {
        console.error(`[Scheduler] Invalid cron expression: ${expr}`);
        continue;
      }
      
      const task = cron.schedule(expr, async () => {
        await this.executeMonitoring(discountThreshold);
      });
      
      this.tasks.set(expr, task);
      console.log(`[Scheduler] Scheduled monitoring task: ${expr}`);
    }
  }
  
  /**
   * 执行监控任务
   */
  async executeMonitoring(discountThreshold: number) {
    const monitorTime = new Date();
    console.log(`[Scheduler] Executing monitoring at ${monitorTime.toISOString()}`);
    
    try {
      // 获取并筛选数据
      const opportunities = await monitorLofOpportunities(discountThreshold);
      
      // 保存到数据库
      if (opportunities.length > 0) {
        const records = opportunities.map(opp => ({
          fundId: opp.fundId,
          fundName: opp.fundName,
          price: opp.price?.toString() || null,
          discountRate: opp.discountRate.toString(),
          applyStatus: opp.applyStatus,
          fundNav: opp.fundNav?.toString() || null,
          estimateValue: opp.estimateValue?.toString() || null,
          stockRatio: opp.stockRatio?.toString() || null,
          issuerName: opp.issuerName,
          monitorTime: monitorTime,
        }));
        
        await insertLofRecords(records as any);
        console.log(`[Scheduler] Saved ${records.length} records to database`);
        
        // 发送通知
        await this.sendNotification(opportunities);
        
        // 记录推送历史
        await insertPushHistory({
          pushTime: monitorTime,
          fundCount: opportunities.length,
          content: JSON.stringify(opportunities),
          status: 'success',
        });
      } else {
        console.log('[Scheduler] No opportunities found, skipping notification');
      }
    } catch (error) {
      console.error('[Scheduler] Monitoring failed:', error);
      
      // 记录失败的推送历史
      await insertPushHistory({
        pushTime: monitorTime,
        fundCount: 0,
        content: JSON.stringify([]),
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  /**
   * 发送通知
   */
  private async sendNotification(opportunities: Array<{
    fundId: string;
    fundName: string;
    discountRate: number;
    applyStatus: string;
  }>) {
    if (opportunities.length === 0) {
      return;
    }
    
    // 构建通知内容
    let content = `发现 ${opportunities.length} 个套利机会！\n\n`;
    
    // 显示前 5 个机会
    const topOpportunities = opportunities.slice(0, 5);
    for (const opp of topOpportunities) {
      content += `${opp.fundName} (${opp.fundId}): 溢价 ${opp.discountRate.toFixed(2)}% | ${opp.applyStatus}\n`;
    }
    
    if (opportunities.length > 5) {
      content += `\n... 还有 ${opportunities.length - 5} 个机会`;
    }
    
    try {
      const success = await notifyOwner({
        title: `🚀 LOF 套利机会提醒`,
        content: content,
      });
      
      if (success) {
        console.log('[Scheduler] Notification sent successfully');
      } else {
        console.warn('[Scheduler] Notification failed');
      }
    } catch (error) {
      console.error('[Scheduler] Failed to send notification:', error);
    }
  }
  
  /**
   * 手动触发监控（用于测试）
   */
  async triggerManually(discountThreshold: number = 0) {
    console.log('[Scheduler] Manual trigger requested');
    await this.executeMonitoring(discountThreshold);
  }
  
  /**
   * 停止所有任务
   */
  stopAll() {
    this.tasks.forEach((task, expr) => {
      task.stop();
      console.log(`[Scheduler] Stopped task: ${expr}`);
    });
    this.tasks.clear();
  }
  
  /**
   * 获取当前活跃的任务
   */
  getActiveTasks(): string[] {
    return Array.from(this.tasks.keys());
  }
}

// 导出单例
export const schedulerService = new SchedulerService();
