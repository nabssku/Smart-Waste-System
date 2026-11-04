import { API_BASE_URL } from './utils';
import {
  DashboardStats,
  MlPredictionResult,
  PaginatedResponse,
  Report,
  ReportStatus,
  Role,
  User,
  UserStats,
} from './types';

const ACCESS_TOKEN_KEY = 'sw_access_token';
const REFRESH_TOKEN_KEY = 'sw_refresh_token';
const USER_KEY = 'sw_user';

export function setAuthSession(user: User, accessToken: string, refreshToken: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  // Set cookies for Next.js middleware route protection
  document.cookie = `sw_token=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  document.cookie = `sw_role=${user.role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  document.cookie = 'sw_token=; path=/; max-age=0';
  document.cookie = 'sw_role=; path=/; max-age=0';
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

async function tryRefreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearAuthSession();
      return null;
    }
    const json = await res.json();
    const newAccess = json?.data?.accessToken;
    const newRefresh = json?.data?.refreshToken;
    if (newAccess) {
      localStorage.setItem(ACCESS_TOKEN_KEY, newAccess);
      document.cookie = `sw_token=${newAccess}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    }
    if (newRefresh) {
      localStorage.setItem(REFRESH_TOKEN_KEY, newRefresh);
    }
    return newAccess || null;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const token = getAccessToken();
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && retry && !endpoint.includes('/auth/login')) {
    const refreshedToken = await tryRefreshAccessToken();
    if (refreshedToken) {
      return apiRequest<T>(endpoint, options, false);
    }
  }

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload?.message ||
      (payload?.errors && Array.isArray(payload.errors)
        ? payload.errors.map((e: any) => e.message).join(', ')
        : null) ||
      `Terjadi kesalahan jaringan (HTTP ${response.status})`;
    throw new Error(message);
  }

  return payload as T;
}

// ==========================================
// AUTH API
// ==========================================
export const authApi = {
  async login(email: string, password: string) {
    const res = await apiRequest<{
      success: boolean;
      message: string;
      data: { user: User; accessToken: string; refreshToken: string };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthSession(res.data.user, res.data.accessToken, res.data.refreshToken);
    return res.data;
  },

  async register(data: { name: string; email: string; password: string; phone?: string }) {
    const res = await apiRequest<{
      success: boolean;
      message: string;
      data: { user: User; accessToken: string; refreshToken: string };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setAuthSession(res.data.user, res.data.accessToken, res.data.refreshToken);
    return res.data;
  },

  async getMe() {
    const res = await apiRequest<{ success: boolean; data: User }>('/auth/me');
    if (typeof window !== 'undefined' && res.data) {
      localStorage.setItem(USER_KEY, JSON.stringify(res.data));
    }
    return res.data;
  },
};

// ==========================================
// STATS API
// ==========================================
export const statsApi = {
  async getAdminDashboard() {
    const res = await apiRequest<{ success: boolean; data: DashboardStats }>('/stats/dashboard');
    return res.data;
  },

  async getMyStats() {
    const res = await apiRequest<{ success: boolean; data: UserStats }>('/stats/my');
    return res.data;
  },
};

// ==========================================
// REPORTS API
// ==========================================
export interface ReportQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  waste_type?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

function buildQuery(params: Record<string, any>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== 'all') {
      sp.set(k, String(v));
    }
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export const reportsApi = {
  async getAll(params: ReportQueryParams = {}) {
    return apiRequest<PaginatedResponse<Report>>(`/reports${buildQuery(params)}`);
  },

  async getMy(params: ReportQueryParams = {}) {
    return apiRequest<PaginatedResponse<Report>>(`/reports/my${buildQuery(params)}`);
  },

  async getById(id: string) {
    const res = await apiRequest<{ success: boolean; data: Report }>(`/reports/${id}`);
    return res.data;
  },

  async create(formData: FormData) {
    const res = await apiRequest<{ success: boolean; message: string; data: Report }>('/reports', {
      method: 'POST',
      body: formData,
    });
    return res.data;
  },

  async update(id: string, data: FormData | Record<string, any>) {
    const isForm = data instanceof FormData;
    const res = await apiRequest<{ success: boolean; message: string; data: Report }>(
      `/reports/${id}`,
      {
        method: 'PUT',
        body: isForm ? data : JSON.stringify(data),
      }
    );
    return res.data;
  },

  async updateStatus(id: string, status: ReportStatus, adminNotes?: string) {
    const res = await apiRequest<{ success: boolean; message: string; data: Report }>(
      `/reports/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, admin_notes: adminNotes }),
      }
    );
    return res.data;
  },

  async remove(id: string) {
    return apiRequest<{ success: boolean; message: string }>(`/reports/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==========================================
// ML PREDICTION API
// ==========================================
export const mlApi = {
  async predictImage(file: File): Promise<MlPredictionResult> {
    const formData = new FormData();
    formData.append('image', file);

    return apiRequest<MlPredictionResult>('/ml/predict', {
      method: 'POST',
      body: formData,
    });
  },
};

// ==========================================
// USERS API (ADMIN)
// ==========================================
export const usersApi = {
  async getAll(params: { page?: number; limit?: number; search?: string; role?: string } = {}) {
    return apiRequest<PaginatedResponse<User>>(`/users${buildQuery(params)}`);
  },

  async getById(id: string) {
    const res = await apiRequest<{ success: boolean; data: User }>(`/users/${id}`);
    return res.data;
  },

  async update(
    id: string,
    data: { name?: string; email?: string; role?: Role; phone?: string; password?: string }
  ) {
    const res = await apiRequest<{ success: boolean; message: string; data: User }>(
      `/users/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    return res.data;
  },

  async remove(id: string) {
    return apiRequest<{ success: boolean; message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};
