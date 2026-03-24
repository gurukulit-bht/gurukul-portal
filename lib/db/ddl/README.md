# Gurukul Portal — Database DDL

This folder contains the PostgreSQL DDL (Data Definition Language) scripts for the Gurukul Portal database.

## Files

| File | Description |
|------|-------------|
| `schema.sql` | Full database schema — all tables, sequences, indexes, and constraints |

## Tables (24 total)

### Core Gurukul
| Table | Purpose |
|-------|---------|
| `courses` | Course catalogue (Hindi, Sanskrit, Dharma, Telugu, Tamil, Gujarati, Music) |
| `course_levels` | Levels within each course (Level 1–7) |
| `course_sections` | Class sections under each level (batches / time slots) |
| `students` | Student profiles |
| `enrollments` | Student → section enrolments |
| `teachers` | Teacher and teaching assistant profiles |
| `teacher_assignments` | Teacher → course assignments |
| `section_assignments` | Teacher → section assignments |

### Attendance & Updates
| Table | Purpose |
|-------|---------|
| `attendance_records` | Per-student, per-session attendance |
| `weekly_updates` | Teacher-published weekly class updates (shown on Parent Portal) |
| `teacher_notes` | Private sticky notes for teachers (visible only to the author) |

### Portal & Auth
| Table | Purpose |
|-------|---------|
| `admin_users` | Super Admin accounts (email + bcrypt password) |
| `portal_users` | Teacher / Assistant portal accounts (phone + bcrypt PIN) |
| `portal_settings` | Global portal configuration key-value store |

### Communication
| Table | Purpose |
|-------|---------|
| `announcements` | Admin announcements (shown on public site and teacher portal) |
| `events` | Gurukul events calendar |
| `admin_messages` | Messages sent by admin to teachers / parents |
| `parent_notifications` | Notification log for parent-facing communications |
| `email_logs` | SMTP email delivery log |
| `contacts` | Contact form submissions |

### Membership & Finance
| Table | Purpose |
|-------|---------|
| `members` | Temple membership records (used for Parent Portal phone verification) |
| `payments` | Student fee payment records |
| `inventory` | Gurukul inventory / asset tracking |
| `testimonials` | Parent / student testimonials shown on public website |

## Regenerating the DDL

Run from the project root:

```bash
PGPASSWORD=<password> pg_dump \
  --host=<host> \
  --username=<user> \
  --dbname=<dbname> \
  --schema-only \
  --no-owner \
  --no-privileges \
  -F p \
  > lib/db/ddl/schema.sql
```

Or use the `DATABASE_URL` environment variable directly:

```bash
pg_dump "$DATABASE_URL" --schema-only --no-owner --no-privileges > lib/db/ddl/schema.sql
```

## ORM

The database is managed via [Drizzle ORM](https://orm.drizzle.team/). The authoritative source of truth for the schema is:

```
lib/db/src/schema/gurukul.ts
```

To apply schema changes to the database:

```bash
cd lib/db && pnpm run push-force
```
