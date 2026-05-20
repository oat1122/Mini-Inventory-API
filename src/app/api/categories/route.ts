/**
 * app/api/categories/route.ts — Route Handler สำหรับ /api/categories
 *
 * ไฟล์นี้จัดการ:
 *   GET  /api/categories   — ดึงหมวดหมู่ทั้งหมด
 *   POST /api/categories   — สร้างหมวดหมู่ใหม่
 */

import { categoryService } from "@/features/categories/category.service";
import { createCategorySchema } from "@/features/categories/category.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { validateRequest } from "@/lib/validate";
import { ApiError } from "@/lib/errors";

/**
 * GET /api/categories
 * ดึงหมวดหมู่ทั้งหมด — ไม่มี Pagination เพราะหมวดหมู่มักมีจำนวนน้อย
 */
export async function GET() {
  try {
    const categories = await categoryService.getAllCategories();
    return successResponse(categories); // 200 OK
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, null, error.statusCode);
    }
    return errorResponse("Internal server error", null, 500);
  }
}

/**
 * POST /api/categories
 * สร้างหมวดหมู่ใหม่
 *
 * Request Body:
 * { "name": "สมาร์ทโฟน" }
 */
export async function POST(req: Request) {
  try {
    // ตรวจสอบข้อมูลด้วย createCategorySchema (name ต้องมีและห้ามว่าง)
    const { data, errorResponse: errRes } = await validateRequest(createCategorySchema, req);
    if (errRes) return errRes; // ข้อมูลผิด → 400

    const category = await categoryService.createCategory(data!);
    return successResponse(category, 201); // 201 Created
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, null, error.statusCode);
    }
    return errorResponse("Internal server error", null, 500);
  }
}
