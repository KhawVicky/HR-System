const API_BASE = "http://localhost/uwc-hr-api/api.php";

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown>;

  constructor(message: string, status: number, data: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export type UserRole = "hr_staff" | "hiring_manager";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  department: string | null;
  status: string;
  roleId: 1 | 2;
  roleKey: UserRole;
  roleName: string;
}

export interface JobSummary {
  id: number;
  jobCode: string;
  title: string;
  department: string;
  location: string;
  salaryRange: string | null;
  employmentType: string | null;
  status: "draft" | "active" | "closed" | "archived";
  description: string | null;
  requiredQualification: string | null;
  requiredExperience: string | null;
  jdFileName: string | null;
  publishedAt: string | null;
  createdAt: string;
  link: string | null;
  applicants: number;
  newApplicants: number;
  avgScore: number;
  shortlistedCount: number;
  pendingCount: number;
}

export interface NotificationItem {
  id: number;
  applicationId?: number | null;
  jobId?: number | null;
  notificationType: string;
  title: string;
  message: string;
  isRead: 0 | 1 | boolean;
  createdAt: string;
}

export interface NotificationResponse {
  items: NotificationItem[];
  preview: NotificationItem[];
  unreadCount: number;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const [routePath, queryString] = path.replace(/^\//, "").split("?");
  const route = routePath;
  const query = queryString ? `&${queryString}` : "";
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_BASE}?route=${encodeURIComponent(route)}${query}`, {
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data.error || "API request failed",
      response.status,
      data,
    );
  }

  return data as T;
}

export function toPublicApplicationLink(path: string | null) {
  if (!path) return null;
  return `${window.location.origin}${path}`;
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem("hr_user_data");
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function canManageUsers(user: AuthUser | null) {
  return user?.roleId === 2 || user?.roleKey === "hiring_manager";
}

export function canViewHrEfficiency(user: AuthUser | null) {
  return canManageUsers(user);
}
