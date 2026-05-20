<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Mini Inventory API - Agent Instructions

## Tech Stack
- Framework: Next.js (App Router, API Routes)
- ORM: Drizzle ORM + Drizzle Kit
- Database: MariaDB
- Validation: Zod

## Project Structure
- `src/app/api/`: Only for Next.js API Route Handlers. Keep logic minimal here.
- `src/features/`: Core business logic grouped by domain (e.g., `categories`, `products`).
  - `*.schema.ts`: Zod validation schemas.
  - `*.repository.ts`: Database interactions (Drizzle queries).
  - `*.service.ts`: Business logic and error throwing.
- `src/db/`: Database configuration and schema.
- `src/lib/`: Reusable utilities (e.g., `api-response.ts`, `errors.ts`, `validate.ts`).

## Coding Conventions
1. **API Responses**: ALWAYS use `successResponse(data)` and `errorResponse(message, errors, status)` from `src/lib/api-response.ts`.
2. **Error Handling**: Throw `ApiError` or `NotFoundError` from `src/lib/errors.ts` within services. API routes should catch these and return them using `errorResponse`.
3. **Validation**: Use the `validateRequest` utility in API routes to parse and validate incoming JSON bodies with Zod schemas.
4. **Typing**: Avoid using `any`. Use `unknown` or strictly infer types from Drizzle schema (e.g., `typeof table.$inferInsert` or `Partial<...>`).

## Database Rules
- Schema definition is at `src/db/schema.ts`.
- Database client uses `mysql2/promise` and Drizzle.
- Use `npm run db:push` to sync the database schema during development.
