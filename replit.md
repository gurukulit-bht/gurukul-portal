# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Gurukul Admin Portal

Accessible at `/admin`. Three roles with role-based access control.

**Demo credentials:**
- `admin@gurukul.org` / `Admin@123` → Gurukul Admin (full access)
- `teacher@gurukul.org` / `Teacher@123` → Teacher (Courses, Documents, Attendance, Notifications)
- `assistant@gurukul.org` / `Asst@123` → Assistant (same as Teacher)
- `gurukuluser01` / `gurukuladmin` → backward-compatible legacy admin login

Auth is localStorage-based (demo, structured for AWS Cognito integration). **All admin data is live from PostgreSQL.** Frontend utility: `artifacts/gurukul/src/lib/adminApi.ts`.

### RBAC Files
- `artifacts/gurukul/src/admin/rbac.ts` — role permissions model (admin/teacher/assistant)
- `artifacts/gurukul/src/admin/AuthContext.tsx` — React auth context (wraps AdminApp)
- `artifacts/gurukul/src/admin/auth.ts` — multi-user login + localStorage
- `artifacts/gurukul/src/admin/AdminApp.tsx` — ProtectedRoute with permission checks
- `artifacts/gurukul/src/admin/AdminLayout.tsx` — role-filtered sidebar + user badge in header
- `artifacts/gurukul/src/admin/components/AccessDenied.tsx` — shown for unauthorized routes

### Admin Pages
- Dashboard, Announcements, Calendar, **Course Management** (full CRUD), Teacher Assignment, Students & Payments, Inventory, Settings, Role Management — **Admin only**
- Course Documents, Attendance, Parent Notifications, **Courses & Classes (read-only)** — **Admin + Teacher + Assistant**
- Course Management features: create/edit/archive/delete courses; add/remove levels (up to 7); add/edit/delete sections per level; teacher-to-section assignment; section chips visible on level rows

### DB Tables (PostgreSQL, managed by Drizzle ORM)
- `courses` — course master (`archivedAt` column for soft delete)
- `course_levels` — levels 1-7 per course, with class name, schedule, capacity
- `course_sections` — sections within a level (Morning Batch, Section A, etc.); cascades on level delete
- `section_assignments` — teacher↔section assignment with role (Teacher/Assistant); cascades on section delete
- `teacher_assignments` — teacher↔course assignment with level range
- `enrollments` — includes nullable `section_id` FK → `course_sections.id` (onDelete: set null); a student is assigned to the full Course → Level → Section hierarchy
- `attendance_records` — per student per level per date attendance (Present/Absent/Late)
- `parent_notifications` — audience-targeted notifications with Draft/Published/Sent status

### Admin API Routes (`/api/admin/`)
- `GET/POST /teachers` — teacher list with course assignments; `PUT/DELETE /teachers/:id`
- `GET /students` — students joined with enrollments, courses, payments (1 row per enrollment)
- `GET/POST /inventory` — inventory items; `PUT/DELETE /inventory/:id`; `PATCH /inventory/:id/replenish`
- `GET/POST /announcements` — `PUT/DELETE /announcements/:id`; `PATCH /announcements/:id/toggle`
- `GET/POST /events` — `PUT/DELETE /events/:id`
- `GET /courses` — courses with levels, sections, and live enrollment counts (`?includeArchived=true` to include archived)
- `POST /courses` — create course with N levels (auto-generates level rows)
- `PUT /courses/:id` — update course metadata
- `PATCH /courses/:id/archive` — toggle archive (soft delete)
- `DELETE /courses/:id` — delete course (blocked if enrolled students exist)
- `POST /courses/:id/levels` — add a level; `PUT /courses/levels/:id` — update; `DELETE /courses/levels/:id` — remove
- `GET /courses/levels/:id/sections` — list sections; `POST /courses/levels/:id/sections` — add section
- `PUT /courses/sections/:id` — update section; `DELETE /courses/sections/:id` — remove section
- `POST /courses/sections/:id/assign` — assign teacher to section; `DELETE /courses/sections/:id/unassign/:teacherId`
- `GET /courses/levels/:id/students` — enrolled students for a level; supports `?sectionId=X` to filter to a specific section
- `GET /attendance/levels` — all course levels with course names (for Attendance dropdown)
- `GET /attendance?levelId&date` — records for one level+date
- `GET /attendance/history?levelId` — full history for a level
- `POST /attendance` — upsert attendance records (delete+insert for levelId+date)
- `GET/POST /notifications` — parent notifications
- `PATCH /notifications/:id/status` — update notification status

### DB Schema (`lib/db/src/schema/gurukul.ts`)
Tables: courses, course_levels, teachers, teacher_assignments, students, enrollments, payments, inventory, announcements, events, contacts, attendance_records, parent_notifications.
Enums: teacher_status, course_level_status, enrollment_status, payment_status, attendance_status, notification_status, notification_priority.

Push schema: `cd lib/db && pnpm run push-force`.

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
