import { mysqlTable, serial, varchar, text, int, timestamp, decimal } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// 1. ตาราง users (เก็บข้อมูลผู้ใช้งาน)
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(), // รหัสผู้ใช้ เป็น Primary Key และเพิ่มค่าอัตโนมัติ (Auto Increment)
  name: varchar("name", { length: 255 }).notNull(), // ชื่อผู้ใช้ บังคับว่าต้องมี (notNull)
  email: varchar("email", { length: 255 }).notNull().unique(), // อีเมล บังคับว่าต้องมี และห้ามซ้ำ (unique)
  role: varchar("role", { length: 50 }).notNull().default("user"), // บทบาท (เช่น admin, user) ค่าเริ่มต้นคือ user
  createdAt: timestamp("created_at").defaultNow().notNull(), // วันเวลาที่สร้าง บันทึกอัตโนมัติ
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(), // วันเวลาที่แก้ไข บันทึกอัตโนมัติเมื่อมีการอัปเดต
});

// 2. ตาราง categories (เก็บข้อมูลหมวดหมู่สินค้า)
export const categories = mysqlTable("categories", {
  id: serial("id").primaryKey(), // รหัสหมวดหมู่ (Primary Key)
  name: varchar("name", { length: 255 }).notNull(), // ชื่อหมวดหมู่สินค้า
  createdAt: timestamp("created_at").defaultNow().notNull(), // วันเวลาที่สร้าง
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(), // วันเวลาที่แก้ไข
});

// 3. ตาราง products (เก็บข้อมูลสินค้า)
export const products = mysqlTable("products", {
  id: serial("id").primaryKey(), // รหัสสินค้า (Primary Key)
  name: varchar("name", { length: 255 }).notNull(), // ชื่อสินค้า
  description: text("description"), // รายละเอียดสินค้า (อนุญาตให้ว่างได้)
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // ราคาสินค้า (ตัวเลขทศนิยม 2 ตำแหน่ง)
  stock: int("stock").notNull().default(0), // จำนวนสินค้าในสต๊อก ค่าเริ่มต้นคือ 0
  categoryId: int("category_id").notNull(), // รหัสหมวดหมู่ (Foreign Key อ้างอิงตาราง categories)
  userId: int("user_id").notNull(), // รหัสผู้ใช้ที่เป็นคนเพิ่มสินค้า (Foreign Key อ้างอิงตาราง users)
  createdAt: timestamp("created_at").defaultNow().notNull(), // วันเวลาที่สร้าง
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(), // วันเวลาที่แก้ไข
});

// --- การกำหนดความสัมพันธ์ (Relations) เพื่อให้ Drizzle ใช้งานการดึงข้อมูลแบบ Join ได้ง่ายขึ้น ---

// ความสัมพันธ์ของ users: 1 ผู้ใช้ สามารถมีสินค้า (products) ได้หลายชิ้น (One-to-Many)
export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
}));

// ความสัมพันธ์ของ categories: 1 หมวดหมู่ สามารถมีสินค้า (products) ได้หลายชิ้น (One-to-Many)
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

// ความสัมพันธ์ของ products: 1 สินค้า จะต้องมี 1 ผู้สร้าง (user) และ 1 หมวดหมู่ (category) (Many-to-One)
export const productsRelations = relations(products, ({ one }) => ({
  user: one(users, {
    fields: [products.userId], // ใช้ฟิลด์ userId ของ products
    references: [users.id], // ไปเชื่อมกับ id ของ users
  }),
  category: one(categories, {
    fields: [products.categoryId], // ใช้ฟิลด์ categoryId ของ products
    references: [categories.id], // ไปเชื่อมกับ id ของ categories
  }),
}));
