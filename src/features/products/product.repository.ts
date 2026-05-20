/**
 * product.repository.ts — Data Access Layer ของสินค้า
 *
 * Repository Layer คือชั้นที่ติดต่อกับฐานข้อมูลโดยตรง
 * ทุก SQL Query ของสินค้าต้องอยู่ในไฟล์นี้เท่านั้น
 *
 * ข้อดีของการแยก Repository:
 * - ถ้าวันหนึ่งเปลี่ยน Database (เช่น จาก MySQL เป็น PostgreSQL) แก้แค่ไฟล์นี้
 * - Service และ Route Handler ไม่ต้องรู้เรื่อง SQL เลย
 * - ทดสอบ (Unit Test) ได้ง่าย เพราะ mock แค่ Repository layer เดียว
 */

import { db } from "@/db/client";
import { products } from "@/db/schema";
import { eq, like, and, count, SQL } from "drizzle-orm";
import { ApiError } from "@/lib/errors";

// Type สำหรับ Insert — Drizzle สร้างให้อัตโนมัติจาก Schema
type NewProduct = typeof products.$inferInsert;
// Type สำหรับ Update — ทุกฟิลด์เป็น Optional (ส่งมาแค่บางฟิลด์ได้)
type UpdateProduct = Partial<NewProduct>;

export class ProductRepository {

  /**
   * findAndCountAll — ดึงสินค้าพร้อม Filter และ Pagination
   *
   * ทำ 2 Query พร้อมกัน:
   * 1. SELECT ... LIMIT ... OFFSET ... → ดึงข้อมูลหน้าที่ต้องการ
   * 2. SELECT COUNT(*) ... → นับจำนวนทั้งหมด (ไม่มี LIMIT) เพื่อคำนวณหน้า
   *
   * @param params - page, limit, search (ค้นหาชื่อ), categoryId (กรองหมวดหมู่)
   */
  async findAndCountAll(params: { page: number; limit: number; search?: string; categoryId?: number }) {
    const { page, limit, search, categoryId } = params;

    // คำนวณ OFFSET — จุดเริ่มต้นของข้อมูลในหน้านั้น
    // หน้า 1: offset = 0, หน้า 2: offset = 10, หน้า 3: offset = 20 (ถ้า limit = 10)
    const offset = (page - 1) * limit;

    // สร้าง Array ของเงื่อนไข WHERE — เพิ่มเงื่อนไขเข้าไปเรื่อยๆ ตาม param ที่ส่งมา
    const conditions: SQL[] = [];

    if (search) {
      // Escape อักขระพิเศษของ SQL LIKE ก่อน เพื่อป้องกัน SQL Injection รูปแบบ Wildcard
      // เช่น ถ้า user ค้นหา "50%" (เครื่องหมาย %) จะถูก Escape เป็น "50\%" แทน
      const safeSearch = search.replace(/[%_]/g, "\\$&");
      // LIKE '%keyword%' = ค้นหาชื่อสินค้าที่มีคำนี้อยู่ไหนก็ได้
      conditions.push(like(products.name, `%${safeSearch}%`));
    }

    if (categoryId) {
      // เพิ่มเงื่อนไขกรองตามหมวดหมู่
      conditions.push(eq(products.categoryId, categoryId));
    }

    // ถ้ามีเงื่อนไขหลายข้อ รวมด้วย AND (เช่น search AND categoryId)
    // ถ้าไม่มีเงื่อนไขเลย ส่ง undefined (ไม่ใส่ WHERE clause)
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Query 1: ดึงข้อมูลจริงๆ ตาม Filter + Pagination
    const data = await db.select().from(products).where(where).limit(limit).offset(offset);

    // Query 2: นับจำนวนทั้งหมดที่ตรงกับ Filter (ไม่มี LIMIT)
    // Destructuring: [{ total }] ดึงค่า total จากแถวแรกของ Array
    const [{ total }] = await db.select({ total: count() }).from(products).where(where);

    return { data, total };
  }

  /**
   * findById — ดึงสินค้า 1 ชิ้นตาม ID
   *
   * @returns ข้อมูลสินค้า หรือ null ถ้าไม่เจอ
   */
  async findById(id: number) {
    const result = await db.select().from(products).where(eq(products.id, id));
    // Drizzle คืน Array เสมอ เราเลยต้องดึง [0] — ถ้าว่างเปล่าก็คืน null
    return result[0] || null;
  }

  /**
   * create — เพิ่มสินค้าใหม่
   *
   * @param data - ข้อมูลสินค้าที่ผ่าน Validation แล้ว รวมถึง userId ที่ผูกจาก session
   * @returns ข้อมูลสินค้าที่เพิ่งสร้าง
   * @throws ApiError (400) ถ้า categoryId หรือ userId ที่ส่งมาไม่มีอยู่ใน DB (FK Constraint)
   */
  async create(data: NewProduct) {
    try {
      // INSERT INTO products (...) VALUES (...)
      // result[0].insertId คือ ID ของแถวที่เพิ่งถูก Insert (Auto Increment)
      const [result] = await db.insert(products).values(data);
      // ดึงข้อมูลที่เพิ่งสร้างกลับมาส่งให้ Client
      return this.findById(result.insertId);
    } catch (error) {
      const err = error as { code?: string };
      /**
       * ER_NO_REFERENCED_ROW_2 คือ MySQL Error Code สำหรับ Foreign Key Constraint Violation
       * เกิดขึ้นเมื่อ:
       * - categoryId ที่ส่งมาไม่มีอยู่ในตาราง categories
       * - userId ที่ส่งมาไม่มีอยู่ในตาราง users
       *
       * เราจับ Error นี้เพื่อส่ง Message ที่เข้าใจง่ายกว่า DB Error ดิบๆ
       */
      if (err.code === "ER_NO_REFERENCED_ROW_2") {
        throw new ApiError("Invalid categoryId or userId provided (Foreign Key Constraint Failed)", 400);
      }
      throw error; // Error อื่นๆ ส่งต่อให้ Route Handler จัดการ
    }
  }

  /**
   * update — แก้ไขข้อมูลสินค้า
   *
   * @param id - ID ของสินค้าที่ต้องการแก้ไข
   * @param data - ข้อมูลที่ต้องการอัปเดต (ไม่มี userId เพราะ Service Strip ออกแล้ว)
   * @returns ข้อมูลสินค้าหลังอัปเดต
   */
  async update(id: number, data: UpdateProduct) {
    try {
      // UPDATE products SET ... WHERE id = ?
      await db.update(products).set(data).where(eq(products.id, id));
      return this.findById(id); // ดึงข้อมูลใหม่หลังอัปเดต
    } catch (error) {
      const err = error as { code?: string };
      // จัดการ FK Error เช่นกรณีส่ง categoryId ที่ไม่มีอยู่ตอน Update
      if (err.code === "ER_NO_REFERENCED_ROW_2") {
        throw new ApiError("Invalid categoryId or userId provided (Foreign Key Constraint Failed)", 400);
      }
      throw error;
    }
  }

  /**
   * delete — ลบสินค้า
   *
   * @param id - ID ของสินค้าที่ต้องการลบ
   */
  async delete(id: number) {
    // DELETE FROM products WHERE id = ?
    await db.delete(products).where(eq(products.id, id));
  }
}

// Export Singleton
export const productRepository = new ProductRepository();
