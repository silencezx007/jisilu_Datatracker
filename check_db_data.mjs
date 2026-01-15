import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { lofOpportunities } from './drizzle/schema.ts';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const results = await db.select().from(lofOpportunities).orderBy(sql`discount_rate DESC`);
console.log(`数据库中共有 ${results.length} 条 LOF 数据`);
console.log(`\n溢价率 > 0% 的基金：`);
const positive = results.filter(r => r.discountRate > 0);
console.log(`共 ${positive.length} 个`);
positive.forEach((r, i) => {
  console.log(`${i+1}. ${r.fundCode} - ${r.fundName}: ${r.discountRate}% (申购: ${r.purchaseStatus})`);
});

await connection.end();
process.exit(0);
