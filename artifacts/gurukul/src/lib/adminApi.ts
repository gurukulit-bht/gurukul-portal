const BASE = "/api/admin";

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export const adminApi = {
  teachers: {
    list:   () => request<unknown[]>("GET", "/teachers"),
    create: (data: unknown) => request("POST", "/teachers", data),
    update: (id: number, data: unknown) => request("PUT", `/teachers/${id}`, data),
    remove: (id: number) => request("DELETE", `/teachers/${id}`),
  },
  students: {
    list: () => request<unknown[]>("GET", "/students"),
  },
  inventory: {
    list:       () => request<unknown[]>("GET", "/inventory"),
    create:     (data: unknown) => request("POST", "/inventory", data),
    update:     (id: number, data: unknown) => request("PUT", `/inventory/${id}`, data),
    replenish:  (id: number, quantity: number) => request("PATCH", `/inventory/${id}/replenish`, { quantity }),
    remove:     (id: number) => request("DELETE", `/inventory/${id}`),
  },
  announcements: {
    list:   () => request<unknown[]>("GET", "/announcements"),
    create: (data: unknown) => request("POST", "/announcements", data),
    update: (id: number, data: unknown) => request("PUT", `/announcements/${id}`, data),
    toggle: (id: number) => request("PATCH", `/announcements/${id}/toggle`),
    remove: (id: number) => request("DELETE", `/announcements/${id}`),
  },
  events: {
    list:   () => request<unknown[]>("GET", "/events"),
    create: (data: unknown) => request("POST", "/events", data),
    update: (id: number, data: unknown) => request("PUT", `/events/${id}`, data),
    remove: (id: number) => request("DELETE", `/events/${id}`),
  },
  courses: {
    list:         () => request<unknown[]>("GET", "/courses"),
    levels:       () => request<unknown[]>("GET", "/attendance/levels"),
    updateLevel:  (levelId: number, data: unknown) => request("PUT", `/courses/levels/${levelId}`, data),
    levelStudents:(levelId: number) => request<unknown[]>("GET", `/courses/levels/${levelId}/students`),
  },
  attendance: {
    get:     (levelId: number, date: string) => request<unknown[]>("GET", `/attendance?levelId=${levelId}&date=${encodeURIComponent(date)}`),
    history: (levelId: number) => request<unknown[]>("GET", `/attendance/history?levelId=${levelId}`),
    save:    (data: unknown) => request("POST", "/attendance", data),
  },
  notifications: {
    list:         () => request<unknown[]>("GET", "/notifications"),
    create:       (data: unknown) => request("POST", "/notifications", data),
    updateStatus: (id: number, status: string) => request("PATCH", `/notifications/${id}/status`, { status }),
  },
};
