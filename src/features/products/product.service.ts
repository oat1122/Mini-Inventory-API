/**
 * product.service.ts — Business Logic ของสินค้า (Product)
 *
 * Service Layer คือชั้นกลางระหว่าง Route Handler (Controller) กับ Repository (Database)
 * หน้าที่หลักของ Service:
 * 1. ตรวจสอบเงื่อนไขทางธุรกิจ (เช่น category ต้องมีอยู่จริง, user ต้องมีสิทธิ์)
 * 2. โยน Error ที่มีความหมาย (NotFoundError, ApiError) แทนที่จะปล่อยให้ DB Error หลุดออกไป
 * 3. ประกอบข้อมูลก่อนส่งคืน (เช่น เพิ่ม meta pagination)
 *
 * สิ่งที่ Service ไม่ทำ: เขียน SQL Query โดยตรง — นั่นเป็นหน้าที่ของ Repository
 */

import { productRepository } from "./product.repository";
import { categoryService } from "../categories/category.service";
import { NotFoundError, ApiError } from "@/lib/errors";
import { products } from "@/db/schema";

// Type สำหรับ Query Parameters ที่รับมาจาก URL (?page=1&limit=10&search=...)
type ProductQuery = { page?: number; limit?: number; search?: string; categoryId?: number };

// Type ของข้อมูลที่ต้องการตอน Insert — Drizzle อนุมาน (infer) จาก Schema โดยอัตโนมัติ
// ทำให้ Type ของโค้ดตรงกับ Type ในฐานข้อมูลเสมอ ลดโอกาสเกิด Bug
type NewProduct = typeof products.$inferInsert;

// Type ของข้อมูลที่ต้องการตอน Update — Partial แปลว่าทุกฟิลด์เป็น Optional (ส่งมาบางส่วนก็ได้)
type UpdateProduct = Partial<NewProduct>;

export class ProductService {

  /**
   * getProducts — ดึงรายการสินค้าพร้อม Pagination และ Filter
   *
   * @param query - พารามิเตอร์จาก URL เช่น ?page=2&limit=5&search=phone&categoryId=1
   * @returns ข้อมูลสินค้า + meta ข้อมูล Pagination
   */
  async getProducts(query: ProductQuery) {
    // กำหนดค่าเริ่มต้นถ้าไม่ได้ส่ง param มา (?? คือ Nullish Coalescing)
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search;
    const categoryId = query.categoryId;

    // ส่งพารามิเตอร์ทั้งหมดให้ Repository ไปจัดการ Query
    const { data, total } = await productRepository.findAndCountAll({ page, limit, search, categoryId });

    // สร้าง Response แบบ Paginated — ข้อมูล data + meta สำหรับ Frontend ใช้แสดงหน้า
    return {
      data,
      meta: {
        page,
        limit,
        total,             // จำนวนสินค้าทั้งหมดที่ตรงกับเงื่อนไข
        totalPages: Math.ceil(total / limit), // ceil = ปัดขึ้น เช่น 21/10 = 2.1 → 3 หน้า
      },
    };
  }

  /**
   * getProductById — ดึงสินค้าตาม ID
   *
   * @param id - ID ของสินค้าที่ต้องการ
   * @throws NotFoundError (404) ถ้าไม่เจอสินค้า
   */
  async getProductById(id: number) {
    const product = await productRepository.findById(id);

    // ถ้า Repository คืน null (ไม่เจอ) ให้โยน NotFoundError
    // Error นี้จะถูก Route Handler จับและแปลงเป็น Response 404 ให้อัตโนมัติ
    if (!product) {
      throw new NotFoundError("Product not found");
    }
    return product;
  }

  /**
   * createProduct — สร้างสินค้าใหม่
   *
   * @param data - ข้อมูลสินค้าจาก Request Body (ผ่าน Zod แล้ว)
   * @param userId - ID ของผู้ใช้ที่ Login อยู่ (ดึงมาจาก JWT Session ไม่ใช่จาก Body)
   * @throws NotFoundError (404) ถ้า category ที่ระบุไม่มีอยู่จริง
   */
  async createProduct(data: NewProduct, userId: string) {
    // ตรวจสอบก่อนว่า categoryId ที่ส่งมามีอยู่ในฐานข้อมูลจริงๆ
    // ถ้าไม่มี getCategoryById จะโยน NotFoundError ให้เองโดยอัตโนมัติ
    // เหตุผลที่ตรวจก่อน: ทำให้ Error Message ชัดเจนกว่าปล่อยให้ DB FK Constraint ทำ
    await categoryService.getCategoryById(data.categoryId);

    // Spread operator (...data) คัดลอกทุกฟิลด์ใน data แล้วเพิ่ม/ทับ userId
    // ทำแบบนี้เพื่อ "ไม่แก้ไข object ที่รับมา" (Immutability)
    // ถ้าเขียน data.userId = userId จะเป็นการ Mutate input ซึ่งเป็น Bad Practice
    return productRepository.create({ ...data, userId });
  }

  /**
   * updateProduct — แก้ไขข้อมูลสินค้า
   *
   * @param id - ID ของสินค้าที่ต้องการแก้ไข
   * @param data - ข้อมูลที่ต้องการอัปเดต (ส่งมาแค่บางฟิลด์ก็ได้)
   * @param userId - ID ของผู้ใช้ที่ Login อยู่ (จาก JWT)
   * @param userRole - บทบาทของผู้ใช้ "admin" หรือ "user" (จาก JWT)
   * @throws ApiError (400) ถ้าไม่ได้ส่งข้อมูลมาเลย
   * @throws NotFoundError (404) ถ้าสินค้าหรือ category ไม่มีอยู่
   * @throws ApiError (403) ถ้า user พยายามแก้ไขสินค้าของคนอื่น
   */
  async updateProduct(id: number, data: UpdateProduct, userId: string, userRole: string) {
    // ป้องกันกรณีส่ง body มาว่างเปล่า {} — Drizzle จะ Error ถ้าไม่มีอะไรให้ update
    if (!data || Object.keys(data).length === 0) {
      throw new ApiError("No data provided to update", 400);
    }

    // ดึงข้อมูลสินค้าปัจจุบันมา (ถ้าไม่เจอจะโยน 404 ให้เอง)
    const product = await this.getProductById(id);

    // ตรวจสอบสิทธิ์: admin แก้ได้ทุกตัว / user ทั่วไปแก้ได้แค่ของตัวเอง
    // product.userId เทียบกับ userId จาก JWT — ถ้าไม่ตรงกันและไม่ใช่ admin ก็ปฏิเสธ
    if (userRole !== "admin" && product.userId !== userId) {
      throw new ApiError("Forbidden: You can only update your own products", 403);
    }

    // ถ้า Request ส่ง categoryId ใหม่มาด้วย ต้องเช็คว่า category นั้นมีอยู่จริงก่อน
    if (data.categoryId) {
      await categoryService.getCategoryById(data.categoryId);
    }

    /**
     * ป้องกัน Privilege Escalation — ดึง userId ออกจาก data ก่อนส่ง update
     *
     * สมมติ client ส่ง { "name": "new name", "userId": "another-user-id" } มา
     * ถ้าไม่ Strip userId ออก Drizzle จะ update userId ของสินค้านั้นไปด้วย
     * นั่นหมายความว่า user คนหนึ่งสามารถ "โอน" สินค้าให้คนอื่นได้ — ซึ่งเป็นช่องโหว่
     *
     * Destructuring: const { userId: _uid, ...safeData } = data
     * _uid รับค่า userId (ที่เราไม่ต้องการ) ส่วน safeData คือข้อมูลที่เหลือโดยไม่มี userId
     * prefix _ หน้าตัวแปรบอก TypeScript ว่า "รู้ว่าไม่ได้ใช้ตัวแปรนี้" (ป้องกัน lint warning)
     */
    const { userId: _uid, ...safeData } = data;

    return productRepository.update(id, safeData);
  }

  /**
   * deleteProduct — ลบสินค้า
   *
   * @param id - ID ของสินค้าที่ต้องการลบ
   * @param userId - ID ของผู้ใช้ที่ Login อยู่ (จาก JWT)
   * @param userRole - บทบาทของผู้ใช้ (จาก JWT)
   * @throws NotFoundError (404) ถ้าสินค้าไม่มีอยู่
   * @throws ApiError (403) ถ้า user พยายามลบสินค้าของคนอื่น
   */
  async deleteProduct(id: number, userId: string, userRole: string) {
    // ดึงข้อมูลสินค้ามาก่อน — ถ้าไม่เจอจะโยน 404 ให้เอง
    const product = await this.getProductById(id);

    // ตรวจสอบสิทธิ์: admin ลบได้ทุกตัว / user ทั่วไปลบได้แค่ของตัวเอง
    if (userRole !== "admin" && product.userId !== userId) {
      throw new ApiError("Forbidden: You can only delete your own products", 403);
    }

    await productRepository.delete(id);
  }
}

// Export เป็น Singleton — สร้าง instance เดียวแล้วใช้ร่วมกันทั้งโปรเจกต์
// ไม่ต้อง new ProductService() ทุกครั้งที่ต้องการใช้
export const productService = new ProductService();
