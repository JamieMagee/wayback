export interface SaveStatus {
  job_id: string;
  resources: string[];
  outlinks?: string[];
  timestamp?: string;
  original_url?: string;
  status?: 'success' | 'pending' | 'error' | string;
  status_ext?: string;
  duration_sec?: number;
  message: string;
}
