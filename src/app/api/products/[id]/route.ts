import { productService } from "@/features/products/product.service";
import { updateProductSchema } from "@/features/products/product.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { validateRequest } from "@/lib/validate";
import { ApiError } from "@/lib/errors";

// เมธอด GET สำหรับดูข้อมูลสินค้าเจาะจง 1 ชิ้น
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const product = await productService.getProductById(Number(params.id));
    return successResponse(product);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, null, error.statusCode);
    }
    return errorResponse("Internal server error", null, 500);
  }
}

// เมธอด PATCH สำหรับอัปเดตข้อมูลสินค้าบางส่วน
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    // 1. ให้ Zod ตรวจข้อมูลก่อน (อนุญาตให้ส่งมาแค่บางฟิลด์ได้)
    const { data, errorResponse: errRes } = await validateRequest(updateProductSchema, req);
    if (errRes) return errRes;

    // 2. เรียก Service ไปอัปเดตข้อมูล
    const product = await productService.updateProduct(Number(params.id), data!);
    return successResponse(product);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, null, error.statusCode);
    }
    return errorResponse("Internal server error", null, 500);
  }
}

// เมธอด DELETE สำหรับลบสินค้า
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    // สั่งลบ
    await productService.deleteProduct(Number(params.id));
    return successResponse(null);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, null, error.statusCode);
    }
    return errorResponse("Internal server error", null, 500);
  }
}
