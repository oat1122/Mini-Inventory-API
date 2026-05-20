/**
 * errors.ts — Custom Error Classes
 *
 * ปัญหาที่แก้: ใน JavaScript เมื่อ throw new Error("message")
 * เราไม่รู้ว่าควรตอบกลับด้วย HTTP Status Code อะไร
 *
 * วิธีแก้: สร้าง Custom Error ที่พ่วง statusCode มาด้วย
 * ทำให้ Route Handler จับ Error แล้วตอบ Response ได้ทันที โดยไม่ต้อง hardcode Status
 *
 * ตัวอย่างการใช้:
 *   throw new NotFoundError("Product not found")   → Route Handler ตอบ 404
 *   throw new ApiError("Forbidden", 403)            → Route Handler ตอบ 403
 */

/**
 * ApiError — Custom Error พื้นฐานที่ทุก Custom Error อื่นๆ สืบทอดมา
 *
 * extends Error หมายความว่า ApiError คือ Error ชนิดหนึ่ง (Inheritance)
 * ดังนั้น instanceof Error จะเป็น true และ instanceof ApiError ก็จะเป็น true เช่นกัน
 */
export class ApiError extends Error {
  statusCode: number; // HTTP Status Code เช่น 400, 401, 403, 404, 500
  errors?: unknown;   // รายละเอียดเพิ่มเติม เช่น Zod field errors (ใส่หรือไม่ใส่ก็ได้)

  constructor(message: string, statusCode = 400, errors?: unknown) {
    super(message); // เรียก constructor ของ Error ดั้งเดิม เพื่อ set this.message
    this.name = "ApiError"; // ชื่อ Error สำหรับ Debug
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

/**
 * NotFoundError — Error สำหรับกรณีที่หาข้อมูลไม่เจอ (HTTP 404)
 *
 * แยกออกมาเป็นคลาสเฉพาะเพราะ 404 ใช้บ่อยมาก
 * แทนที่จะเขียน throw new ApiError("...", 404) ซ้ำหลายที่
 * เขียน throw new NotFoundError("...") แทนได้เลย — สั้นกว่า ชัดเจนกว่า
 *
 * @param message - ข้อความอธิบายว่าหาอะไรไม่เจอ
 *   ค่าเริ่มต้น: "Resource not found" (ถ้าไม่ระบุ)
 */
export class NotFoundError extends ApiError {
  constructor(message = "Resource not found") {
    // เรียก constructor ของ ApiError โดยบังคับ statusCode = 404 เสมอ
    // ไม่มีทางเปลี่ยนเป็น Status อื่นได้ เพราะเป็นความหมายตายตัว
    super(message, 404);
    this.name = "NotFoundError";
  }
}
