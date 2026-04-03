export interface ReportPayload {
  location_id: number;
  description: string;
}

export interface ReportRecord {
  id: number;
  description: string;
  status: 'pending' | 'resolved';
  created_at: string;
  location: {
    id: number;
    name: string;
    city: string;
    latitude: number;
    longitude: number;
  };
}
