import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, lofRecords, InsertLofRecord, monitorConfigs, InsertMonitorConfig, pushHistories, InsertPushHistory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// LOF Records 相关查询

export async function insertLofRecords(records: InsertLofRecord[]) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  if (records.length === 0) {
    return;
  }
  
  await db.insert(lofRecords).values(records);
}

export async function getLofRecordsByDate(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  return await db.select()
    .from(lofRecords)
    .where(eq(lofRecords.monitorTime, startDate))
    .orderBy(desc(lofRecords.discountRate));
}

export async function getLatestLofRecords(limit: number = 50) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  // 获取最近一次监控的时间
  const latestMonitorTime = await db.select({ monitorTime: lofRecords.monitorTime })
    .from(lofRecords)
    .orderBy(desc(lofRecords.monitorTime))
    .limit(1);
  
  if (latestMonitorTime.length === 0) {
    return [];
  }
  
  // 只返回最近一次监控的数据，并按溢价率降序排列
  const records = await db.select()
    .from(lofRecords)
    .where(eq(lofRecords.monitorTime, latestMonitorTime[0].monitorTime))
    .orderBy(desc(lofRecords.discountRate))
    .limit(limit);
  
  // 前端额外保险：按 fund_id 去重
  const uniqueRecords = records.filter((record, index, self) => 
    index === self.findIndex(r => r.fundId === record.fundId)
  );
  
  return uniqueRecords;
}

// Monitor Configs 相关查询

export async function getActiveMonitorConfig() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  const result = await db.select()
    .from(monitorConfigs)
    .where(eq(monitorConfigs.enabled, true))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function getAllMonitorConfigs() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  return await db.select().from(monitorConfigs).orderBy(desc(monitorConfigs.createdAt));
}

export async function createMonitorConfig(config: InsertMonitorConfig) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  const result = await db.insert(monitorConfigs).values(config);
  return result;
}

export async function updateMonitorConfig(id: number, updates: Partial<InsertMonitorConfig>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  await db.update(monitorConfigs)
    .set(updates)
    .where(eq(monitorConfigs.id, id));
}

// Push Histories 相关查询

export async function insertPushHistory(history: InsertPushHistory) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  await db.insert(pushHistories).values(history);
}

export async function getPushHistories(limit: number = 50) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  return await db.select()
    .from(pushHistories)
    .orderBy(desc(pushHistories.pushTime))
    .limit(limit);
}
