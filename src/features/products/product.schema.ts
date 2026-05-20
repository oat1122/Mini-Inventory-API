import { z } from "zod";

// Zod Schema สำหรับตรวจสอบข้อมูลตอน เพิ่มสินค้า (Create Product)
export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"), // ชื่อห้ามว่าง
  description: z.string().optional(), // คำอธิบายมีหรือไม่มีก็ได้
  // ราคา ต้องเป็นบวก และแปลงเป็น String เพราะในฐานข้อมูลใช้เป็น Decimal (ข้อจำกัดเรื่องทศนิยมใน JS)
  price: z.coerce.number().positive("Price must be a positive number").transform((val) => val.toString()),
  // สต๊อกต้องเป็นจำนวนเต็ม (int) และไม่ติดลบ (min 0)
  stock: z.number().int().min(0, "Stock cannot be negative"),
  categoryId: z.number().int().positive("Invalid category ID"), // รหัสหมวดหมู่ต้องเป็นเลขบวก
  userId: z.number().int().positive("Invalid user ID").optional().default(1), // รหัสคนเพิ่ม (ชั่วคราวให้เป็น 1)
});

// Zod Schema สำหรับอัปเดต (Update) แปลงทุกฟิลด์ให้เป็น Optional
// .refine() ใช้ตรวจสอบว่าต้องมีการส่งข้อมูลมาอย่างน้อย 1 ฟิลด์
export const updateProductSchema = createProductSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  "No data provided to update"
);

// Zod Schema สำหรับตรวจสอบ query params ตอนเรียกดูสินค้า
export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  categoryId: z.coerce.number().int().positive().optional()
});
