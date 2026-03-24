const BASE = "/api/admin";
const AUTH_KEY = "gurukul_admin_auth_v2";

function getAuthHeaders(): Record<string, string> {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return {};
    const user = JSON.parse(raw) as { email?: string; phone?: string; role?: string };
    const headers: Record<string, string> = {};
    if (user.email) headers["X-User-Email"] = user.email;
    if (user.phone) headers["X-User-Phone"] = user.phone;
    if (user.role)  headers["X-User-Role"]  = user.role;
    return headers;
  } catch {
    return {};
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const authHeaders = getAuthHeaders();
  const headers: Record<string, string> = { ...authHeaders };
  if (body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
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
    list:       () => request<unknown[]>("GET", "/teachers"),
    assistants: () => request<{ id: number; name: string }[]>("GET", "/teachers/assistants"),
    create:     (data: unknown) => request("POST", "/teachers", data),
    update:     (id: number, data: unknown) => request("PUT", `/teachers/${id}`, data),
    remove:     (id: number) => request("DELETE", `/teachers/${id}`),
  },
  students: {
    list:          () => request<unknown[]>("GET", "/students"),
    meta:          () => request<unknown>("GET", "/students/meta"),
    register:      (data: unknown) => request("POST", "/students", data),
    remove:        (code: string) => request("DELETE", `/students/${code}`),
    assignSection: (enrollmentId: number, sectionId: number | null) =>
      request("PATCH", `/students/enrollments/${enrollmentId}/section`, { sectionId }),
  },
  members: {
    lookup: (emailOrPhone: string) => request<{ id: number; name: string | null; email: string | null; phone: string | null; membershipYear: number | null }>("POST", "/members/lookup", { emailOrPhone }),
    create: (data: unknown) => request<{ id: number }>("POST", "/members", data),
    update: (id: number, data: unknown) => request("PATCH", `/members/${id}`, data),
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
    list:            (includeArchived = false) => request<unknown[]>("GET", `/courses${includeArchived ? "?includeArchived=true" : ""}`),
    create:          (data: unknown) => request("POST", "/courses", data),
    update:          (id: number, data: unknown) => request("PUT", `/courses/${id}`, data),
    archive:         (id: number) => request("PATCH", `/courses/${id}/archive`),
    remove:          (id: number) => request("DELETE", `/courses/${id}`),
    addLevel:        (courseId: number, data: unknown) => request("POST", `/courses/${courseId}/levels`, data),
    updateLevel:     (levelId: number, data: unknown) => request("PUT", `/courses/levels/${levelId}`, data),
    deleteLevel:     (levelId: number) => request("DELETE", `/courses/levels/${levelId}`),
    levelStudents:   (levelId: number, sectionId?: number | null) => request<unknown[]>("GET", `/courses/levels/${levelId}/students${sectionId ? `?sectionId=${sectionId}` : ""}`),
    levelSections:   (levelId: number) => request<unknown[]>("GET", `/courses/levels/${levelId}/sections`),
    addSection:      (levelId: number, data: unknown) => request("POST", `/courses/levels/${levelId}/sections`, data),
    updateSection:   (sectionId: number, data: unknown) => request("PUT", `/courses/sections/${sectionId}`, data),
    deleteSection:   (sectionId: number) => request("DELETE", `/courses/sections/${sectionId}`),
    assignSection:   (sectionId: number, data: unknown) => request("POST", `/courses/sections/${sectionId}/assign`, data),
    unassignSection: (sectionId: number, teacherId: number) => request("DELETE", `/courses/sections/${sectionId}/unassign/${teacherId}`),
    // For attendance dropdown — all levels with course name
    levels:          () => request<unknown[]>("GET", "/attendance/levels"),
  },
  attendance: {
    get:     (levelId: number, date: string) => request<unknown[]>("GET", `/attendance?levelId=${levelId}&date=${encodeURIComponent(date)}`),
    history: (levelId: number) => request<unknown[]>("GET", `/attendance/history?levelId=${levelId}`),
    save:    (data: unknown) => request("POST", "/attendance", data),
  },
  testimonials: {
    list:   () => request<unknown[]>("GET", "/testimonials"),
    create: (data: unknown) => request<{ id: number }>("POST", "/testimonials", data),
    update: (id: number, data: unknown) => request("PUT", `/testimonials/${id}`, data),
    remove: (id: number) => request("DELETE", `/testimonials/${id}`),
  },
  notifications: {
    list:         () => request<unknown[]>("GET", "/notifications"),
    create:       (data: unknown) => request("POST", "/notifications", data),
    updateStatus: (id: number, status: string) => request("PATCH", `/notifications/${id}/status`, { status }),
  },
  weeklyUpdates: {
    list:       () => request<unknown[]>("GET", "/weekly-updates"),
    formMeta:   () => request<unknown>("GET", "/weekly-updates/form-meta"),
    create:     (data: unknown) => request("POST", "/weekly-updates", data),
    update:     (id: number, data: unknown) => request("PUT", `/weekly-updates/${id}`, data),
    publish:    (id: number) => request("PATCH", `/weekly-updates/${id}/publish`, {}),
    remove:     (id: number) => request("DELETE", `/weekly-updates/${id}`),
  },
  teacherNotes: {
    list:   () => request<unknown[]>("GET", "/teacher-notes"),
    create: (data: { content: string; date: string; color: string }) => request("POST", "/teacher-notes", data),
    update: (id: number, data: { content?: string; color?: string }) => request("PUT", `/teacher-notes/${id}`, data),
    remove: (id: number) => request("DELETE", `/teacher-notes/${id}`),
  },
  messaging: {
    recipients: (params: { course?: string; curricYear?: string; employer?: string }) => {
      const qs = new URLSearchParams();
      if (params.course)     qs.set("course",     params.course);
      if (params.curricYear) qs.set("curricYear",  params.curricYear);
      if (params.employer)   qs.set("employer",    params.employer);
      return request<unknown[]>("GET", `/messaging/recipients?${qs}`);
    },
    employers: () => request<string[]>("GET", "/messaging/employers"),
    send:      (data: unknown) => request("POST", "/messaging/send", data),
    logs:      () => request<unknown[]>("GET", "/messaging/logs"),
    inbox:         () => request<unknown[]>("GET", "/messaging/inbox"),
    markRead:      (id: number) => request("PATCH", `/messaging/inbox/${id}/read`, {}),
    deleteMessage: (id: number) => request("DELETE", `/messaging/inbox/${id}`),
  },
};
