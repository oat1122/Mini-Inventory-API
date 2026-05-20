import { db } from "@/db/client";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ApiError } from "@/lib/errors";

// Repository Pattern: เป็นตัวกลางจัดการข้อมูลกับฐานข้อมูลโดยตรง
// คลาสนี้จะทำหน้าที่เขียน SQL Query ด้วย Drizzle ORM
export class CategoryRepository {
  
  // ดึงหมวดหมู่ทั้งหมด
  async findAll() {
    // เทียบเท่ากับ SQL: SELECT * FROM categories;
    return db.select().from(categories);
  }

  // ดึงหมวดหมู่ตาม ID
  async findById(id: number) {
    // เทียบเท่ากับ SQL: SELECT * FROM categories WHERE id = ?
    const result = await db.select().from(categories).where(eq(categories.id, id));
    // เนื่องจากผลลัพธ์เป็น Array เสมอ เราเลยเลือกตัวแรก [0] หรือถ้าไม่มีก็ส่ง null กลับไป
    return result[0] || null;
  }

  // สร้างหมวดหมู่ใหม่
  async create(data: { name: string }) {
    // เทียบเท่ากับ SQL: INSERT INTO categories (name) VALUES (?)
    const [result] = await db.insert(categories).values(data);
    // เมื่อเพิ่มเสร็จ เราจะดึงข้อมูลที่เพิ่งเพิ่มกลับไปให้ดูด้วย (โดยใช้ insertId)
    return this.findById(result.insertId);
  }

  // แก้ไขหมวดหมู่
  async update(id: number, data: { name?: string }) {
    // เทียบเท่ากับ SQL: UPDATE categories SET name = ? WHERE id = ?
    await db.update(categories).set(data).where(eq(categories.id, id));
    // คืนค่าข้อมูลใหม่หลังแก้ไขเสร็จ
    return this.findById(id);
  }

  // ลบหมวดหมู่
  async delete(id: number) {
    try {
      // เทียบเท่ากับ SQL: DELETE FROM categories WHERE id = ?
      await db.delete(categories).where(eq(categories.id, id));
    } catch (error) {
      const err = error as { code?: string };
      if (err.code === "ER_ROW_IS_REFERENCED_2") {
        throw new ApiError("Cannot delete category because it contains products", 409);
      }
      throw error; // ส่งต่อ Error อื่นๆ
    }
  }
}

// สร้าง instance ของ Repository เตรียมไว้ให้เรียกใช้จากที่อื่นได้เลย
export const categoryRepository = new CategoryRepository();
