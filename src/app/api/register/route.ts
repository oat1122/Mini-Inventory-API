/**
 * app/api/register/route.ts — Route Handler สำหรับการสมัครสมาชิก
 *
 * Endpoint: POST /api/register
 *
 * NextAuth.js ไม่มีระบบ Register ในตัว เราต้องสร้างเอง
 * ไฟล์นี้รับข้อมูลผู้ใช้ใหม่ → Hash รหัสผ่าน → บันทึกลง Database
 */

import { db } from "@/db/client";
import { users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { validateRequest } from "@/lib/validate";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

/**
 * registerSchema — กฎ Validation สำหรับการสมัครสมาชิก
 * ประกาศไว้ในไฟล์นี้เลย เพราะใช้แค่ที่นี่ที่เดียว ไม่จำเป็นต้องแยกไฟล์
 */
const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  // รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร — ในระบบจริงควรเพิ่มกฎเพิ่มเติม
  password: z.string().min(6, "Password must be at least 6 characters"),
});

/**
 * POST /api/register
 * สมัครสมาชิก
 *
 * Request Body:
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "password": "secret123"
 * }
 *
 * Response (201):
 * {
 *   "success": true,
 *   "data": { "id": "uuid-here", "name": "John Doe", "email": "john@example.com" }
 * }
 */
export async function POST(req: Request) {
  try {
    // ขั้นตอนที่ 1: ตรวจสอบข้อมูลด้วย Zod ผ่าน validateRequest helper
    const { data, errorResponse: errRes } = await validateRequest(registerSchema, req);
    if (errRes) return errRes; // ข้อมูลผิดรูปแบบ → 400

    const { name, email, password } = data!;

    // ขั้นตอนที่ 2: เช็คว่า Email นี้มีคนใช้แล้วหรือยัง
    // Select แค่ id เดียว ไม่ต้องดึงข้อมูลทั้งหมด — ประหยัด Network I/O
    const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
      return errorResponse("Email is already registered", null, 409); // 409 Conflict
    }

    /**
     * ขั้นตอนที่ 3: Hash รหัสผ่านด้วย bcryptjs
     *
     * bcrypt.hash(password, saltRounds) ทำ 2 สิ่ง:
     * 1. สร้าง Salt แบบสุ่ม (ข้อมูลสุ่มที่ผสมกับรหัสผ่าน ทำให้ Hash ไม่ซ้ำกัน)
     * 2. Hash รหัสผ่านด้วย Algorithm ที่ออกแบบมาให้ "ช้า" โดยตั้งใจ
     *
     * saltRounds = 10 หมายความว่า Algorithm ทำซ้ำ 2^10 = 1024 รอบ
     * ยิ่งช้า → Attacker ต้องใช้เวลานานมากในการ Brute Force
     *
     * เหตุผลที่ไม่เก็บรหัสผ่านตรงๆ:
     * ถ้าฐานข้อมูลหลุด ผู้โจมตีจะได้แค่ Hash ไปไม่ใช่รหัสผ่านจริง
     */
    const hashedPassword = await bcrypt.hash(password, 10);

    /**
     * ขั้นตอนที่ 4: บันทึกผู้ใช้ใหม่ลงฐานข้อมูล
     *
     * $returningId() คือฟีเจอร์ของ Drizzle + MySQL ที่คืน ID ของ Record ที่เพิ่งสร้าง
     * เราใช้มันเพื่อดึง id กลับมาส่งใน Response โดยไม่ต้อง Query เพิ่ม
     *
     * หมายเหตุ: id ถูกสร้างโดย $defaultFn(() => crypto.randomUUID()) ใน schema
     * ดังนั้นเราไม่ต้องส่ง id มาใน .values()
     */
    const [inserted] = await db.insert(users).values({
      name,
      email,
      password: hashedPassword, // เก็บ Hash ไม่ใช่รหัสผ่านจริง
    }).$returningId();

    // คืนข้อมูลผู้ใช้ที่สร้างแล้ว — ไม่คืน password กลับไปเด็ดขาด
    return successResponse({ id: inserted.id, name, email }, 201);

  } catch (error) {
    return errorResponse("Internal server error", null, 500);
  }
}
