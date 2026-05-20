import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// สร้าง Connection Pool สำหรับเชื่อมต่อกับฐานข้อมูล MariaDB/MySQL
// การใช้ Pool จะช่วยให้รองรับการเชื่อมต่อพร้อมๆ กันได้ดีกว่าการต่อแบบทีละครั้ง (Single Connection)
const poolConnection = mysql.createPool({
  // ดึง URL สำหรับเชื่อมต่อฐานข้อมูลจากไฟล์ .env
  uri: process.env.DATABASE_URL,
});

// สร้างตัวแปร db (Drizzle ORM instance) เพื่อเอาไว้ใช้ query ฐานข้อมูลในส่วนอื่นๆ ของแอป
// โดยส่ง poolConnection และ schema ที่เรากำหนดไว้ให้มันรู้จักโครงสร้างตาราง
export const db = drizzle(poolConnection, { schema, mode: "default" });
