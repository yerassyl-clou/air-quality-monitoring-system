export interface UserProfile {
  user: {
    id: number;
    email: string;
    role: string;
    created_at: string;
  };
  age_group: string;
  occupation: string;
  sensitivity_level: string;
  location: string;
}

export interface NotificationRecord {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}
