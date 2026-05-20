/**
 * api-response.ts — Helper Functions สำหรับสร้าง HTTP Response
 *
 * ปัญหาที่แก้: ถ้าแต่ละ Route Handler สร้าง Response เอง format จะไม่เหมือนกัน
 * วิธีแก้: มี 2 ฟังก์ชันกลางที่ทุก Route ต้องใช้ ทำให้ format เหมือนกันทุก endpoint
 *
 * Response Format:
 *   สำเร็จ: { "success": true, "data": {...} }
 *   ผิดพลาด: { "success": false, "message": "...", "errors": {...} }
 */

import { NextResponse } from "next/server";

/**
 * successResponse — สร้าง Response กรณีทำงานสำเร็จ
 *
 * @param data - ข้อมูลที่ต้องการส่งกลับ (รับได้ทุก Type)
 * @param status - HTTP Status Code (ค่าเริ่มต้น: 200 OK)
 *   - 200 OK: ดึงข้อมูล, แก้ไข, ลบสำเร็จ
 *   - 201 Created: สร้างข้อมูลใหม่สำเร็จ
 *
 * @example
 * return successResponse({ id: 1, name: "iPhone" });         // GET → 200
 * return successResponse({ id: 1, name: "iPhone" }, 201);    // POST → 201
 * return successResponse(null);                               // DELETE → 200
 */
export function successResponse(data: unknown, status = 200) {
  return NextResponse.json(
    {
      success: true, // บอก client ว่าทำงานสำเร็จ
      data,          // ข้อมูลจริงๆ ที่ client ต้องการ
    },
    { status }
  );
}

/**
 * errorResponse — สร้าง Response กรณีเกิดข้อผิดพลาด
 *
 * @param message - ข้อความอธิบายข้อผิดพลาดหลัก (ภาษาอังกฤษ เพื่อความเป็น Standard)
 * @param errors - รายละเอียดเพิ่มเติม เช่น ฟิลด์ไหนผิด (ค่าเริ่มต้น: null)
 * @param status - HTTP Status Code (ค่าเริ่มต้น: 400 Bad Request)
 *   - 400 Bad Request: ข้อมูลผิด / Validation ไม่ผ่าน
 *   - 401 Unauthorized: ยังไม่ได้ Login
 *   - 403 Forbidden: Login แล้วแต่ไม่มีสิทธิ์
 *   - 404 Not Found: ไม่เจอข้อมูล
 *   - 409 Conflict: ข้อมูลซ้ำ (เช่น Email ซ้ำ)
 *   - 500 Internal Server Error: เกิดข้อผิดพลาดในระบบ
 *
 * @example
 * return errorResponse("Product not found", null, 404);
 * return errorResponse("Validation failed", { name: ["required"] }, 400);
 * return errorResponse("Unauthorized", null, 401);
 */
export function errorResponse(message: string, errors: unknown = null, status = 400) {
  return NextResponse.json(
    {
      success: false, // บอก client ว่าทำงานล้มเหลว
      message,        // ข้อความหลักอธิบายว่าเกิดอะไรขึ้น
      errors,         // รายละเอียดเพิ่มเติม (จาก Zod เช่น { name: ["Name is required"] })
    },
    { status }
  );
}
