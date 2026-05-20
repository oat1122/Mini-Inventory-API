import { categoryService } from "@/features/categories/category.service";
import { updateCategorySchema } from "@/features/categories/category.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { validateRequest } from "@/lib/validate";
import { ApiError } from "@/lib/errors";

// เมธอด GET สำหรับดูข้อมูลหมวดหมู่รายตัว (อ้างอิงจาก ID บน URL เช่น /api/categories/1)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    if (isNaN(id)) return errorResponse("Invalid ID format", null, 400);

    // ส่ง id ไปให้ Service ดึงข้อมูล (แปลง id เป็น Number ก่อนเพราะบน URL มาเป็น String)
    const category = await categoryService.getCategoryById(id);
    return successResponse(category);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, null, error.statusCode);
    }
    return errorResponse("Internal server error", null, 500);
  }
}

// เมธอด PATCH สำหรับอัปเดตข้อมูลหมวดหมู่ (ทำไมใช้ PATCH? เพราะไม่ได้อัปเดตทุกฟิลด์พร้อมกันแบบ PUT)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    if (isNaN(id)) return errorResponse("Invalid ID format", null, 400);

    // 1. ตรวจสอบข้อมูลว่าถูกต้องมั้ย? โดยใช้ updateCategorySchema (ไม่ต้องส่งทุกฟิลด์)
    const { data, errorResponse: errRes } = await validateRequest(updateCategorySchema, req);
    if (errRes) return errRes; // ถ้าข้อมูลผิดก็หยุดเลย

    // 2. เรียก Service ให้ไปจัดการอัปเดต
    const category = await categoryService.updateCategory(id, data!);
    return successResponse(category);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, null, error.statusCode);
    }
    return errorResponse("Internal server error", null, 500);
  }
}

// เมธอด DELETE สำหรับลบหมวดหมู่
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    if (isNaN(id)) return errorResponse("Invalid ID format", null, 400);

    // สั่ง Service ไปลบ
    await categoryService.deleteCategory(id);
    // ส่งค่า null กลับไปเพื่อบอกว่าลบเสร็จแล้ว ไม่มีข้อมูลให้ดูแล้ว
    return successResponse(null);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, null, error.statusCode);
    }
    return errorResponse("Internal server error", null, 500);
  }
}
