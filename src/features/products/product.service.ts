import { productRepository } from "./product.repository";
import { categoryService } from "../categories/category.service";
import { NotFoundError } from "@/lib/errors";
import { products } from "@/db/schema";

type ProductQuery = { page?: string | number; limit?: string | number; search?: string; categoryId?: string | number };
type NewProduct = typeof products.$inferInsert;
type UpdateProduct = Partial<NewProduct>;

// Service Pattern: สำหรับจัดการ Business Logic (ตรรกะทางธุรกิจ) ของสินค้า
export class ProductService {
  
  // ค้นหาสินค้าทั้งหมดแบบแบ่งหน้า
  async getProducts(query: ProductQuery) {
    // กำหนดค่าเริ่มต้น: ถ้าไม่ส่ง page มาให้เป็นหน้า 1, ถ้าไม่ส่ง limit มาให้จำกัด 10 รายการ
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const search = query.search as string | undefined;
    const categoryId = query.categoryId ? Number(query.categoryId) : undefined;

    // ไปดึงข้อมูลมาจาก Repository
    const { data, total } = await productRepository.findAndCountAll({ page, limit, search, categoryId });

    // จัดรูปแบบข้อมูลก่อนส่งคืน (เพิ่ม meta info ว่ามีกี่หน้า กี่รายการ)
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit), // หารปัดเศษขึ้น เพื่อหาจำนวนหน้าทั้งหมด
      },
    };
  }

  // ดูข้อมูลสินค้าตาม ID
  async getProductById(id: number) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new NotFoundError("Product not found");
    }
    return product;
  }

  // เพิ่มสินค้าใหม่
  async createProduct(data: NewProduct) {
    // 1. เช็คก่อนว่าหมวดหมู่ (category) ที่ส่งมามีอยู่จริงมั้ย
    // ถ้าไม่มี categoryService จะพ่น NotFoundError ออกมาให้เอง
    await categoryService.getCategoryById(data.categoryId);
    
    // 2. กำหนดผู้ใช้งานเริ่มต้น (จำลองไปก่อนว่า user id = 1 เป็นคนเพิ่ม)
    if (!data.userId) data.userId = 1;

    // 3. เซฟลงฐานข้อมูล
    return productRepository.create(data);
  }

  // แก้ไขข้อมูลสินค้า
  async updateProduct(id: number, data: UpdateProduct) {
    // 1. เช็คก่อนว่าสินค้านี้มีอยู่จริงมั้ย
    await this.getProductById(id);
    
    // 2. ถ้ามีการส่งหมวดหมู่ใหม่มาอัปเดต ต้องเช็คด้วยว่าหมวดหมู่ใหม่นั้นมีอยู่จริงมั้ย
    if (data.categoryId) {
      await categoryService.getCategoryById(data.categoryId);
    }
    
    // 3. สั่งอัปเดต
    return productRepository.update(id, data);
  }

  // ลบสินค้า
  async deleteProduct(id: number) {
    // เช็คก่อนว่ามีอยู่จริงมั้ย
    await this.getProductById(id);
    // สั่งลบ
    await productRepository.delete(id);
  }
}

export const productService = new ProductService();
