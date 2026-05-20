## Stack

```txt
Next.js App Router
Next API Route Handler
Drizzle ORM
Drizzle Kit
MariaDB
Zod Validation
bcryptjs ถ้ามี Auth
Postman / Thunder Client
```

---

# โจทย์โปรเจกต์

ให้ทำระบบหลังบ้านจัดการสินค้าแบบ REST API

## Entity หลัก

```txt
users
categories
products
```

## ความสัมพันธ์

```txt
users 1 คน มี products ได้หลายตัว
categories 1 หมวดหมู่ มี products ได้หลายตัว
products ต้องมี owner เป็น user
```

---

# Feature ที่ทำ

## Phase 1: Setup Project

ให้สร้างโปรเจกต์ใหม่

```bash
npx create-next-app@latest mini-inventory-api
```

เลือกประมาณนี้:

```txt
TypeScript: Yes
App Router: Yes
Tailwind: ไม่จำเป็น
src directory: Yes/No ก็ได้
```

ติดตั้ง package:

```bash
npm install drizzle-orm mysql2 zod
npm install -D drizzle-kit
```

---

## Phase 2: Database Config

ให้สร้างไฟล์ประมาณนี้:

```txt
src/db/client.ts
src/db/schema.ts
drizzle.config.ts
.env
```

`.env`

```env
DATABASE_URL="mysql://root:password@localhost:3306/mini_inventory"
```

ตารางที่ควรมี:

```ts
users - id - name - email - role - createdAt - updatedAt;

categories - id - name - createdAt - updatedAt;

products -
  id -
  name -
  description -
  price -
  stock -
  categoryId -
  userId -
  createdAt -
  updatedAt;
```

---

## Phase 3: CRUD Categories

เริ่มจากของง่ายก่อน

```txt
GET    /api/categories
POST   /api/categories
GET    /api/categories/:id
PATCH  /api/categories/:id
DELETE /api/categories/:id
```

Validation ด้วย Zod:

```ts
const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
});
```

เป้าหมายของ Phase นี้เข้าใจเรื่อง:

```txt
Route Handler
Request body
Zod parse
Insert DB
Select DB
Update DB
Delete DB
HTTP status code
```

---

## Phase 4: CRUD Products

หลังจาก categories ได้แล้ว ค่อยเพิ่ม products

```txt
GET    /api/products
POST   /api/products
GET    /api/products/:id
PATCH  /api/products/:id
DELETE /api/products/:id
```

Validation:

```ts
const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  categoryId: z.number().int().positive(),
});
```

ตรงนี้จะได้ฝึก:

```txt
foreign key
validate number
เช็ค category มีจริงไหม
response 404
response 400
```

---

## Phase 5: Search + Pagination

เพิ่ม query string:

```txt
GET /api/products?page=1&limit=10
GET /api/products?search=keyboard
GET /api/products?categoryId=1
```

Response ควรเป็นแบบนี้:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 20,
    "totalPages": 2
  }
}
```

อันนี้สำคัญมาก เพราะ Backend จริงแทบไม่มี API ไหนที่ list ข้อมูลทั้งหมดโดยไม่ paginate

---

## Phase 6: Error Handling กลาง

ทำ response format ให้เหมือนกันทุก endpoint

สำเร็จ:

```json
{
  "success": true,
  "data": {}
}
```

ผิดพลาด:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {}
}
```

แนะนำให้มีไฟล์:

```txt
src/lib/api-response.ts
src/lib/errors.ts
src/lib/validate.ts
```

---

# โครงสร้างโปรเจกต์

```txt
src/
  app/
    api/
      categories/
        route.ts
        [id]/
          route.ts
      products/
        route.ts
        [id]/
          route.ts

  db/
    client.ts
    schema.ts

  features/
    categories/
      category.schema.ts
      category.service.ts
      category.repository.ts

    products/
      product.schema.ts
      product.service.ts
      product.repository.ts

  lib/
    api-response.ts
    errors.ts
    validate.ts
```

อย่าเขียนทุกอย่างใน `route.ts` หมด เพราะจะติดนิสัยโค้ดยาวและแก้ยาก

---

# Assignment ที่ให้ได้เลย

## งานหลัก

```txt
ทำ Mini Inventory API ด้วย Next.js API Route + Drizzle + MariaDB + Zod
```

## Requirements

```txt
1. สร้างฐานข้อมูล MariaDB
2. ใช้ Drizzle Kit generate/migrate schema
3. สร้าง CRUD categories
4. สร้าง CRUD products
5. ใช้ Zod validate ทุก POST/PATCH
6. ใช้ HTTP status code ให้ถูกต้อง
7. ทำ pagination ใน GET /api/products
8. ทำ search product by name
9. เช็ค foreign key categoryId ก่อนสร้าง product
10. ทดสอบทุก endpoint ด้วย Postman
```

## Bonus

```txt
1. เพิ่ม users table
2. product ต้องผูกกับ userId
3. เพิ่ม role admin/user
4. admin ลบ product ได้ทุกตัว
5. user ลบได้เฉพาะ product ตัวเอง
```

---
