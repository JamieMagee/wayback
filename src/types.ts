export interface SaveStatus {
  job_id: string;
  resources: string[];
  outlinks?: string[];
  timestamp?: string;
  original_url?: string;
  status?: 'success' | 'pending' | string;
  duration_sec?: number;
}
