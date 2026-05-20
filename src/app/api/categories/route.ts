import { categoryService } from "@/features/categories/category.service";
import { createCategorySchema } from "@/features/categories/category.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { validateRequest } from "@/lib/validate";
import { ApiError } from "@/lib/errors";

// เมธอด GET สำหรับดึงข้อมูลหมวดหมู่ทั้งหมด
export async function GET() {
  try {
    // เรียก service ดึงข้อมูล
    const categories = await categoryService.getAllCategories();
    // ถ้าสำเร็จ ส่งค่ากลับไปพร้อมสถานะ 200 (ค่าเริ่มต้นของ successResponse)
    return successResponse(categories);
  } catch (error) {
    // ถ้ามี Error แบบที่เรารู้จัก (เช่น NotFoundError) ให้ใช้ status ที่กำหนดไว้
    if (error instanceof ApiError) {
      return errorResponse(error.message, null, error.statusCode);
    }
    // ถ้าเป็น Error อื่นๆ ให้ตีเป็น 500 (ระบบล่ม)
    return errorResponse("Internal server error", null, 500);
  }
}

// เมธอด POST สำหรับสร้างหมวดหมู่ใหม่
export async function POST(req: Request) {
  try {
    // 1. ตรวจสอบข้อมูลก่อนว่าส่งมาครบ/ถูกต้องมั้ย? โดยอิงจาก createCategorySchema
    const { data, errorResponse: errRes } = await validateRequest(createCategorySchema, req);
    
    // 2. ถ้าไม่ถูกต้อง (มีค่า errRes) ให้หยุดทำงานแล้วส่ง Error กลับไปหาผู้ใช้เลย
    if (errRes) return errRes;

    // 3. ถ้าถูกต้อง ให้โยนไปให้ Service สร้างข้อมูลให้ (ใส่ ! แปลว่าเรามั่นใจว่า data ไม่เป็น null)
    const category = await categoryService.createCategory(data!);
    
    // 4. ส่งข้อมูลที่สร้างเสร็จแล้วกลับไป พร้อม Status 201 (Created)
    return successResponse(category, 201);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, null, error.statusCode);
    }
    return errorResponse("Internal server error", null, 500);
  }
}
