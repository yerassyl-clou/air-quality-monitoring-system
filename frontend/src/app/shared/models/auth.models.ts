export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  role: 'citizen' | 'analyst' | 'admin';
  age_group: 'child' | 'adult' | 'senior';
  occupation: string;
  sensitivity_level: 'normal' | 'asthma' | 'athlete';
  location: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}
