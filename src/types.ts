export interface SaveStatus {
  job_id: string;
  resources?: string[];
  outlinks?: string[] | Record<string, unknown>;
  timestamp?: string;
  original_url?: string;
  status?: 'success' | 'pending' | 'error' | string;
  status_ext?: string;
  exception?: string;
  duration_sec?: number;
  message?: string;
  screenshot?: string;
}

export interface SaveResult {
  url: string;
  archiveUrl: string;
  screenshotUrl?: string;
  timestamp: string;
  originalUrl: string;
}
