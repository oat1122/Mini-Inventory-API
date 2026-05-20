# Mini Inventory API

ระบบ REST API สำหรับจัดการสินค้าคงคลัง (Inventory Management) ที่สร้างด้วย **Next.js App Router**, **Drizzle ORM** และ **MariaDB** พร้อมระบบ Authentication ด้วย **NextAuth.js v5**

---

## สารบัญ

- [Features](#features)
- [Tech Stack](#tech-stack)
- [โครงสร้างโปรเจค](#โครงสร้างโปรเจค)
- [Database Schema](#database-schema)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [การติดตั้งและรันโปรเจค](#การติดตั้งและรันโปรเจค)
- [Environment Variables](#environment-variables)
- [NPM Scripts](#npm-scripts)

---

## Features

- **Authentication** — สมัครสมาชิก (Register) และ Login ด้วย Email/Password ผ่าน JWT Session
- **Role-based Authorization** — แยกสิทธิ์ระหว่าง `user` และ `admin`
  - `user` แก้ไข/ลบได้เฉพาะสินค้าของตัวเอง
  - `admin` แก้ไข/ลบสินค้าของทุกคนได้
- **Categories CRUD** — จัดการหมวดหมู่สินค้า (สร้าง, อ่าน, แก้ไข, ลบ)
- **Products CRUD** — จัดการสินค้า (สร้าง, อ่าน, แก้ไข, ลบ)
- **Pagination & Filtering** — แบ่งหน้าและกรองสินค้าด้วย query params
- **Search** — ค้นหาสินค้าด้วยชื่อแบบ full-text LIKE
- **Input Validation** — ตรวจสอบข้อมูล Request ด้วย Zod ทุก endpoint
- **Consistent API Response** — ทุก endpoint ส่ง response รูปแบบเดียวกัน
- **Referential Integrity** — ป้องกันลบ Category ที่ยังมีสินค้าผูกอยู่ (HTTP 409)

---

## Tech Stack

| ส่วน | เทคโนโลยี | เวอร์ชัน |
|------|-----------|---------|
| Framework | [Next.js](https://nextjs.org/) (App Router) | 16.2.6 |
| Language | TypeScript | ^5 |
| ORM | [Drizzle ORM](https://orm.drizzle.team/) | ^0.45.2 |
| Database | MariaDB / MySQL | — |
| Authentication | [NextAuth.js](https://authjs.dev/) v5 Beta | ^5.0.0-beta.31 |
| Validation | [Zod](https://zod.dev/) | ^4.4.3 |
| Password Hashing | bcryptjs | ^3.0.3 |
| DB Driver | mysql2 | ^3.22.3 |
| Styling | Tailwind CSS | ^4 |

---

## โครงสร้างโปรเจค

```
mini-inventory-api/
├── src/
│   ├── app/
│   │   └── api/                         # Next.js Route Handlers (API Layer)
│   │       ├── auth/
│   │       │   └── [...nextauth]/       # NextAuth.js catch-all route
│   │       ├── register/
│   │       │   └── route.ts             # POST /api/register
│   │       ├── categories/
│   │       │   ├── route.ts             # GET, POST /api/categories
│   │       │   └── [id]/
│   │       │       └── route.ts         # GET, PATCH, DELETE /api/categories/:id
│   │       └── products/
│   │           ├── route.ts             # GET, POST /api/products
│   │           └── [id]/
│   │               └── route.ts         # GET, PATCH, DELETE /api/products/:id
│   │
│   ├── features/                        # Business Logic (Feature-based)
│   │   ├── categories/
│   │   │   ├── category.schema.ts       # Zod validation schemas
│   │   │   ├── category.repository.ts   # Database queries (Drizzle)
│   │   │   └── category.service.ts      # Business logic
│   │   └── products/
│   │       ├── product.schema.ts        # Zod validation schemas
│   │       ├── product.repository.ts    # Database queries (Drizzle)
│   │       └── product.service.ts       # Business logic
│   │
│   ├── db/
│   │   ├── client.ts                    # Drizzle + MySQL2 connection pool
│   │   ├── schema.ts                    # Database table definitions
│   │   └── migrations/                  # Auto-generated SQL migrations
│   │
│   ├── lib/
│   │   ├── api-response.ts              # successResponse / errorResponse helpers
│   │   ├── errors.ts                    # Custom error classes (ApiError, NotFoundError)
│   │   └── validate.ts                  # validateRequest() Zod helper
│   │
│   └── auth.ts                          # NextAuth.js configuration
│
├── drizzle.config.ts                    # Drizzle Kit configuration
├── next.config.ts                       # Next.js configuration
├── package.json
└── .env                                 # Environment variables
```

---

## Database Schema

โปรเจคนี้มี 3 ตารางหลัก:

### `user` — ผู้ใช้งาน
| Column | Type | คำอธิบาย |
|--------|------|---------|
| `id` | varchar(255) PK | UUID สร้างอัตโนมัติ |
| `name` | varchar(255) | ชื่อผู้ใช้ |
| `email` | varchar(255) UNIQUE | อีเมล |
| `emailVerified` | timestamp | วันที่ยืนยัน email (ถ้ามี) |
| `image` | varchar(255) | URL รูปโปรไฟล์ |
| `password` | varchar(255) | รหัสผ่านที่ hash แล้ว (bcrypt) |
| `role` | varchar(50) | สิทธิ์ผู้ใช้ (`user` / `admin`) ค่าเริ่มต้น `user` |
| `created_at` | timestamp | วันที่สร้าง |
| `updated_at` | timestamp | วันที่อัปเดตล่าสุด |

### `categories` — หมวดหมู่สินค้า
| Column | Type | คำอธิบาย |
|--------|------|---------|
| `id` | serial PK (auto-increment) | รหัสหมวดหมู่ |
| `name` | varchar(255) | ชื่อหมวดหมู่ |
| `created_at` | timestamp | วันที่สร้าง |
| `updated_at` | timestamp | วันที่อัปเดตล่าสุด |

### `products` — สินค้า
| Column | Type | คำอธิบาย |
|--------|------|---------|
| `id` | serial PK (auto-increment) | รหัสสินค้า |
| `name` | varchar(255) | ชื่อสินค้า |
| `description` | text | รายละเอียด (optional) |
| `price` | decimal(10,2) | ราคา |
| `stock` | int | จำนวนสต๊อก (ค่าเริ่มต้น 0) |
| `category_id` | int FK → categories.id | หมวดหมู่ของสินค้า |
| `user_id` | varchar(255) FK → user.id | เจ้าของสินค้า (cascade delete) |
| `created_at` | timestamp | วันที่สร้าง |
| `updated_at` | timestamp | วันที่อัปเดตล่าสุด |

**Relations:**
- `user` → `products` : One-to-Many (ผู้ใช้ 1 คนมีได้หลายสินค้า)
- `categories` → `products` : One-to-Many (หมวดหมู่ 1 หมวดมีได้หลายสินค้า)
- ถ้า User ถูกลบ → สินค้าที่เป็นของ user นั้นถูกลบตาม (`onDelete: cascade`)
- ถ้า Category ยังมีสินค้าอยู่ → ลบ Category ไม่ได้ (จะ return HTTP 409)

---

## Architecture

โปรเจคนี้ใช้สถาปัตยกรรมแบบ **Layered Architecture** โดยแบ่งความรับผิดชอบออกเป็น 3 ชั้น:

```
Request → [Route Handler] → [Service] → [Repository] → Database
                                 ↓
                         Business Logic,
                         Authorization,
                         Error Handling
```

### 1. Route Handler (`src/app/api/`)
- รับ HTTP Request และแปลงข้อมูล
- ใช้ `validateRequest()` ตรวจสอบ request body
- ส่งต่อไปให้ Service ทำงาน
- จัดการ error และส่ง response กลับ
- **ไม่ควรมี business logic ใดๆ ใน layer นี้**

### 2. Service (`*.service.ts`)
- Business Logic ทั้งหมดอยู่ที่นี่
- ตรวจสอบสิทธิ์ (Authorization)
- Validate เงื่อนไขทางธุรกิจ (เช่น เช็คว่า category มีอยู่จริงก่อนสร้างสินค้า)
- Throw `ApiError` หรือ `NotFoundError` เมื่อเกิดข้อผิดพลาด

### 3. Repository (`*.repository.ts`)
- คุยกับ Database โดยตรงผ่าน Drizzle ORM
- ทำหน้าที่แค่ query ข้อมูล ไม่มี business logic
- จัดการ database-level errors (เช่น Foreign Key Constraint)

### Utility Libraries (`src/lib/`)
| ไฟล์ | หน้าที่ |
|------|--------|
| `api-response.ts` | `successResponse(data, status?)` / `errorResponse(message, errors?, status?)` |
| `errors.ts` | `ApiError(message, statusCode, errors?)` / `NotFoundError(message?)` |
| `validate.ts` | `validateRequest(schema, req)` — parse + validate JSON body ด้วย Zod |

---

## API Reference

### รูปแบบ Response

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": { "fieldName": ["Validation error"] }
}
```

---

### Authentication

#### `POST /api/register` — สมัครสมาชิก
> ไม่ต้องใช้ Token

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Cases:**
| Status | เหตุการณ์ |
|--------|---------|
| 400 | Validation failed (ข้อมูลไม่ครบหรือผิดรูปแบบ) |
| 409 | Email นี้มีในระบบแล้ว |

---

#### `POST /api/auth/signin` — Login (NextAuth.js)
> จัดการโดย NextAuth.js ผ่าน CredentialsProvider

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

ใช้ได้กับ NextAuth.js client-side (`signIn("credentials", {...})`) หรือเรียก endpoint โดยตรงตาม NextAuth.js convention

---

### Categories

#### `GET /api/categories` — ดูหมวดหมู่ทั้งหมด
> ไม่ต้อง Login

**Response `200`:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Electronics", "created_at": "...", "updated_at": "..." },
    { "id": 2, "name": "Clothing", "created_at": "...", "updated_at": "..." }
  ]
}
```

---

#### `POST /api/categories` — สร้างหมวดหมู่ใหม่
> ไม่ต้อง Login (ในเวอร์ชันนี้)

**Request Body:**
```json
{
  "name": "Electronics"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": { "id": 1, "name": "Electronics", "created_at": "...", "updated_at": "..." }
}
```

---

#### `GET /api/categories/:id` — ดูหมวดหมู่ตาม ID
**Response `200`:** ข้อมูลหมวดหมู่เดียว  
**Error `404`:** ไม่พบหมวดหมู่

---

#### `PATCH /api/categories/:id` — แก้ไขหมวดหมู่
**Request Body:** (ส่งมาแค่ฟิลด์ที่ต้องการแก้ไข)
```json
{
  "name": "New Category Name"
}
```

**Error Cases:**
| Status | เหตุการณ์ |
|--------|---------|
| 400 | ไม่ได้ส่งข้อมูลมาเลย |
| 404 | ไม่พบหมวดหมู่ |

---

#### `DELETE /api/categories/:id` — ลบหมวดหมู่
**Response `200`:** `{ "success": true, "data": null }`

**Error Cases:**
| Status | เหตุการณ์ |
|--------|---------|
| 404 | ไม่พบหมวดหมู่ |
| 409 | หมวดหมู่นี้ยังมีสินค้าผูกอยู่ ลบไม่ได้ |

---

### Products

#### `GET /api/products` — ดูสินค้าทั้งหมด (รองรับ Pagination & Filter)
> ไม่ต้อง Login

**Query Parameters:**
| Parameter | Type | Default | คำอธิบาย |
|-----------|------|---------|---------|
| `page` | number | `1` | หน้าที่ต้องการ |
| `limit` | number | `10` | จำนวนรายการต่อหน้า (max 100) |
| `search` | string | — | ค้นหาจากชื่อสินค้า (LIKE) |
| `categoryId` | number | — | กรองตาม category |

**ตัวอย่าง:**
```
GET /api/products?page=2&limit=5&search=laptop&categoryId=1
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "data": [...],
    "meta": {
      "page": 2,
      "limit": 5,
      "total": 42,
      "totalPages": 9
    }
  }
}
```

---

#### `POST /api/products` — สร้างสินค้าใหม่
> **ต้อง Login** — ใช้ JWT Session

**Request Body:**
```json
{
  "name": "MacBook Pro",
  "description": "Apple laptop",
  "price": 59900,
  "stock": 10,
  "categoryId": 1
}
```

> **หมายเหตุ:** `userId` จะถูกดึงจาก Session อัตโนมัติ ไม่ต้องส่งมาจาก client

**Response `201`:** ข้อมูลสินค้าที่สร้างใหม่

**Error Cases:**
| Status | เหตุการณ์ |
|--------|---------|
| 400 | Validation failed |
| 401 | ไม่ได้ Login |
| 400 | `categoryId` ไม่มีในระบบ |

---

#### `GET /api/products/:id` — ดูสินค้าตาม ID
> ไม่ต้อง Login  
**Error `404`:** ไม่พบสินค้า

---

#### `PATCH /api/products/:id` — แก้ไขสินค้า
> **ต้อง Login**  
> `user` แก้ไขได้เฉพาะสินค้าของตัวเอง  
> `admin` แก้ไขสินค้าของทุกคนได้

**Request Body:** (ส่งมาแค่ฟิลด์ที่ต้องการแก้ไข)
```json
{
  "price": 54900,
  "stock": 8
}
```

> **Security:** `userId` จะถูก strip ออกก่อนอัปเดต เพื่อป้องกัน privilege escalation

**Error Cases:**
| Status | เหตุการณ์ |
|--------|---------|
| 401 | ไม่ได้ Login |
| 403 | พยายามแก้ไขสินค้าของคนอื่น (ไม่ใช่ admin) |
| 404 | ไม่พบสินค้า |

---

#### `DELETE /api/products/:id` — ลบสินค้า
> **ต้อง Login**  
> `user` ลบได้เฉพาะสินค้าของตัวเอง  
> `admin` ลบสินค้าของทุกคนได้

**Response `200`:** `{ "success": true, "data": null }`

**Error Cases:**
| Status | เหตุการณ์ |
|--------|---------|
| 401 | ไม่ได้ Login |
| 403 | พยายามลบสินค้าของคนอื่น |
| 404 | ไม่พบสินค้า |

---

## การติดตั้งและรันโปรเจค

### Prerequisites
- **Node.js** >= 18
- **MariaDB** หรือ **MySQL** (รันอยู่ที่ localhost)
- **npm** หรือ **yarn**

### ขั้นตอนการติดตั้ง

**1. Clone repository และติดตั้ง dependencies**
```bash
git clone <repository-url>
cd mini-inventory-api
npm install
```

**2. ตั้งค่า Environment Variables**

คัดลอกไฟล์ `.env` และแก้ไขค่าให้ตรงกับระบบของคุณ:
```bash
cp .env .env.local
```

แก้ไขค่าใน `.env.local`:
```env
DATABASE_URL="mysql://root:your-password@localhost:3306/mini_inventory"
AUTH_SECRET="your-random-secret-string-at-least-32-chars"
NEXTAUTH_URL="http://localhost:3000"
```

**3. สร้างฐานข้อมูล**

เปิด MySQL/MariaDB client แล้วสร้าง database:
```sql
CREATE DATABASE mini_inventory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**4. Sync Database Schema**
```bash
npm run db:push
```
คำสั่งนี้จะสร้างตาราง `user`, `categories`, `products` ให้อัตโนมัติ

**5. รัน Development Server**
```bash
npm run dev
```

เปิด browser ไปที่ `http://localhost:3000`

---

## Environment Variables

| Variable | คำอธิบาย | ตัวอย่าง |
|----------|---------|---------|
| `DATABASE_URL` | MySQL/MariaDB connection string | `mysql://user:pass@localhost:3306/dbname` |
| `AUTH_SECRET` | Secret key สำหรับ NextAuth.js JWT signing (ต้องยาวและสุ่ม) | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL ของ app (สำคัญมากใน production) | `http://localhost:3000` |

> **ห้ามเด็ดขาด**: commit ไฟล์ `.env` ขึ้น Git ในสภาพแวดล้อม production

---

## NPM Scripts

| Script | คำสั่ง | คำอธิบาย |
|--------|--------|---------|
| `dev` | `next dev` | รัน development server พร้อม Hot Reload |
| `build` | `next build` | Build สำหรับ Production |
| `start` | `next start` | รัน production server (ต้อง build ก่อน) |
| `lint` | `eslint` | ตรวจสอบ code style |
| `db:generate` | `drizzle-kit generate` | สร้างไฟล์ migration จาก schema |
| `db:push` | `drizzle-kit push` | Push schema ไปยัง database โดยตรง (Development) |
| `db:studio` | `drizzle-kit studio` | เปิด Drizzle Studio (GUI สำหรับดูข้อมูลใน DB) |

---

## Security Notes

- รหัสผ่านถูก hash ด้วย **bcrypt** (salt rounds: 10) ก่อนบันทึกลง DB เสมอ
- Session ใช้ **JWT strategy** — ไม่มีการเก็บ session ใน DB
- `userId` ถูก inject จาก server-side session เท่านั้น ป้องกันการ spoof จาก client
- Update product มีการ strip `userId` ออกก่อนอัปเดต เพื่อป้องกัน privilege escalation
- Search query มีการ escape wildcard characters (`%`, `_`) ป้องกัน LIKE injection
- Foreign Key Constraints บังคับใช้ที่ระดับ Database เป็น safety net

---

## License

This project is for educational purposes.
