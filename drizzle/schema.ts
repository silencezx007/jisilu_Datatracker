import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * LOF 基金监控记录表
 * 存储每次监控扫描到的符合条件的基金数据
 */
export const lofRecords = mysqlTable("lof_records", {
  id: int("id").autoincrement().primaryKey(),
  /** 基金代码 */
  fundId: varchar("fundId", { length: 20 }).notNull(),
  /** 基金名称 */
  fundName: varchar("fundName", { length: 100 }).notNull(),
  /** 现价 */
  price: decimal("price", { precision: 10, scale: 4 }),
  /** 溢价率（百分比） */
  discountRate: decimal("discountRate", { precision: 10, scale: 2 }).notNull(),
  /** 申购状态 */
  applyStatus: varchar("applyStatus", { length: 50 }).notNull(),
  /** 基金净值 */
  fundNav: decimal("fundNav", { precision: 10, scale: 4 }),
  /** 实时估值 */
  estimateValue: decimal("estimateValue", { precision: 10, scale: 4 }),
  /** 股票占比 */
  stockRatio: decimal("stockRatio", { precision: 10, scale: 2 }),
  /** 基金公司 */
  issuerName: varchar("issuerName", { length: 100 }),
  /** 监控时间（数据抓取时间） */
  monitorTime: timestamp("monitorTime").notNull(),
  /** 创建时间 */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LofRecord = typeof lofRecords.$inferSelect;
export type InsertLofRecord = typeof lofRecords.$inferInsert;

/**
 * 监控配置表
 * 存储监控规则和定时任务配置
 */
export const monitorConfigs = mysqlTable("monitor_configs", {
  id: int("id").autoincrement().primaryKey(),
  /** 配置名称 */
  name: varchar("name", { length: 100 }).notNull(),
  /** 溢价率阈值（百分比） */
  discountThreshold: decimal("discountThreshold", { precision: 10, scale: 2 }).notNull().default("2.00"),
  /** 定时任务 cron 表达式（多个用逗号分隔） */
  cronExpression: varchar("cronExpression", { length: 255 }).notNull().default("45 14 * * *"),
  /** Bark Device Key（用于推送通知） */
  barkDeviceKey: varchar("barkDeviceKey", { length: 255 }),
  /** 是否启用 */
  enabled: boolean("enabled").notNull().default(true),
  /** 创建时间 */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  /** 更新时间 */
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MonitorConfig = typeof monitorConfigs.$inferSelect;
export type InsertMonitorConfig = typeof monitorConfigs.$inferInsert;

/**
 * 推送历史表
 * 记录每次推送的详细信息
 */
export const pushHistories = mysqlTable("push_histories", {
  id: int("id").autoincrement().primaryKey(),
  /** 推送时间 */
  pushTime: timestamp("pushTime").notNull(),
  /** 符合条件的基金数量 */
  fundCount: int("fundCount").notNull(),
  /** 推送内容（JSON 格式存储基金列表） */
  content: text("content").notNull(),
  /** 推送状态 */
  status: mysqlEnum("status", ["success", "failed"]).notNull(),
  /** 错误信息（如果推送失败） */
  errorMessage: text("errorMessage"),
  /** 创建时间 */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PushHistory = typeof pushHistories.$inferSelect;
export type InsertPushHistory = typeof pushHistories.$inferInsert;
