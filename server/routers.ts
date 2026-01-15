import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  getAllMonitorConfigs, 
  createMonitorConfig, 
  updateMonitorConfig,
  getPushHistories,
  getLatestLofRecords
} from "./db";
import { schedulerService } from "./schedulerService";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // LOF 监控相关接口
  lof: router({
    // 获取最新的 LOF 记录
    getLatest: publicProcedure
      .input(z.object({
        limit: z.number().optional().default(50),
      }))
      .query(async ({ input }) => {
        const records = await getLatestLofRecords(input.limit);
        return records;
      }),
    
    // 手动触发监控（仅管理员）
    triggerMonitoring: protectedProcedure
      .input(z.object({
        discountThreshold: z.number().optional().default(2.0),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Only admin can trigger monitoring');
        }
        
        await schedulerService.triggerManually(input.discountThreshold);
        
        return {
          success: true,
          message: 'Monitoring triggered successfully',
        };
      }),
  }),

  // 监控配置相关接口
  config: router({
    // 获取所有配置
    getAll: protectedProcedure.query(async () => {
      return await getAllMonitorConfigs();
    }),
    
    // 创建新配置
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        discountThreshold: z.number(),
        cronExpression: z.string(),
        enabled: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Only admin can create config');
        }
        
        await createMonitorConfig({
          name: input.name,
          discountThreshold: input.discountThreshold.toString(),
          cronExpression: input.cronExpression,
          enabled: input.enabled,
        });
        
        // 重新初始化调度器
        await schedulerService.initialize();
        
        return {
          success: true,
          message: 'Config created successfully',
        };
      }),
    
    // 更新配置
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        discountThreshold: z.number().optional(),
        cronExpression: z.string().optional(),
        enabled: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Only admin can update config');
        }
        
        const { id, ...updates } = input;
        
        // 转换 discountThreshold 为字符串
        const dbUpdates: any = { ...updates };
        if (updates.discountThreshold !== undefined) {
          dbUpdates.discountThreshold = updates.discountThreshold.toString();
        }
        
        await updateMonitorConfig(id, dbUpdates);
        
        // 重新初始化调度器
        await schedulerService.initialize();
        
        return {
          success: true,
          message: 'Config updated successfully',
        };
      }),
  }),

  // 推送历史相关接口
  history: router({
    // 获取推送历史
    getAll: protectedProcedure
      .input(z.object({
        limit: z.number().optional().default(50),
      }))
      .query(async ({ input }) => {
        return await getPushHistories(input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
