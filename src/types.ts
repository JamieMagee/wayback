export interface SaveStatus {
  job_id: string;
  resources: string[];
  outlinks: string[];
  timestamp: string;
  original_url: string;
  status: 'success' | string;
  duration_sec: number;
}
