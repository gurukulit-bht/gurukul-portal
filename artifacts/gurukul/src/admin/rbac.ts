export type UserRole = "admin" | "teacher" | "assistant";

export type Permission =
  | "dashboard"
  | "announcements"
  | "calendar"
  | "courses"
  | "courseManagement"
  | "teachers"
  | "students"
  | "inventory"
  | "settings"
  | "documents"
  | "attendance"
  | "notifications"
  | "roles"
  | "registration"
  | "testimonials"
  | "messaging"
  | "weeklyUpdates";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // Admin manages courses/teachers/students strategically — classroom operations are for teachers
  admin: [
    "dashboard", "announcements", "calendar", "courseManagement",
    "teachers", "students", "inventory", "roles", "settings", "registration",
    "testimonials", "messaging",
  ],
  // Teachers and Assistants handle classroom operations
  teacher:   ["courses", "documents", "attendance", "notifications", "weeklyUpdates"],
  assistant: ["courses", "documents", "attendance", "notifications", "weeklyUpdates"],
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
    case "assistant": return "/admin/courses";
  }
}
