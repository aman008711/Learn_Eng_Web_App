export interface User {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ApiError {
  detail: string | { loc: string[]; msg: string; type: string }[];
}

export interface UserActivity {
  id: string;
  activity_type: string;
  description: string;
  xp_gained: number;
  created_at: string;
}

export interface DashboardData {
  user_email: string;
  streak: number;
  xp: number;
  level: number;
  daily_goal_minutes: number;
  daily_minutes_completed: number;
  progress_percentage: number;
  recent_activities: UserActivity[];
}
