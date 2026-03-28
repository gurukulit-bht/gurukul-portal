export type UserRole = "admin" | "teacher" | "assistant";

export type Permission =
  | "dashboard"
  | "announcements"
  | "calendar"
  | "courses"
  | "courseManagement"
  | "teachers"
  | "students"
  | "members"
  | "inventory"
  | "settings"
  | "documents"
  | "attendance"
  | "roles"
  | "registration"
  | "testimonials"
  | "messaging"
  | "weeklyUpdates"
  | "help";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // Admin manages courses/teachers/students strategically — classroom operations are for teachers
  admin: [
    "dashboard", "announcements", "calendar", "courseManagement",
    "teachers", "students", "members", "inventory", "roles", "settings", "registration",
    "testimonials", "messaging", "help",
  ],
  // Teachers and Assistants handle classroom operations
  teacher:   ["courses", "attendance", "weeklyUpdates", "messaging", "settings", "help"],
  assistant: ["courses", "attendance", "weeklyUpdates", "messaging", "settings", "help"],
};

export function canAccess(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case "admin":     return "Gurukul Admin";
    case "teacher":   return "Teacher";
    case "assistant": return "Assistant";
  }
}

export function getRoleBadgeColor(role: UserRole): string {
  switch (role) {
    case "admin":     return "bg-red-100 text-red-800";
    case "teacher":   return "bg-blue-100 text-blue-800";
    case "assistant": return "bg-green-100 text-green-800";
  }
}

export function getDefaultRoute(role: UserRole): string {
  switch (role) {
    case "admin":     return "/admin/dashboard";
    case "teacher":
    case "assistant": return "/admin/attendance";
  }
}
