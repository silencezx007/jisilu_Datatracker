import { schedulerService } from '../schedulerService';

/**
 * 应用启动时的初始化逻辑
 */
export async function initializeApp() {
  console.log('[Startup] Initializing application...');
  
  try {
    // 初始化定时任务调度器
    await schedulerService.initialize();
    console.log('[Startup] Scheduler initialized successfully');
  } catch (error) {
    console.error('[Startup] Failed to initialize scheduler:', error);
  }
  
  console.log('[Startup] Application initialized');
}
