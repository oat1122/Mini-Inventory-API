/**
 * product.schema.ts — Zod Validation Schema ของสินค้า
 *
 * ไฟล์นี้กำหนดกฎการตรวจสอบข้อมูล (Validation Rules) ที่รับมาจาก Client
 * ก่อนที่ข้อมูลจะถูกส่งไป Service หรือ Repository
 *
 * Zod คือ Library ที่ช่วย:
 * 1. ตรวจสอบว่าข้อมูลตรงตามกฎหรือไม่ (Validation)
 * 2. แปลงชนิดข้อมูล (Coercion) เช่น string → number
 * 3. สร้าง TypeScript Type จาก Schema อัตโนมัติ (Type Inference)
 */

import { z } from "zod";

/**
 * createProductSchema — กฎสำหรับตรวจสอบข้อมูลตอนสร้างสินค้าใหม่ (POST)
 *
 * Client ต้องส่งข้อมูลมาให้ครบตามนี้ (ยกเว้นฟิลด์ที่ระบุว่า optional)
 */
export const createProductSchema = z.object({
  // name: ต้องเป็น string และห้ามว่าง (min 1 ตัวอักษร)
  name: z.string().min(1, "Product name is required"),

  // description: ส่งมาหรือไม่ก็ได้ (.optional())
  description: z.string().optional(),

  /**
   * price: ราคาสินค้า
   *
   * z.coerce.number() จะแปลง string → number ก่อน Validate
   * เหตุผล: JSON ส่งมาเป็น string "1500.00" บางครั้ง แต่เราต้องการเลข
   *
   * .positive() = ต้องมากกว่า 0 (ราคาห้ามติดลบและห้ามเป็น 0)
   *
   * .transform((val) => val.toString()) แปลงกลับเป็น string ก่อนบันทึก DB
   * เพราะ Drizzle จะเก็บ Decimal เป็น string เพื่อความแม่นยำของตัวเลขทศนิยม
   * (JavaScript number มีปัญหาเรื่อง floating-point เช่น 0.1 + 0.2 ≠ 0.3)
   */
  price: z.coerce.number().positive("Price must be a positive number").transform((val) => val.toString()),

  // stock: ต้องเป็นจำนวนเต็ม (int) และไม่ติดลบ (min 0)
  stock: z.number().int().min(0, "Stock cannot be negative"),

  // categoryId: ต้องเป็นจำนวนเต็มและต้องมากกว่า 0
  categoryId: z.number().int().positive("Invalid category ID"),

  // userId ไม่รับจาก client อีกต่อไป — ดึงจาก JWT session แทน
  // การรับ userId จาก client จะเป็นช่องโหว่ Security ที่ทำให้ User แอบอ้างเป็นคนอื่นได้
});

/**
 * updateProductSchema — กฎสำหรับตรวจสอบข้อมูลตอนแก้ไขสินค้า (PATCH)
 *
 * .partial() แปลงทุกฟิลด์ใน createProductSchema ให้เป็น Optional
 * เพราะ PATCH ส่งมาแค่บางฟิลด์ที่ต้องการแก้ไขได้
 *
 * .refine() ตรวจสอบเพิ่มเติมว่าต้องมีข้อมูลอย่างน้อย 1 ฟิลด์
 * ป้องกันกรณี client ส่ง {} มา (body ว่างเปล่า) แล้วเราจะทำ Query ที่ไม่ได้ update อะไรเลย
 */
export const updateProductSchema = createProductSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  "No data provided to update"
);

/**
 * productQuerySchema — กฎสำหรับตรวจสอบ Query Parameters (GET)
 *
 * ใช้สำหรับ GET /api/products?page=1&limit=10&search=phone&categoryId=2
 * Query params ที่มาจาก URL จะเป็น string เสมอ เลยต้องใช้ z.coerce เพื่อแปลงชนิด
 */
export const productQuerySchema = z.object({
  // page: หน้าที่ต้องการ — แปลง string → number และต้องมากกว่า 0, ค่าเริ่มต้นคือ 1
  page: z.coerce.number().int().min(1).optional().default(1),

  // limit: จำนวนรายการต่อหน้า — จำกัดสูงสุดที่ 100 เพื่อป้องกัน performance ปัญหา
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),

  // search: คำค้นหา — ไม่บังคับ
  search: z.string().optional(),

  // categoryId: กรองตามหมวดหมู่ — ไม่บังคับ, ต้องเป็นเลขบวก
  categoryId: z.coerce.number().int().positive().optional()
});
