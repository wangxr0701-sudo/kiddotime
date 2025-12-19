
export enum TaskStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED'
}

export interface Task {
  id: string;
  title: string;
  subject: string; // e.g., 'Math', 'English', 'Chinese'
  estimatedMinutes: number;
  status: TaskStatus;
  isBreak?: boolean; // Whether this is an AI-suggested break
  emoji?: string;
  actualDurationSeconds?: number;
}

export interface UserProfile {
  name: string;
  avatar: string;
}

export enum AppState {
  ONBOARDING = 'ONBOARDING',
  PLANNING = 'PLANNING',
  DOING = 'DOING',
  SUMMARY = 'SUMMARY',
  CALENDAR = 'CALENDAR'
}
