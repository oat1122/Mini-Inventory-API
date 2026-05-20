import { z } from "zod";

// Zod Schema สำหรับตรวจสอบข้อมูลตอน สร้าง (Create) หมวดหมู่
export const createCategorySchema = z.object({
  // กำหนดว่า name ต้องเป็น string และต้องมีความยาวอย่างน้อย 1 ตัวอักษร (ห้ามเป็นค่าว่าง)
  name: z.string().min(1, "Category name is required"),
});

// Zod Schema สำหรับตรวจสอบข้อมูลตอน แก้ไข (Update) หมวดหมู่
// ใช้ .partial() แปลว่าทุกฟิลด์ใน createCategorySchema จะกลายเป็น Optional (ส่งมาหรือไม่ส่งมาก็ได้)
// .refine() ใช้ตรวจสอบว่าต้องมีการส่งข้อมูลมาอย่างน้อย 1 ฟิลด์
export const updateCategorySchema = createCategorySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  "No data provided to update"
);
