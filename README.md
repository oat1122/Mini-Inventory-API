# Mini Inventory API

API สำหรับจัดการคลังสินค้าขนาดเล็ก (Mini Inventory) พัฒนาด้วย **Next.js (App Router)** สำหรับทำ Backend API โดยออกแบบโครงสร้างโค้ดแบบ **Layered Architecture (Controller -> Service -> Repository)** เพื่อให้อ่านง่าย ขยายต่อได้ และดูแลรักษาง่าย

## Tech Stack

- **Framework**: Next.js 16 (ใช้เฉพาะ API Routes)
- **Database**: MariaDB / MySQL
- **ORM**: Drizzle ORM + Drizzle Kit
- **Validation**: Zod
- **Language**: TypeScript

## Project Structure

โปรเจกต์นี้แบ่งโครงสร้างเพื่อให้แยกส่วนความรับผิดชอบ (Separation of Concerns) อย่างชัดเจน:

```text
src/
├── app/
│   └── api/             # API Controllers (จัดการ Request/Response HTTP)
├── db/                  # การเชื่อมต่อฐานข้อมูลและ Schema (Drizzle)
├── features/            # Business Logic แบ่งตามโดเมน (Products, Categories)
│   ├── categories/      # Repository, Service, Schema ของหมวดหมู่
│   └── products/        # Repository, Service, Schema ของสินค้า
└── lib/                 # โค้ดที่ใช้ร่วมกัน (Utilities, Error Handling, Validation)
```

## Prerequisites (สิ่งที่ต้องมี)

- Node.js (เวอร์ชั่น 20 ขึ้นไป)
- ฐานข้อมูล MariaDB หรือ MySQL
- สร้างไฟล์ `.env` ที่ root ของโปรเจกต์และใส่ค่าการเชื่อมต่อ:
  ```env
  DATABASE_URL="mysql://<user>:<password>@<host>:<port>/<db_name>"
  ```

## Setup & Installation

1. **ติดตั้ง Dependencies:**
   ```bash
   npm install
   ```
2. **อัปเดตโครงสร้างฐานข้อมูล (DB Migration):**
   ```bash
   npm run db:push
   ```
   *(คุณสามารถดูข้อมูลในฐานข้อมูลผ่าน UI ได้ด้วยคำสั่ง `npm run db:studio`)*
3. **รันเซิร์ฟเวอร์โหมด Development:**
   ```bash
   npm run dev
   ```
   *เซิร์ฟเวอร์จะรันที่ `http://localhost:3000`*

## API Endpoints

### Products (สินค้า)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | ดึงรายการสินค้าทั้งหมด (รองรับ Pagination & Search) |
| `GET` | `/api/products/:id` | ดึงข้อมูลสินค้าเจาะจงตาม ID |
| `POST` | `/api/products` | สร้างสินค้าใหม่ |
| `PATCH` | `/api/products/:id` | แก้ไขข้อมูลสินค้า (บางส่วนได้) |
| `DELETE` | `/api/products/:id` | ลบสินค้าตาม ID |

**Query Parameters สำหรับ `GET /api/products`:**
- `page` (number): หน้าที่ต้องการ (ค่าเริ่มต้น: 1)
- `limit` (number): จำนวนต่อหน้า (ค่าเริ่มต้น: 10, สูงสุด: 100)
- `search` (string): ค้นหาสินค้าจากชื่อ
- `categoryId` (number): กรองสินค้าตามหมวดหมู่

**ตัวอย่าง Payload `POST /api/products`:**
```json
{
  "name": "iPhone 16",
  "description": "สมาร์ทโฟนรุ่นใหม่",
  "price": 35000,
  "stock": 10,
  "categoryId": 1,
  "userId": 1
}
```

### Categories (หมวดหมู่สินค้า)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/categories/:id` | ดึงข้อมูลหมวดหมู่เจาะจงตาม ID |
| `PATCH` | `/api/categories/:id` | แก้ไขข้อมูลหมวดหมู่ |
| `DELETE` | `/api/categories/:id` | ลบหมวดหมู่ (ลบไม่ได้หากมีสินค้าผูกอยู่) |

*(หมายเหตุ: API สำหรับ `/api/categories` ควบคุมผ่านโค้ดใน `src/app/api/categories/[id]` เป็นหลัก)*

## Best Practices & Quality

- **Zod Validation**: ดักจับข้อมูลที่ไม่ถูกต้องตั้งแต่ด่านหน้าสุดก่อนเข้าถึง Logic ภายใน
- **Robust Error Handling**: มีการดักจับข้อผิดพลาด Foreign Key Constraint เพื่อไม่ให้แอปพังพ่น 500
- **Singleton DB Pool**: แก้ไขปัญหา Next.js Hot Reload ที่ทำให้ Database Connection เต็ม
- **Async Params**: รองรับ Breaking Change ของ Next.js 15+ ที่บังคับให้ `params` ใน Dynamic Routes ต้องใช้ `await` เสมอ
