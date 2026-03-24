import type { UserRole } from "./rbac";

export interface AuthUser {
  id?:         number;
  email?:      string;
  phone?:      string;
  displayName: string;
  role:        UserRole;
  initials:    string;
}

// ── Admin-only local credentials ──────────────────────────────────────────────
const ADMIN_USERS: Array<{ email: string; username?: string; password: string } & AuthUser> = [
  {
    email:       "admin@gurukul.org",
    password:    "Admin@123",
    displayName: "Gurukul Admin",
    role:        "admin",
    initials:    "GA",
  },
  {
    email:    "gurukuluser01",
    username: "gurukuluser01",
    password: "gurukuladmin",
    displayName: "Gurukul Admin",
    role:        "admin",
    initials:    "GA",
  },
];

const AUTH_KEY = "gurukul_admin_auth_v2";

function saveUser(user: AuthUser) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

// ── Smart async login — detects phone vs email ────────────────────────────────
export async function adminLogin(credential: string, secret: string): Promise<AuthUser | null> {
  const clean = credential.replace(/\D/g, "");

  // 10-digit phone → PIN login via API
  if (/^\d{10}$/.test(clean)) {
    return pinLogin(clean, secret);
  }

  // Email / username → local admin check
  const lower = credential.toLowerCase().trim();
  const match = ADMIN_USERS.find(
    (u) =>
      (u.email.toLowerCase() === lower || u.username?.toLowerCase() === lower) &&
      u.password === secret,
  );
  if (!match) return null;
  const user: AuthUser = {
    email:       match.email,
    displayName: match.displayName,
    role:        match.role,
    initials:    match.initials,
  };
  saveUser(user);
  return user;
}

// ── PIN-based login via API ───────────────────────────────────────────────────
export async function pinLogin(phone: string, pin: string): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/pin-login", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ phone, pin }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Login failed.");
  }
  const data = await res.json();
  const user: AuthUser = {
    id:          data.id,
    phone:       data.phone,
    displayName: data.name,
    role:        data.role as UserRole,
    initials:    data.initials,
  };
  saveUser(user);
  return user;
}

// ── PIN change via API ────────────────────────────────────────────────────────
export async function changePin(phone: string, currentPin: string, newPin: string): Promise<void> {
  const res = await fetch("/api/auth/change-pin", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ phone, currentPin, newPin }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to change PIN.");
  }
}

// ── Session helpers ───────────────────────────────────────────────────────────
export function adminLogout() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem("gurukul_admin_auth");
}

export function getAuthUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_KEY);
  if (raw) {
    try { return JSON.parse(raw) as AuthUser; } catch { /* ignore */ }
  }
  if (localStorage.getItem("gurukul_admin_auth") === "true") {
    const legacy: AuthUser = { email: "gurukuluser01", displayName: "Gurukul Admin", role: "admin", initials: "GA" };
    saveUser(legacy);
    localStorage.removeItem("gurukul_admin_auth");
    return legacy;
  }
  return null;
}

export function isAdminAuthenticated(): boolean {
  return getAuthUser() !== null;
}

export const DEMO_CREDENTIALS = [
  { credential: "admin@gurukul.org", secret: "Admin@123", role: "Gurukul Admin", hint: "Email + Password" },
];
