import { productService } from "@/features/products/product.service";
import { createProductSchema } from "@/features/products/product.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { validateRequest } from "@/lib/validate";
import { ApiError } from "@/lib/errors";

// เมธอด GET สำหรับดึงข้อมูลสินค้าทั้งหมด (รองรับการค้นหาและแบ่งหน้า)
export async function GET(req: Request) {
  try {
    // แปลง URL ให้เป็น Object เพื่อให้ดึง Parameter ได้ง่าย
    // เช่น /api/products?page=2&search=apple -> url.searchParams จะได้ page=2, search=apple
    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams.entries()); // แปลงเป็น JSON object
    
    // โยน Parameter (query) ไปให้ Service ค้นหา
    const result = await productService.getProducts(query);
    return successResponse(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, null, error.statusCode);
    }
    return errorResponse("Internal server error", null, 500);
  }
}

// เมธอด POST สำหรับสร้างสินค้าใหม่
export async function POST(req: Request) {
  try {
    // 1. ตรวจสอบความถูกต้องของข้อมูล (Validation) ตาม Schema
    const { data, errorResponse: errRes } = await validateRequest(createProductSchema, req);
    if (errRes) return errRes; // ข้อมูลผิดก็เด้งกลับไปเลย

    // 2. ถ้าข้อมูลผ่านฉลุย ให้เรียก Service มาเซฟลงฐานข้อมูล
    const product = await productService.createProduct(data!);
    return successResponse(product, 201); // 201 Created
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, null, error.statusCode);
    }
    return errorResponse("Internal server error", null, 500);
  }
}
