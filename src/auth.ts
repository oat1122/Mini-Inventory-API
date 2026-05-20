/**
 * auth.ts — การตั้งค่า Authentication ด้วย NextAuth.js (Auth.js v5)
 *
 * ไฟล์นี้ทำหน้าที่:
 * 1. กำหนดว่าจะใช้วิธีล็อกอินแบบไหน (ในที่นี้ใช้ Email + Password)
 * 2. กำหนดว่า Session จะเก็บข้อมูลอะไรบ้าง (ในที่นี้ใช้ JWT)
 * 3. Export ฟังก์ชัน auth() ออกไปให้ Route Handler เรียกใช้เพื่อตรวจสอบว่า Login หรือยัง
 */

import NextAuth, { DefaultSession } from "next-auth";
import { db } from "@/db/client";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * TypeScript Module Augmentation — ขยาย Type ของ NextAuth ให้รองรับฟิลด์ที่เราเพิ่มเข้ามา
 *
 * โดยปกติ NextAuth ไม่รู้จักฟิลด์ id และ role ใน Session
 * เราต้อง "บอก" TypeScript ว่า Session มีฟิลด์เหล่านี้ด้วย
 * เพื่อให้ session.user.id และ session.user.role ใช้งานได้โดยไม่มี Type Error
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;    // ID ของ User จากฐานข้อมูล
      role: string;  // บทบาท เช่น "admin" หรือ "user"
    } & DefaultSession["user"]; // รวมกับฟิลด์มาตรฐานของ NextAuth (name, email, image)
  }
  interface User {
    role: string; // เพิ่ม role ใน User object ที่ authorize() ส่งคืน
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  /**
   * strategy: "jwt" หมายความว่า Session จะถูกเข้ารหัสและเก็บไว้ในคุกกี้ของ Browser
   * แทนที่จะเก็บไว้ในฐานข้อมูล (ซึ่งต้องมีตาราง sessions)
   *
   * ข้อดีของ JWT:
   * - ไม่ต้อง Query DB ทุกครั้งที่ตรวจสอบ Session → เร็วกว่า
   * - ทำงานได้กับ Credentials Provider (login ด้วย email/password)
   *
   * ข้อควรรู้:
   * - JWT ที่ออกไปแล้วไม่สามารถ "Revoke" ได้ทันที (ต้องรอหมดอายุ)
   * - ข้อมูลใน JWT สามารถ Decode ได้ แต่ Verify/Tamper ไม่ได้ (เซ็นด้วย AUTH_SECRET)
   */
  session: { strategy: "jwt" },

  providers: [
    /**
     * CredentialsProvider — วิธีล็อกอินด้วย Email + Password
     *
     * NextAuth จะเรียกฟังก์ชัน authorize() ทุกครั้งที่ User ส่ง POST /api/auth/callback/credentials
     * หน้าที่ของ authorize คือ:
     *   - ตรวจสอบว่า email/password ถูกต้องไหม
     *   - ถ้าถูก → คืน User object กลับไป
     *   - ถ้าผิด → คืน null กลับไป (NextAuth จะแจ้งว่า Login ล้มเหลว)
     */
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // ตรวจสอบว่ามีข้อมูลส่งมาครบไหม ถ้าไม่มีให้หยุดทันที
        if (!credentials?.email || !credentials?.password) return null;

        // ค้นหา User จากฐานข้อมูลด้วย Email
        // .where(eq(...)) เทียบเท่ากับ SQL: WHERE email = ?
        const userList = await db.select().from(users).where(eq(users.email, credentials.email as string));
        const user = userList[0]; // ดึงแถวแรก (Email ห้ามซ้ำ จึงมีได้แค่ 1 คน)

        // ถ้าหา User ไม่เจอ หรือ User นี้ไม่มีรหัสผ่าน (เช่น สมัครผ่าน OAuth)
        if (!user || !user.password) return null;

        /**
         * bcrypt.compare() เปรียบเทียบรหัสผ่านที่ User ส่งมา กับรหัสผ่านที่ Hash ไว้ในฐานข้อมูล
         * เราไม่สามารถ Decrypt Hash ได้ — bcrypt จะ Hash รหัสผ่านที่ส่งมาด้วย Salt เดิม แล้วเทียบกัน
         * วิธีนี้ปลอดภัยมาก แม้ฐานข้อมูลหลุด ก็ไม่รู้รหัสผ่านจริง
         */
        const isPasswordValid = await bcrypt.compare(credentials.password as string, user.password);
        if (!isPasswordValid) return null;

        // ล็อกอินสำเร็จ — คืน User object ที่มีข้อมูลที่ต้องการ
        // ข้อมูลนี้จะถูกส่งต่อไปยัง jwt callback ด้านล่าง
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    /**
     * jwt callback — ทำงานทุกครั้งที่มีการสร้างหรืออัปเดต JWT Token
     *
     * Parameter:
     * - token: ข้อมูลที่อยู่ใน Token ปัจจุบัน
     * - user: ข้อมูลที่ authorize() ส่งคืนมา (มีค่าแค่ตอน Login ครั้งแรก)
     *
     * เราต้องเพิ่ม id และ role ลงใน token เอง เพราะ NextAuth ไม่ทำให้อัตโนมัติ
     * ค่าเหล่านี้จะถูกเข้ารหัสและเก็บไว้ใน JWT Cookie
     */
    async jwt({ token, user }) {
      if (user) {
        // user มีค่าแค่ตอน Login ครั้งแรก — เพิ่มข้อมูลลง token
        token.id = user.id;
        token.role = user.role;
      }
      return token; // คืน token ที่อัปเดตแล้วกลับไป
    },

    /**
     * session callback — ทำงานทุกครั้งที่มีการเรียก auth() หรือดึงข้อมูล Session
     *
     * Parameter:
     * - session: ข้อมูล Session ที่จะส่งกลับไปให้ Client
     * - token: JWT Token ที่ถอดรหัสแล้ว
     *
     * เราต้อง "ยัด" ข้อมูลจาก token เข้าไปใน session.user
     * เพื่อให้ Route Handler เรียก session.user.id และ session.user.role ได้
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session; // คืน session ที่เพิ่มข้อมูลแล้วกลับไป
    },
  },
});
