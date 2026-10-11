export const STATUSES = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED"] as const;
export type ApplicationStatus = (typeof STATUSES)[number];

export interface JobApplication {
  id: number;
  company: string;
  role: string;
  location: string | null;
  status: ApplicationStatus;
  jobUrl: string | null;
  notes: string | null;
  appliedOn: string;
  updatedAt: string;
}

export interface ApplicationInput {
  company: string;
  role: string;
  location?: string;
  status?: ApplicationStatus;
  jobUrl?: string;
  notes?: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface Stats {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
}
