// คลาส Error แบบกำหนดเอง (Custom Error) เพื่อใช้โยนข้อผิดพลาดในระบบ
// การทำแบบนี้จะช่วยให้เราแยกแยะชนิดของ Error ได้ง่ายขึ้น และจัดการ HTTP Status โค้ดได้ง่ายด้วย
export class ApiError extends Error {
  statusCode: number; // เก็บ HTTP Status Code (เช่น 400, 401, 500)
  errors?: unknown; // เก็บรายละเอียดเพิ่มเติมว่าเกิดปัญหาอะไรขึ้น

  constructor(message: string, statusCode = 400, errors?: unknown) {
    super(message); // เรียกใช้ constructor ของ Error ดั้งเดิม
    this.name = "ApiError"; // กำหนดชื่อของ Error
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

// คลาส Error ย่อยที่สืบทอดมาจาก ApiError ใช้เฉพาะตอนที่ "หาข้อมูลไม่เจอ" (Not Found - 404)
export class NotFoundError extends ApiError {
  constructor(message = "Resource not found") {
    // โยน message พร้อมบังคับ Status Code เป็น 404 เสมอ
    super(message, 404);
    this.name = "NotFoundError";
  }
}
