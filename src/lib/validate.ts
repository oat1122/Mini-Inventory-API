/**
 * validate.ts — Helper Function สำหรับ Validate Request Body ด้วย Zod
 *
 * ปัญหาที่แก้: ถ้าแต่ละ Route Handler เขียน Validation Logic เอง โค้ดจะซ้ำกันมาก
 * เช่น การ parse JSON, การเช็ค ZodError, การสร้าง error response
 *
 * วิธีแก้: รวม Logic ทั้งหมดไว้ในฟังก์ชันเดียว แล้วให้ทุก Route เรียกใช้
 *
 * การทำงาน:
 * 1. อ่าน body จาก Request
 * 2. ส่งให้ Zod ตรวจสอบ
 * 3. ถ้าผ่าน → คืน { data, errorResponse: null }
 * 4. ถ้าไม่ผ่าน → คืน { data: null, errorResponse: <Response 400> }
 */

import { z } from "zod";
import { errorResponse } from "./api-response";

/**
 * validateRequest — ตรวจสอบ Request Body ด้วย Zod Schema
 *
 * Generic Type <T> ทำให้ฟังก์ชันนี้ใช้ได้กับทุก Schema
 * TypeScript จะอนุมาน Type ของ data ให้อัตโนมัติตาม Schema ที่ส่งมา
 *
 * @param schema - Zod Schema ที่ใช้ตรวจสอบ (เช่น createProductSchema)
 * @param req - Request object จาก Next.js Route Handler
 *
 * @returns object ที่มี:
 *   - data: ข้อมูลที่ผ่าน Validation แล้ว (T) หรือ null ถ้าไม่ผ่าน
 *   - errorResponse: NextResponse สำเร็จรูป หรือ null ถ้าผ่าน Validation
 *
 * @example
 * const { data, errorResponse: errRes } = await validateRequest(createProductSchema, req);
 * if (errRes) return errRes; // ส่ง error กลับไปทันที
 * // ถ้าถึงบรรทัดนี้แสดงว่า data ผ่าน validation แล้ว
 * await productService.createProduct(data!);
 */
export async function validateRequest<T>(
  schema: z.Schema<T>,
  req: Request
): Promise<{ data: T | null; errorResponse: unknown }> {
  try {
    // ขั้นตอนที่ 1: แปลง Request Body เป็น JavaScript Object
    // req.json() จะ throw Error ถ้า body ไม่ใช่ JSON ที่ถูกต้อง
    const body = await req.json();

    // ขั้นตอนที่ 2: ให้ Zod ตรวจสอบข้อมูล
    // schema.parse() จะ:
    //   - ถ้าถูกต้อง → คืนข้อมูลที่มี Type T (อาจมีการ Transform ด้วย เช่น coerce, transform)
    //   - ถ้าไม่ถูกต้อง → throw ZodError พร้อมรายละเอียดว่าฟิลด์ไหนผิด
    const data = schema.parse(body);

    // ผ่านทุกอย่าง — คืนข้อมูลพร้อม errorResponse เป็น null (บอกว่าไม่มี Error)
    return { data, errorResponse: null };

  } catch (error) {
    if (error instanceof z.ZodError) {
      /**
       * ZodError เกิดเมื่อข้อมูลไม่ตรงตาม Schema
       * error.flatten().fieldErrors จะแปลง Error ให้อยู่ในรูป:
       * {
       *   "name": ["Product name is required"],
       *   "price": ["Expected number, received string"]
       * }
       * ทำให้ Client รู้ว่าฟิลด์ไหนผิดและผิดอย่างไร
       */
      return {
        data: null,
        errorResponse: errorResponse("Validation failed", error.flatten().fieldErrors, 400),
      };
    }

    // Error อื่นๆ เช่น JSON Parse Error (ส่ง body มาไม่ใช่ JSON)
    return {
      data: null,
      errorResponse: errorResponse("Invalid request body", null, 400),
    };
  }
}
