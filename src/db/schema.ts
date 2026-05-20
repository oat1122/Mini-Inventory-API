/**
 * schema.ts — นิยามโครงสร้างตาราง (Table Schema) ทั้งหมดในฐานข้อมูล
 *
 * ไฟล์นี้คือ "แบบแปลน" ของฐานข้อมูล ทุกตารางและทุกคอลัมน์ถูกนิยามที่นี่
 * Drizzle ORM จะใช้ข้อมูลในไฟล์นี้เพื่อสร้าง Migration และสร้าง Type ของ TypeScript ให้อัตโนมัติ
 */

import { mysqlTable, serial, varchar, text, int, timestamp, decimal } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// =============================================================================
// ตาราง users — เก็บข้อมูลผู้ใช้งานในระบบ
// =============================================================================
// หมายเหตุ: ใช้ชื่อตาราง "user" (ไม่มี s) ตามรูปแบบที่ NextAuth.js กำหนด
// เพื่อให้ NextAuth สามารถดึงข้อมูลผู้ใช้ได้ถูกต้อง
export const users = mysqlTable("user", {
  // id: ใช้เป็น UUID (รหัสตัวอักษรแบบสุ่ม) แทน Auto Increment
  // เหตุผล: ปลอดภัยกว่า เพราะเดาลำดับไม่ได้ และ NextAuth ออกแบบมาให้ใช้รูปแบบนี้
  // $defaultFn คือการกำหนดค่าเริ่มต้นด้วย JavaScript แทนที่จะให้ DB สร้างให้
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // name: ชื่อผู้ใช้งาน บังคับต้องมี (notNull)
  name: varchar("name", { length: 255 }).notNull(),

  // email: อีเมล บังคับต้องมี และห้ามซ้ำกัน (.unique())
  email: varchar("email", { length: 255 }).notNull().unique(),

  // emailVerified: วันเวลาที่ยืนยันอีเมล — ใช้โดย NextAuth ถ้ามีระบบ Email Verification
  // ปล่อยเป็น null ได้ เพราะตอนสมัครใหม่ยังไม่ได้ยืนยัน
  emailVerified: timestamp("emailVerified", { mode: "date", fsp: 3 }),

  // image: URL รูปโปรไฟล์ — ใช้โดย NextAuth ถ้าล็อกอินผ่าน OAuth (เช่น Google)
  image: varchar("image", { length: 255 }),

  // password: รหัสผ่านที่ผ่านการ Hash แล้วด้วย bcryptjs
  // เป็น null ได้ เผื่อในอนาคตอาจเพิ่มล็อกอินผ่าน OAuth ที่ไม่ต้องการรหัสผ่าน
  password: varchar("password", { length: 255 }),

  // role: บทบาทของผู้ใช้ในระบบ — มีแค่ "admin" กับ "user"
  // ค่าเริ่มต้นเป็น "user" ทุกคนที่สมัครใหม่จะได้บทบาทนี้โดยอัตโนมัติ
  role: varchar("role", { length: 50 }).notNull().default("user"),

  // createdAt: วันเวลาที่สร้าง Record — ถูกบันทึกอัตโนมัติตอน INSERT
  createdAt: timestamp("created_at").defaultNow().notNull(),

  // updatedAt: วันเวลาที่แก้ไขล่าสุด — อัปเดตอัตโนมัติทุกครั้งที่ทำ UPDATE
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// =============================================================================
// ตาราง categories — เก็บหมวดหมู่ของสินค้า
// =============================================================================
// ตารางนี้เรียบง่าย ไม่ซับซ้อน เป็นแค่รายการชื่อหมวดหมู่
// ใช้ serial เป็น Primary Key (คือ BIGINT UNSIGNED AUTO_INCREMENT) แทน UUID
// เพราะหมวดหมู่ไม่มีความเสี่ยงด้าน Security เหมือน User ID
export const categories = mysqlTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// =============================================================================
// ตาราง products — เก็บข้อมูลสินค้า
// =============================================================================
// ตารางนี้เป็นตารางหลักของระบบ สินค้าแต่ละชิ้นต้องผูกกับ:
//   - categories (หมวดหมู่) ผ่าน categoryId
//   - users (เจ้าของ) ผ่าน userId
// ความสัมพันธ์แบบนี้เรียกว่า Many-to-One (สินค้าหลายชิ้น → ผู้ใช้ 1 คน)
export const products = mysqlTable("products", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 255 }).notNull(),

  // description: รายละเอียดสินค้า — ไม่บังคับ (ไม่มี .notNull())
  description: text("description"),

  // price: ราคา ใช้ decimal แทน float เพื่อความแม่นยำสูงสุด
  // precision: 10 = จำนวนหลักทั้งหมด, scale: 2 = จำนวนหลักทศนิยม
  // ตัวอย่าง: 99999999.99 (ราคาสูงสุด ~100 ล้านบาท)
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),

  // stock: จำนวนสินค้าในคลัง ค่าเริ่มต้นคือ 0 (ไม่มีสต็อก)
  stock: int("stock").notNull().default(0),

  // categoryId: Foreign Key ชี้ไปที่ตาราง categories
  // ถ้าใส่ categoryId ที่ไม่มีในตาราง categories DB จะ reject ทันที (FK Constraint)
  categoryId: int("category_id").notNull().references(() => categories.id),

  // userId: Foreign Key ชี้ไปที่ตาราง users (เจ้าของสินค้า)
  // onDelete: "cascade" หมายความว่า ถ้าลบ user ออก สินค้าทั้งหมดของ user นั้นจะถูกลบตาม
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// =============================================================================
// Relations — กำหนดความสัมพันธ์ระหว่างตาราง (สำหรับ Drizzle ORM)
// =============================================================================
// ส่วนนี้ไม่ได้สร้างอะไรในฐานข้อมูล แต่ช่วยให้ Drizzle "รู้จัก" ความสัมพันธ์
// เพื่อให้เราสามารถ JOIN ตารางหรือดึงข้อมูลแบบ nested ได้ง่ายขึ้นในอนาคต

// users → products: 1 ผู้ใช้ สามารถมีสินค้าได้หลายชิ้น (One-to-Many)
export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
}));

// categories → products: 1 หมวดหมู่ สามารถมีสินค้าได้หลายชิ้น (One-to-Many)
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

// products → users & categories: 1 สินค้า มีเจ้าของ 1 คน และหมวดหมู่ 1 อัน (Many-to-One)
export const productsRelations = relations(products, ({ one }) => ({
  // บอกว่า products.userId ชี้ไปหา users.id
  user: one(users, {
    fields: [products.userId],
    references: [users.id],
  }),
  // บอกว่า products.categoryId ชี้ไปหา categories.id
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));
