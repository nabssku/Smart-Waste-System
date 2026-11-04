export type Role = 'admin' | 'user';
export type WasteType = 'organic' | 'plastic' | 'paper' | 'unknown';
export type ReportStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
  reportsCount?: number;
  reports?: Report[];
}

export interface ReportLog {
  id: string;
  reportId: string;
  changedById: string;
  oldStatus: ReportStatus;
  newStatus: ReportStatus;
  notes?: string | null;
  createdAt: string;
  changedBy?: {
    id: string;
    name: string;
    role: Role;
  };
}

export interface Report {
  id: string;
  userId: string;
  title: string;
  description: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  wasteType: WasteType;
  aiConfidence?: number | null;
  status: ReportStatus;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
  };
  logs?: ReportLog[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

export interface DashboardStats {
  totalReports: number;
  totalUsers: number;
  byStatus: {
    pending: number;
    in_progress: number;
    completed: number;
    rejected: number;
  };
  byWasteType: {
    organic: number;
    plastic: number;
    paper: number;
    unknown: number;
  };
  reportsByMonth: Array<{
    month: string;
    count: number;
  }>;
  recentReports: Report[];
}

export interface UserStats {
  totalReports: number;
  byStatus: {
    pending: number;
    in_progress: number;
    completed: number;
    rejected: number;
  };
  byWasteType: {
    organic: number;
    plastic: number;
    paper: number;
    unknown: number;
  };
  recentReports: Report[];
}

export interface MlPredictionResult {
  prediction: WasteType;
  confidence: number;
  all_predictions: {
    organic: number;
    plastic: number;
    paper: number;
  };
  image_url?: string;
  data?: {
    prediction: WasteType;
    confidence: number;
    all_predictions: {
      organic: number;
      plastic: number;
      paper: number;
    };
    imageUrl?: string;
    engine?: string;
  };
}
