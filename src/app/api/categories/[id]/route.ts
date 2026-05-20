/**
 * app/api/categories/[id]/route.ts — Route Handler สำหรับ /api/categories/:id
 *
 * ไฟล์นี้จัดการ:
 *   GET    /api/categories/:id   — ดูหมวดหมู่ตาม ID
 *   PATCH  /api/categories/:id   — แก้ไขหมวดหมู่
 *   DELETE /api/categories/:id   — ลบหมวดหมู่ (ถ้ายังมีสินค้าผูกอยู่จะลบไม่ได้)
 */

import { categoryService } from "@/features/categories/category.service";
import { updateCategorySchema } from "@/features/categories/category.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { validateRequest } from "@/lib/validate";
import { ApiError } from "@/lib/errors";

/**
 * GET /api/categories/:id
 * ดูหมวดหมู่รายตัว — เปิดสาธารณะ
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params; // await params เพราะ Next.js 15+ เป็น Promise
    const id = Number(idStr);
    if (isNaN(id)) return errorResponse("Invalid ID format", null, 400);

    const category = await categoryService.getCategoryById(id);
    return successResponse(category); // 200 OK
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, null, error.statusCode); // 404 ถ้าไม่เจอ
    }
    return errorResponse("Internal server error", null, 500);
  }
}

/**
 * PATCH /api/categories/:id
 * แก้ไขชื่อหมวดหมู่
 *
 * Request Body (ส่งมาแค่ฟิลด์ที่ต้องการแก้ไข):
 * { "name": "แท็บเล็ต" }
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    if (isNaN(id)) return errorResponse("Invalid ID format", null, 400);

    // updateCategorySchema ใช้ .partial() ทำให้ทุกฟิลด์เป็น Optional
    const { data, errorResponse: errRes } = await validateRequest(updateCategorySchema, req);
    if (errRes) return errRes;

    const category = await categoryService.updateCategory(id, data!);
    return successResponse(category); // 200 OK พร้อมข้อมูลที่อัปเดตแล้ว
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, null, error.statusCode);
    }
    return errorResponse("Internal server error", null, 500);
  }
}

/**
 * DELETE /api/categories/:id
 * ลบหมวดหมู่
 *
 * ข้อควรรู้: ถ้ายังมีสินค้าอยู่ในหมวดหมู่นี้ ฐานข้อมูลจะปฏิเสธการลบ
 * เพราะมี Foreign Key Constraint ที่ป้องกันการลบ Record ที่ถูกอ้างอิงอยู่
 * Repository จะจับ Error นี้และแปลงเป็น 409 Conflict
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    if (isNaN(id)) return errorResponse("Invalid ID format", null, 400);

    await categoryService.deleteCategory(id);
    return successResponse(null); // 200 OK พร้อม null (ไม่มีข้อมูลให้คืนแล้ว)
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, null, error.statusCode);
    }
    return errorResponse("Internal server error", null, 500);
  }
}
