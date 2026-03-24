-- ============================================================
-- Bhartiya Hindu Temple Gurukul Portal — Database Schema DDL
-- Generated: 2026-03-24
-- Database: PostgreSQL
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────

-- (No custom extensions required; standard PostgreSQL types used)

-- ─── Enum Types ──────────────────────────────────────────────────────────────

CREATE TYPE attendance_status AS ENUM (
  'Present',
  'Absent',
  'Late'
);

CREATE TYPE course_level_status AS ENUM (
  'Active',
  'Inactive'
);

CREATE TYPE enrollment_status AS ENUM (
  'Enrolled',
  'Completed',
  'Withdrawn'
);

CREATE TYPE notification_priority AS ENUM (
  'High',
  'Normal',
  'Low'
);

CREATE TYPE notification_status AS ENUM (
  'Draft',
  'Published',
  'Sent'
);

CREATE TYPE payment_status AS ENUM (
  'Paid',
  'Pending',
  'Overdue'
);

CREATE TYPE portal_user_role AS ENUM (
  'teacher',
  'assistant'
);

CREATE TYPE portal_user_status AS ENUM (
  'active',
  'inactive'
);

CREATE TYPE teacher_status AS ENUM (
  'Active',
  'Inactive'
);

CREATE TYPE weekly_update_status AS ENUM (
  'Draft',
  'Published'
);

-- ─── Tables ──────────────────────────────────────────────────────────────────

-- Members (temple membership directory — used for Parent Portal verification)
CREATE TABLE members (
  id                 SERIAL PRIMARY KEY,
  name               TEXT,
  email              TEXT,
  phone              TEXT,
  membership_year    INTEGER,
  is_existing_member BOOLEAN DEFAULT false,
  policy_agreed      BOOLEAN DEFAULT false,
  created_at         TIMESTAMP DEFAULT now()
);

-- Courses
CREATE TABLE courses (
  id              SERIAL PRIMARY KEY,
  name            TEXT     NOT NULL,
  description     TEXT     NOT NULL,
  age_group       TEXT     NOT NULL,
  level           TEXT     NOT NULL,
  schedule        TEXT     NOT NULL,
  instructor      TEXT     NOT NULL,
  icon            TEXT     NOT NULL DEFAULT '📚',
  learning_areas  TEXT,
  levels_detail   TEXT,
  outcome         TEXT,
  curriculum_year TEXT,
  archived_at     TIMESTAMP,
  created_at      TIMESTAMP DEFAULT now()
);

-- Course Levels (classes within a course, e.g. Level 1, Level 2)
CREATE TABLE course_levels (
  id           SERIAL PRIMARY KEY,
  course_id    INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  level_number INTEGER NOT NULL,
  class_name   TEXT    NOT NULL,
  schedule     TEXT,
  capacity     INTEGER NOT NULL DEFAULT 20,
  enrolled     INTEGER NOT NULL DEFAULT 0,
  status       course_level_status NOT NULL DEFAULT 'Active',
  created_at   TIMESTAMP DEFAULT now()
);

-- Course Sections (sub-groups within a level, e.g. Section A, Section B)
CREATE TABLE course_sections (
  id              SERIAL PRIMARY KEY,
  course_level_id INTEGER NOT NULL REFERENCES course_levels(id) ON DELETE CASCADE,
  section_name    TEXT    NOT NULL,
  schedule        TEXT,
  capacity        INTEGER NOT NULL DEFAULT 20,
  status          course_level_status NOT NULL DEFAULT 'Active',
  created_at      TIMESTAMP DEFAULT now()
);

-- Teachers
CREATE TABLE teachers (
  id         SERIAL PRIMARY KEY,
  name       TEXT          NOT NULL,
  email      TEXT          NOT NULL UNIQUE,
  phone      TEXT,
  bio        TEXT,
  category   TEXT          NOT NULL DEFAULT 'Senior Teacher',
  status     teacher_status NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT now()
);

-- Teacher Assignments (which teacher teaches which course/level/section)
CREATE TABLE teacher_assignments (
  id                   SERIAL PRIMARY KEY,
  teacher_id           INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  course_id            INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  section_id           INTEGER REFERENCES course_sections(id) ON DELETE SET NULL,
  assistant_teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
  level_from           INTEGER NOT NULL DEFAULT 1,
  level_to             INTEGER NOT NULL DEFAULT 7,
  timing               TEXT,
  created_at           TIMESTAMP DEFAULT now()
);

-- Section Assignments (teacher-to-section mapping for attendance scoping)
CREATE TABLE section_assignments (
  id         SERIAL PRIMARY KEY,
  section_id INTEGER NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
  teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  role       TEXT    NOT NULL DEFAULT 'Teacher',
  created_at TIMESTAMP DEFAULT now()
);

-- Students
CREATE TABLE students (
  id               SERIAL PRIMARY KEY,
  student_code     TEXT UNIQUE NOT NULL,
  name             TEXT NOT NULL,
  dob              TEXT,
  grade            TEXT,
  is_new_student   BOOLEAN DEFAULT true,
  member_id        INTEGER REFERENCES members(id),
  mother_name      TEXT,
  mother_phone     TEXT,
  mother_email     TEXT,
  mother_employer  TEXT,
  father_name      TEXT,
  father_phone     TEXT,
  father_email     TEXT,
  father_employer  TEXT,
  address          TEXT,
  volunteer_parent BOOLEAN DEFAULT false,
  volunteer_area   TEXT,
  curriculum_year  TEXT,
  created_at       TIMESTAMP DEFAULT now()
);

-- Enrollments (student enrolled in a specific course level and optional section)
CREATE TABLE enrollments (
  id              SERIAL PRIMARY KEY,
  student_id      INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_level_id INTEGER NOT NULL REFERENCES course_levels(id) ON DELETE RESTRICT,
  section_id      INTEGER REFERENCES course_sections(id) ON DELETE SET NULL,
  enroll_date     TEXT    NOT NULL,
  status          enrollment_status NOT NULL DEFAULT 'Enrolled',
  created_at      TIMESTAMP DEFAULT now(),
  CONSTRAINT enrollment_student_level_uniq UNIQUE (student_id, course_level_id)
);

-- Payments (one payment record per enrollment)
CREATE TABLE payments (
  id              SERIAL PRIMARY KEY,
  enrollment_id   INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE UNIQUE,
  amount_due      NUMERIC NOT NULL DEFAULT 150.00,
  amount_paid     NUMERIC NOT NULL DEFAULT 0.00,
  payment_status  payment_status NOT NULL DEFAULT 'Pending',
  payment_method  TEXT,
  receipt_id      TEXT,
  payment_date    TEXT,
  created_at      TIMESTAMP DEFAULT now()
);

-- Attendance Records
CREATE TABLE attendance_records (
  id              SERIAL PRIMARY KEY,
  course_level_id INTEGER NOT NULL REFERENCES course_levels(id) ON DELETE CASCADE,
  student_id      INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date            TEXT    NOT NULL,
  status          attendance_status NOT NULL,
  recorded_by     TEXT    NOT NULL,
  created_at      TIMESTAMP DEFAULT now()
);

-- Weekly Updates (teacher posts for parents)
CREATE TABLE weekly_updates (
  id              SERIAL PRIMARY KEY,
  course_id       INTEGER REFERENCES courses(id) ON DELETE SET NULL,
  course_name     TEXT    NOT NULL,
  level_id        INTEGER REFERENCES course_levels(id) ON DELETE SET NULL,
  level_name      TEXT    NOT NULL,
  section_id      INTEGER REFERENCES course_sections(id) ON DELETE SET NULL,
  section_name    TEXT    NOT NULL DEFAULT '',
  week_start      TEXT    NOT NULL,
  week_end        TEXT    NOT NULL,
  title           TEXT    NOT NULL,
  content         TEXT    NOT NULL,
  topics_covered  TEXT,
  homework        TEXT,
  upcoming_plan   TEXT,
  reminders       TEXT,
  attachment_link TEXT,
  priority        notification_priority NOT NULL DEFAULT 'Normal',
  status          weekly_update_status  NOT NULL DEFAULT 'Draft',
  teacher_name    TEXT    NOT NULL,
  created_by      TEXT    NOT NULL,
  published_at    TIMESTAMP,
  created_at      TIMESTAMP DEFAULT now(),
  updated_at      TIMESTAMP DEFAULT now()
);

-- Parent Notifications (legacy — retained for schema completeness, not actively used)
CREATE TABLE parent_notifications (
  id           SERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  message      TEXT NOT NULL,
  course_id    INTEGER REFERENCES courses(id) ON DELETE SET NULL,
  course_name  TEXT,
  audience     TEXT NOT NULL DEFAULT 'All Students',
  priority     notification_priority NOT NULL DEFAULT 'Normal',
  status       notification_status   NOT NULL DEFAULT 'Draft',
  created_by   TEXT NOT NULL,
  created_at   TIMESTAMP DEFAULT now(),
  published_at TIMESTAMP
);

-- Announcements
CREATE TABLE announcements (
  id          SERIAL PRIMARY KEY,
  title       TEXT    NOT NULL,
  content     TEXT    NOT NULL,
  date        TEXT    NOT NULL,
  category    TEXT    NOT NULL DEFAULT 'General',
  is_urgent   BOOLEAN NOT NULL DEFAULT false,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  expiry_date TEXT,
  created_at  TIMESTAMP DEFAULT now()
);

-- Events
CREATE TABLE events (
  id           SERIAL PRIMARY KEY,
  title        TEXT    NOT NULL,
  description  TEXT    NOT NULL,
  date         TEXT    NOT NULL,
  time         TEXT    NOT NULL,
  location     TEXT    NOT NULL,
  category     TEXT    NOT NULL DEFAULT 'General',
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMP DEFAULT now()
);

-- Testimonials
CREATE TABLE testimonials (
  id           SERIAL PRIMARY KEY,
  name         TEXT    NOT NULL,
  detail       TEXT    NOT NULL,
  quote        TEXT    NOT NULL,
  avatar_color TEXT    NOT NULL DEFAULT 'bg-orange-500',
  is_active    BOOLEAN NOT NULL DEFAULT true,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMP DEFAULT now()
);

-- Inventory
CREATE TABLE inventory (
  id                  SERIAL PRIMARY KEY,
  name                TEXT    NOT NULL,
  category            TEXT    NOT NULL,
  date_procured       TEXT,
  quantity_procured   INTEGER NOT NULL DEFAULT 0,
  current_stock       INTEGER NOT NULL DEFAULT 0,
  reorder_level       INTEGER NOT NULL DEFAULT 5,
  last_replenishment  TEXT,
  vendor              TEXT,
  remarks             TEXT,
  created_at          TIMESTAMP DEFAULT now()
);

-- Contact / Inquiry Form Submissions
CREATE TABLE contacts (
  id              SERIAL PRIMARY KEY,
  sender_name     TEXT,
  sender_email    TEXT,
  sender_phone    TEXT,
  mother_name     TEXT,
  mother_phone    TEXT,
  mother_email    TEXT,
  father_name     TEXT,
  father_phone    TEXT,
  father_email    TEXT,
  child_name      TEXT,
  child_age       INTEGER,
  course_interest TEXT,
  message         TEXT,
  is_read         BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMP DEFAULT now()
);

-- Email Logs (blast email audit trail)
CREATE TABLE email_logs (
  id                SERIAL PRIMARY KEY,
  subject           TEXT    NOT NULL,
  body              TEXT    NOT NULL,
  recipient_count   INTEGER NOT NULL DEFAULT 0,
  recipient_emails  TEXT    NOT NULL DEFAULT '',
  filter_course     TEXT,
  filter_curric_year TEXT,
  filter_employer   TEXT,
  sent_by           TEXT,
  status            TEXT    NOT NULL DEFAULT 'sent',
  sent_at           TIMESTAMP DEFAULT now()
);

-- Portal Settings (key-value store for admin-configurable settings)
CREATE TABLE portal_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT now()
);

-- Portal Users (teachers and assistants who log in with phone + PIN)
CREATE TABLE portal_users (
  id             SERIAL PRIMARY KEY,
  name           TEXT               NOT NULL,
  phone          TEXT               NOT NULL UNIQUE,
  pin_hash       TEXT               NOT NULL,
  role           portal_user_role   NOT NULL DEFAULT 'teacher',
  status         portal_user_status NOT NULL DEFAULT 'active',
  login_attempts INTEGER            NOT NULL DEFAULT 0,
  locked_until   TIMESTAMP,
  created_at     TIMESTAMP          NOT NULL DEFAULT now(),
  updated_at     TIMESTAMP          NOT NULL DEFAULT now()
);

-- ─── Additional Indexes ───────────────────────────────────────────────────────

-- Composite unique index: one enrollment per student per level
-- (already expressed as UNIQUE constraint above; explicit index for clarity)
CREATE UNIQUE INDEX IF NOT EXISTS enrollment_student_level_uniq
  ON enrollments (student_id, course_level_id);
