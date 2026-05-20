import { NextResponse } from "next/server";

// ฟังก์ชัน helper สำหรับสร้าง Response กรณีที่ทำงานสำเร็จ (Success)
// รับข้อมูล (data) และ HTTP Status (ค่าเริ่มต้นคือ 200 OK)
export function successResponse(data: unknown, status = 200) {
  return NextResponse.json(
    {
      success: true, // บอก Client ว่าทำงานสำเร็จ
      data, // ส่งข้อมูลกลับไป
    },
    { status }
  );
}

// ฟังก์ชัน helper สำหรับสร้าง Response กรณีเกิดข้อผิดพลาด (Error)
// รับข้อความแจ้งเตือน (message), รายละเอียดข้อผิดพลาด (errors), และ HTTP Status (ค่าเริ่มต้นคือ 400 Bad Request)
export function errorResponse(message: string, errors: unknown = null, status = 400) {
  return NextResponse.json(
    {
      success: false, // บอก Client ว่าทำงานล้มเหลว
      message, // ข้อความหลักอธิบายข้อผิดพลาด
      errors, // รายละเอียดเชิงลึก (เช่น ฟิลด์ไหนดันกรอกผิด)
    },
    { status }
  );
}
