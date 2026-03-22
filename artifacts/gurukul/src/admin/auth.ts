import type { UserRole } from "./rbac";

export interface AuthUser {
  email:       string;
  displayName: string;
  role:        UserRole;
  initials:    string;
}

const DEMO_USERS: Array<AuthUser & { password: string; username?: string }> = [
  {
    email: "admin@gurukul.org",
    password: "Admin@123",
    displayName: "Gurukul Admin",
    role: "admin",
    initials: "GA",
  },
  {
    email: "teacher@gurukul.org",
    password: "Teacher@123",
    displayName: "Smt. Priya Sharma",
    role: "teacher",
    initials: "PS",
  },
  {
    email: "assistant@gurukul.org",
    password: "Asst@123",
    displayName: "Sri Venkat Rao",
    role: "assistant",
    initials: "VR",
  },
  // Backward-compatible legacy credential (maps to admin)
  {
    email: "gurukuluser01",
    username: "gurukuluser01",
    password: "gurukuladmin",
    displayName: "Gurukul Admin",
    role: "admin",
    initials: "GA",
  },
];

const AUTH_KEY = "gurukul_admin_auth_v2";

export function adminLogin(emailOrUsername: string, password: string): AuthUser | null {
  const lower = emailOrUsername.toLowerCase().trim();
  const match = DEMO_USERS.find(
    (u) =>
      (u.email.toLowerCase() === lower || u.username?.toLowerCase() === lower) &&
      u.password === password,
  );
  if (!match) return null;
  const user: AuthUser = {
    email:       match.email,
    displayName: match.displayName,
    role:        match.role,
    initials:    match.initials,
  };
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  return user;
}

export function adminLogout() {
  localStorage.removeItem(AUTH_KEY);
  // Also clear legacy key
  localStorage.removeItem("gurukul_admin_auth");
}

export function getAuthUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_KEY);
  if (raw) {
    try { return JSON.parse(raw) as AuthUser; } catch { /* ignore */ }
  }
  // Legacy key migration
  if (localStorage.getItem("gurukul_admin_auth") === "true") {
    const legacy: AuthUser = { email: "gurukuluser01", displayName: "Gurukul Admin", role: "admin", initials: "GA" };
    localStorage.setItem(AUTH_KEY, JSON.stringify(legacy));
    localStorage.removeItem("gurukul_admin_auth");
    return legacy;
  }
  return null;
}

export function isAdminAuthenticated(): boolean {
  return getAuthUser() !== null;
}

export const DEMO_CREDENTIALS = [
  { email: "admin@gurukul.org",     password: "Admin@123",    role: "Gurukul Admin" },
  { email: "teacher@gurukul.org",   password: "Teacher@123",  role: "Teacher" },
  { email: "assistant@gurukul.org", password: "Asst@123",     role: "Assistant" },
];
