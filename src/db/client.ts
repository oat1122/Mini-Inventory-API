import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// ป้องกันปัญหา Hot Reload ใน Next.js สร้าง Connection ซ้ำซ้อนจนพัง (Too many connections)
const globalForDb = globalThis as unknown as { conn: mysql.Pool | undefined };

const poolConnection = globalForDb.conn ?? mysql.createPool({
  uri: process.env.DATABASE_URL,
});

if (process.env.NODE_ENV !== "production") {
  globalForDb.conn = poolConnection;
}

// สร้างตัวแปร db (Drizzle ORM instance) เพื่อเอาไว้ใช้ query ฐานข้อมูล
export const db = drizzle(poolConnection, { schema, mode: "default" });
