export type Status = 'backlog' | 'progress' | 'review' | 'done';
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

export interface User {
  id: string;
  username: string;
  password: string;
}

export interface Ticket {
  id: string;
  projectId: string;
  num: number;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  resourceId: string | null;
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
  { id: 'backlog', label: 'BACKLOG' },
  { id: 'progress', label: 'IN PROGRESS' },
  { id: 'review', label: 'REVIEW' },
  { id: 'done', label: 'DONE' },
];

export const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  low: { label: 'LOW', color: COLORS.slate },
  medium: { label: 'MEDIUM', color: COLORS.blue },
  high: { label: 'HIGH', color: COLORS.amber },
  urgent: { label: 'URGENT', color: COLORS.red },
};
