import { z } from "zod";
import { errorResponse } from "./api-response";

// ฟังก์ชัน helper สำหรับตรวจสอบความถูกต้องของข้อมูล (Validation) ที่รับมาจาก Request Body (JSON)
// โดยใช้ Zod Schema เป็นตัวกำหนดกฎเกณฑ์ (เช่น ฟิลด์นี้ต้องเป็นตัวเลข ห้ามว่าง เป็นต้น)
export async function validateRequest<T>(
  schema: z.Schema<T>, // Zod schema ที่ต้องการใช้ตรวจ
  req: Request // Request object จาก Next.js
): Promise<{ data: T | null; errorResponse: unknown }> {
  try {
    // 1. แปลงข้อมูลใน Request ให้เป็น JSON object
    const body = await req.json();
    
    // 2. ให้ Zod ตรวจสอบข้อมูลว่าถูกต้องตามกฎหรือไม่
    // ถ้าถูกต้องจะคืนค่า data กลับมาแบบมี Type (T) ที่ตรงตาม Schema ทุกประการ
    const data = schema.parse(body);
    
    // ส่งข้อมูลที่ถูกต้องกลับไป พร้อม errorResponse เป็น null เพื่อบอกว่าผ่านฉลุย
    return { data, errorResponse: null };
  } catch (error) {
    // ถ้าเกิดข้อผิดพลาดในการตรวจสอบ (ZodError)
    if (error instanceof z.ZodError) {
      return {
        data: null,
        // สร้าง response แบบ error และแนบรายละเอียดไปด้วยว่าฟิลด์ไหนผิด (error.flatten().fieldErrors)
        errorResponse: errorResponse("Validation failed", error.flatten().fieldErrors, 400),
      };
    }
    // ถ้าเป็นข้อผิดพลาดอื่นๆ (เช่น JSON ไม่ถูกต้อง Parse ไม่ได้)
    return {
      data: null,
      errorResponse: errorResponse("Invalid request body", null, 400),
    };
  }
}
