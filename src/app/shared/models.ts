export type Status   = 'backlog' | 'progress' | 'review' | 'done';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Project {
  id: string;
  key: string;
  name: string;
}

export interface Resource {
  id: string;
  name: string;
  role: string;
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  startDate: string; // ISO date, e.g. '2026-06-16'
  endDate: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
}

export interface Ticket {
  id: string;
  projectId: string;
  sprintId: string | null;
  num: number;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  resourceId: string | null;
  storyPoints: number | null;
  completedAt: string | null; // ISO date; set automatically when status → 'done'
  createdAt?: string | null;  // ISO datetime; populated server-side (optional until all records are migrated)
}

export interface TicketComment {
  id: string;
  ticketId: string;
  author: string;
  body: string;
  createdAt: string; // ISO datetime, e.g. '2026-07-07T14:23:00'
}

export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  username: string;
  role: 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER' | 'VIEWER';
}

export const COLORS = {
  bg: '#EDF0F4',
  ink: '#1C2333',
  inkSoft: '#5B6478',
  card: '#FFFFFF',
  line: '#C7CFDA',
  amber: '#D98E2B',
  red: '#C1473D',
  green: '#3E8067',
  blue: '#3B6FA0',
  slate: '#7C8696',
} as const;

export const COLUMNS: { id: Status; label: string }[] = [
  { id: 'backlog',  label: 'BACKLOG'     },
  { id: 'progress', label: 'IN PROGRESS' },
  { id: 'review',   label: 'REVIEW'      },
  { id: 'done',     label: 'DONE'        },
];

export const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  low:    { label: 'LOW',    color: COLORS.slate },
  medium: { label: 'MEDIUM', color: COLORS.blue  },
  high:   { label: 'HIGH',   color: COLORS.amber },
  urgent: { label: 'URGENT', color: COLORS.red   },
};

export const POINT_OPTIONS = [1, 2, 3, 5, 8, 13] as const;
