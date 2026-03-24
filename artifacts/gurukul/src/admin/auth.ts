import type { UserRole } from "./rbac";

export interface AuthUser {
  id?:          number;
  email?:       string;
  phone?:       string;
  displayName:  string;
  role:         UserRole;
  isSuperAdmin?: boolean;
  initials:     string;
}

const AUTH_KEY = "gurukul_admin_auth_v2";

function saveUser(user: AuthUser) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

// ── Unified login ─────────────────────────────────────────────────────────────
// Order of checks:
//   1. Try admin login (super admin or regular admin via adminUsersTable)
//   2. If not found as admin AND credential is a 10-digit phone, fall back to
//      teacher/assistant login via portalUsersTable
export async function adminLogin(credential: string, secret: string): Promise<AuthUser | null> {
  const clean = credential.replace(/\D/g, "");
  const isPhone = /^\d{10}$/.test(clean);

  // Step 1 — Admin login
  const adminRes = await fetch("/api/auth/admin-login", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ credential: credential.trim(), secret }),
  });

  if (adminRes.ok) {
    const data = await adminRes.json();
    const user: AuthUser = {
      id:           data.id,
      email:        data.email || undefined,
      phone:        data.phone || undefined,
      displayName:  data.name,
      role:         data.role as UserRole,
      isSuperAdmin: data.isSuperAdmin ?? false,
      initials:     data.initials,
    };
    saveUser(user);
    return user;
  }

  // Step 2 — Fall back to teacher / assistant login for phone credentials
  if (isPhone) {
    return pinLogin(clean, secret);
  }

  // Surface the admin login error
  const body = await adminRes.json().catch(() => ({}));
  throw new Error(body.error ?? "Login failed.");
}

// ── PIN-based login for teachers / assistants ──────────────────────────────────
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

// ── PIN change via API ─────────────────────────────────────────────────────────
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

// ── Session helpers ────────────────────────────────────────────────────────────
export function adminLogout() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem("gurukul_admin_auth");
}

export function getAuthUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_KEY);
  if (raw) {
    try { return JSON.parse(raw) as AuthUser; } catch { /* ignore */ }
  }
  return null;
}

export function isAdminAuthenticated(): boolean {
  return getAuthUser() !== null;
}

export const DEMO_CREDENTIALS = [
  { credential: "admin@gurukul.org", secret: "JaiHanuman2026$", role: "Super Admin", hint: "Email + Password" },
];
