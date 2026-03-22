export const ADMIN_CREDENTIALS = { username: "gurukuluser01", password: "gurukuladmin" };
const AUTH_KEY = "gurukul_admin_auth";

export function adminLogin(username: string, password: string): boolean {
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    localStorage.setItem(AUTH_KEY, "true");
    return true;
  }
  return false;
}

export function adminLogout() {
  localStorage.removeItem(AUTH_KEY);
}

export function isAdminAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === "true";
}
