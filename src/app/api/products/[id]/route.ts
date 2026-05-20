/**
 * app/api/products/[id]/route.ts — Route Handler สำหรับ /api/products/:id
 *
 * ไฟล์นี้จัดการ:
 *   GET    /api/products/:id   — ดูสินค้าตาม ID (เปิดสาธารณะ)
 *   PATCH  /api/products/:id   — แก้ไขสินค้า (ต้องล็อกอินและมีสิทธิ์)
 *   DELETE /api/products/:id   — ลบสินค้า (ต้องล็อกอินและมีสิทธิ์)
 *
 * [id] ใน folder name คือ Dynamic Segment — Next.js จะรับค่า id จาก URL อัตโนมัติ
 * เช่น GET /api/products/42 → params.id === "42"
 */

import { productService } from "@/features/products/product.service";
import { updateProductSchema } from "@/features/products/product.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { validateRequest } from "@/lib/validate";
import { ApiError } from "@/lib/errors";
import { auth } from "@/auth";

/**
 * GET /api/products/:id
 * ดูข้อมูลสินค้า 1 ชิ้นตาม ID — เปิดสาธารณะ ไม่ต้องล็อกอิน
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    /**
     * await params — ใน Next.js 15+ params กลายเป็น Promise
     * ต้อง await ก่อนถึงจะดึง id ออกมาได้
     * id จาก URL จะเป็น string เสมอ เช่น "42" ไม่ใช่ 42
     */
    const { id: idStr } = await params;
    const id = Number(idStr); // แปลง "42" → 42

    // ตรวจสอบว่า id เป็นตัวเลขจริงๆ เช่น /api/products/abc จะได้ NaN
    if (isNaN(id)) return errorResponse("Invalid ID format", null, 400);

    const product = await productService.getProductById(id);
    return successResponse(product);

  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, null, error.statusCode);
    }
    return errorResponse("Internal server error", null, 500);
  }
}

/**
 * PATCH /api/products/:id
 * แก้ไขสินค้าบางฟิลด์ — ต้องล็อกอิน + ต้องเป็นเจ้าของสินค้าหรือ admin
 *
 * ใช้ PATCH ไม่ใช่ PUT เพราะ:
 * - PATCH = แก้ไขบางส่วน (ส่งมาแค่ฟิลด์ที่ต้องการเปลี่ยน)
 * - PUT = แทนที่ทั้งหมด (ต้องส่งทุกฟิลด์มา)
 *
 * Request Body (ส่งมาแค่ฟิลด์ที่ต้องการแก้ไข):
 * { "price": 29000 }
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // ตรวจสอบ Session ก่อน
    const session = await auth();
    if (!session?.user) return errorResponse("Unauthorized", null, 401);

    const { id: idStr } = await params;
    const id = Number(idStr);
    if (isNaN(id)) return errorResponse("Invalid ID format", null, 400);

    // ตรวจสอบข้อมูลที่ส่งมา (ทุกฟิลด์เป็น Optional ใน updateProductSchema)
    const { data, errorResponse: errRes } = await validateRequest(updateProductSchema, req);
    if (errRes) return errRes;

    /**
     * ส่ง userId และ userRole จาก Session ให้ Service ตรวจสอบสิทธิ์
     * - admin แก้ไขสินค้าใครก็ได้
     * - user ทั่วไปแก้ไขได้แค่สินค้าตัวเอง (เช็คจาก userId)
     */
    const product = await productService.updateProduct(id, data!, session.user.id, session.user.role);
    return successResponse(product);

  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, null, error.statusCode);
    }
    return errorResponse("Internal server error", null, 500);
  }
}

/**
 * DELETE /api/products/:id
 * ลบสินค้า — ต้องล็อกอิน + ต้องเป็นเจ้าของสินค้าหรือ admin
 *
 * Response: { "success": true, "data": null }
 * (คืน null เพราะหลังลบแล้วไม่มีข้อมูลให้ดู)
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return errorResponse("Unauthorized", null, 401);

    const { id: idStr } = await params;
    const id = Number(idStr);
    if (isNaN(id)) return errorResponse("Invalid ID format", null, 400);

    // Service จะเช็คสิทธิ์และลบสินค้า
    await productService.deleteProduct(id, session.user.id, session.user.role);
    return successResponse(null); // คืน null หลังลบสำเร็จ

  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, null, error.statusCode);
    }
    return errorResponse("Internal server error", null, 500);
  }
}
