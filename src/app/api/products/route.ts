/**
 * app/api/products/route.ts — Route Handler สำหรับ /api/products
 *
 * ไฟล์นี้จัดการ:
 *   GET  /api/products         — ดึงรายการสินค้าทั้งหมด (รองรับ Search + Pagination)
 *   POST /api/products         — สร้างสินค้าใหม่ (ต้องล็อกอินก่อน)
 *
 * Route Handler ทำหน้าที่แค่:
 * 1. รับ Request และ parse ข้อมูล
 * 2. ส่งต่อให้ Service จัดการ Business Logic
 * 3. แปลงผลลัพธ์เป็น HTTP Response
 *
 * ไม่ควรมี Business Logic อยู่ที่นี่เลย
 */

import { productService } from "@/features/products/product.service";
import { createProductSchema, productQuerySchema } from "@/features/products/product.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { validateRequest } from "@/lib/validate";
import { ApiError } from "@/lib/errors";
import { auth } from "@/auth";

/**
 * GET /api/products
 * ดึงรายการสินค้าทั้งหมด — เปิดสาธารณะ ไม่ต้องล็อกอิน
 *
 * Query Parameters (ทั้งหมดเป็น Optional):
 * - ?page=1          หน้าที่ต้องการ (ค่าเริ่มต้น: 1)
 * - ?limit=10        จำนวนต่อหน้า (ค่าเริ่มต้น: 10, สูงสุด: 100)
 * - ?search=phone    ค้นหาจากชื่อสินค้า
 * - ?categoryId=2    กรองตามหมวดหมู่
 */
export async function GET(req: Request) {
  try {
    // new URL(req.url) แปลง URL string ให้เป็น Object ที่เข้าถึง Query Params ได้ง่าย
    // เช่น "/api/products?page=2&search=phone" → url.searchParams.get("page") === "2"
    const url = new URL(req.url);

    // Object.fromEntries() แปลง URLSearchParams เป็น plain object { page: "2", search: "phone" }
    const query = Object.fromEntries(url.searchParams.entries());

    // ตรวจสอบ Query Params ด้วย productQuerySchema
    // safeParse จะไม่ throw Error แต่คืน { success: boolean, data/error }
    const parsedQuery = productQuerySchema.safeParse(query);
    if (!parsedQuery.success) {
      return errorResponse("Invalid query parameters", parsedQuery.error.flatten().fieldErrors, 400);
    }

    // ส่ง Parsed Query ไปให้ Service ดึงข้อมูลพร้อม meta pagination
    const result = await productService.getProducts(parsedQuery.data);
    return successResponse(result);

  } catch (error) {
    // จับ Error ที่ Service หรือ Repository โยนมา
    if (error instanceof ApiError) {
      return errorResponse(error.message, null, error.statusCode);
    }
    return errorResponse("Internal server error", null, 500);
  }
}

/**
 * POST /api/products
 * สร้างสินค้าใหม่ — ต้องล็อกอินก่อน (Protected)
 *
 * Request Body (JSON):
 * {
 *   "name": "iPhone 16",
 *   "description": "สมาร์ทโฟนรุ่นใหม่",
 *   "price": 35000,
 *   "stock": 10,
 *   "categoryId": 1
 * }
 *
 * หมายเหตุ: ไม่ต้องส่ง userId มาใน body — ระบบดึงจาก JWT Token อัตโนมัติ
 */
export async function POST(req: Request) {
  try {
    // ขั้นตอนที่ 1: ตรวจสอบว่าล็อกอินอยู่หรือไม่
    // auth() อ่านและ Verify JWT Token จาก Cookie อัตโนมัติ
    const session = await auth();
    if (!session?.user) {
      // ถ้าไม่มี Session หรือ Token หมดอายุ → 401 Unauthorized
      return errorResponse("Unauthorized", null, 401);
    }

    // ขั้นตอนที่ 2: ตรวจสอบข้อมูลใน Body ด้วย Zod
    const { data, errorResponse: errRes } = await validateRequest(createProductSchema, req);
    if (errRes) return errRes; // ข้อมูลผิด → ส่ง 400 กลับทันที

    // ขั้นตอนที่ 3: ส่งให้ Service สร้างสินค้า พร้อมส่ง userId จาก JWT ไปด้วย
    // ทำแบบนี้เพื่อป้องกัน user ปลอม userId ใน body
    const product = await productService.createProduct(data!, session.user.id);
    return successResponse(product, 201); // 201 Created

  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, null, error.statusCode);
    }
    return errorResponse("Internal server error", null, 500);
  }
}
