import { categoryRepository } from "./category.repository";
import { NotFoundError, ApiError } from "@/lib/errors";

// Service Pattern: ใช้สำหรับเขียน Business Logic (ตรรกะทางธุรกิจ) 
// โดยจะดึงข้อมูลมาจาก Repository อีกทีนึง ทำให้เราตรวจสอบเงื่อนไขก่อนลงฐานข้อมูลได้ง่าย
export class CategoryService {
  
  // เรียกดูหมวดหมู่ทั้งหมด
  async getAllCategories() {
    return categoryRepository.findAll();
  }

  // เรียกดูหมวดหมู่แบบเจาะจง ID
  async getCategoryById(id: number) {
    const category = await categoryRepository.findById(id);
    // ถ้าหาไม่เจอ จะให้โยน Error ชนิด NotFoundError (ซึ่งจะไปแปลงเป็น HTTP Status 404 ทีหลัง)
    if (!category) {
      throw new NotFoundError("Category not found");
    }
    return category;
  }

  // สร้างหมวดหมู่
  async createCategory(data: { name: string }) {
    return categoryRepository.create(data);
  }

  // แก้ไขหมวดหมู่
  async updateCategory(id: number, data: { name?: string }) {
    // เช็คว่ามีข้อมูลส่งมาแก้ไขหรือไม่ เพื่อป้องกัน empty payload ปะทะกับ Drizzle
    if (!data || Object.keys(data).length === 0) {
      throw new ApiError("No data provided to update", 400);
    }

    // เช็คก่อนว่ามีหมวดหมู่นี้อยู่จริงไหม ถ้าไม่มีมันจะ throw NotFoundError จากฟังก์ชัน getCategoryById ทันที
    await this.getCategoryById(id); 
    
    // ถ้ามีอยู่จริง ค่อยสั่งอัปเดต
    return categoryRepository.update(id, data);
  }

  // ลบหมวดหมู่
  async deleteCategory(id: number) {
    // เช็คก่อนว่ามีอยู่จริงไหม
    await this.getCategoryById(id); 
    
    // สั่งลบ (Database constraints จะจัดการเช็คให้ว่ามีสินค้าผูกอยู่หรือไม่)
    await categoryRepository.delete(id);
  }
}

// สร้าง instance ให้เรียกใช้งานได้ง่ายๆ
export const categoryService = new CategoryService();
