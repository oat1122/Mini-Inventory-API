import { db } from "@/db/client";
import { products } from "@/db/schema";
import { eq, like, and, count, SQL } from "drizzle-orm";

// กำหนด Type ของข้อมูลที่ใช้ตอนเพิ่มหรือแก้ไขสินค้า โดยอนุมาน(infer) มาจากโครงสร้างตาราง
type NewProduct = typeof products.$inferInsert;
type UpdateProduct = Partial<NewProduct>;

export class ProductRepository {
  
  // ค้นหาสินค้าพร้อมแบ่งหน้า (Pagination)
  async findAndCountAll(params: { page: number; limit: number; search?: string; categoryId?: number }) {
    const { page, limit, search, categoryId } = params;
    // คำนวณจุดเริ่มต้นข้อมูล (เช่น หน้า 2 จำกัด 10 หน้าแรกเริ่มที่ 0, หน้า 2 เริ่มที่ 10)
    const offset = (page - 1) * limit;

    // สร้าง array เก็บเงื่อนไข (WHERE conditions)
    const conditions: SQL[] = [];
    
    // ถ้าส่งคำค้นหามาด้วย (search) ให้ค้นหาจากชื่อสินค้าแบบเหมือนบางส่วน (LIKE %keyword%)
    if (search) {
      conditions.push(like(products.name, `%${search}%`));
    }
    // ถ้าส่งหมวดหมู่มาด้วย ให้ค้นหาเจาะจงหมวดหมู่
    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }

    // ถ้ามีเงื่อนไขมากกว่า 1 ข้อ ให้เอามาเชื่อมด้วย AND
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // ดึงข้อมูลตามเงื่อนไข (พร้อม limit และ offset)
    const data = await db.select().from(products).where(where).limit(limit).offset(offset);
    
    // นับจำนวนข้อมูลทั้งหมดที่ตรงกับเงื่อนไข (เอาไว้ใช้คำนวณจำนวนหน้า)
    const [{ total }] = await db.select({ total: count() }).from(products).where(where);

    return { data, total };
  }

  // ดึงสินค้าตาม ID
  async findById(id: number) {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0] || null;
  }

  // เพิ่มสินค้า
  async create(data: NewProduct) {
    const [result] = await db.insert(products).values(data);
    return this.findById(result.insertId);
  }

  // แก้ไขสินค้า
  async update(id: number, data: UpdateProduct) {
    await db.update(products).set(data).where(eq(products.id, id));
    return this.findById(id);
  }

  // ลบสินค้า
  async delete(id: number) {
    await db.delete(products).where(eq(products.id, id));
  }
}

export const productRepository = new ProductRepository();
