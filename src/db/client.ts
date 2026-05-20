/**
 * client.ts — สร้างการเชื่อมต่อฐานข้อมูล (Database Connection Pool)
 *
 * ไฟล์นี้ทำหน้าที่เดียว คือสร้าง Drizzle ORM instance ที่พร้อมใช้งาน
 * แล้ว export ออกไปให้ทุกไฟล์ในโปรเจกต์ import ไปใช้ได้
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

/**
 * ปัญหา: Next.js มีระบบ Hot Reload (รีโหลดโค้ดอัตโนมัติเมื่อแก้ไขไฟล์)
 * ซึ่งในแต่ละครั้งที่ Hot Reload ทำงาน โมดูลทั้งหมดจะถูก "โหลดใหม่"
 * ถ้าเราสร้าง Connection Pool ตรงๆ มันจะสร้างซ้ำทุกครั้ง
 * ในที่สุด Connection จะเต็มจนเกิดข้อผิดพลาด "Too many connections"
 *
 * วิธีแก้: ใช้ globalThis เป็นที่เก็บ Connection
 * globalThis คือ Object พิเศษที่อยู่นอกเหนือระบบ Module
 * มันจะ "คงอยู่" ตลอด แม้ Module จะถูก Reload ใหม่
 *
 * โดยสรุป: สร้างครั้งแรกแล้วเก็บไว้ใน globalThis
 * ครั้งต่อไปถ้ามีอยู่แล้วก็ใช้ของเดิมเลย ไม่สร้างใหม่
 */
const globalForDb = globalThis as unknown as { conn: mysql.Pool | undefined };

/**
 * สร้าง Connection Pool โดยใช้ Nullish Coalescing (??)
 * ถ้า globalForDb.conn มีค่าอยู่แล้ว (เคยสร้างไว้ก่อน) → ใช้ของเดิม
 * ถ้า globalForDb.conn เป็น undefined (ยังไม่เคยสร้าง) → สร้างใหม่
 *
 * mysql.createPool คือการสร้าง "pool" ของ Connection หลายๆ อัน
 * แทนที่จะสร้าง Connection ใหม่ทุก Request (ซึ่งช้า)
 * Pool จะเก็บ Connection ไว้และนำกลับมาใช้ซ้ำ (เร็วกว่ามาก)
 */
const poolConnection = globalForDb.conn ?? mysql.createPool({
  uri: process.env.DATABASE_URL, // อ่านค่าการเชื่อมต่อจาก .env
});

/**
 * บันทึก Connection ลง globalThis เฉพาะตอน Development เท่านั้น
 * ใน Production (เซิร์ฟเวอร์จริง) ไม่มี Hot Reload จึงไม่จำเป็น
 * และไม่ควรแขวน Connection ไว้ใน global ในสภาพแวดล้อมจริง
 */
if (process.env.NODE_ENV !== "production") {
  globalForDb.conn = poolConnection;
}

/**
 * สร้าง Drizzle ORM instance
 * - poolConnection: ส่ง Connection Pool ให้ Drizzle ใช้
 * - schema: ส่ง Schema ทั้งหมดให้ Drizzle "รู้จัก" ตาราง
 * - mode: "default" = รูปแบบการทำงานมาตรฐาน
 *
 * ตัวแปร db นี้คือสิ่งที่ทุกไฟล์จะ import ไปใช้ query ฐานข้อมูล
 */
export const db = drizzle(poolConnection, { schema, mode: "default" });
