import { Project, Resource, Sprint, Ticket } from '../shared/models';

export const SEED_PROJECTS: Project[] = [
  { id: 'p1', key: 'MJ', name: 'Mini Jira' },
  { id: 'p2', key: 'API', name: 'API Platform' },
];

export const SEED_RESOURCES: Resource[] = [
  { id: 'r1', name: 'Sam Rivera', role: 'Engineer' },
  { id: 'r2', name: 'Priya Nair', role: 'Designer' },
  { id: 'r3', name: 'Jo Tanaka', role: 'PM' },
];

export const SEED_SPRINTS: Sprint[] = [
  { id: 's1', projectId: 'p1', name: 'Sprint 1', startDate: '2026-06-02', endDate: '2026-06-15' },
  { id: 's2', projectId: 'p1', name: 'Sprint 2', startDate: '2026-06-16', endDate: '2026-06-29' },
  { id: 's3', projectId: 'p1', name: 'Sprint 3', startDate: '2026-06-30', endDate: '2026-07-13' },
  { id: 's4', projectId: 'p2', name: 'Sprint 1', startDate: '2026-06-16', endDate: '2026-06-29' },
];

export const SEED_TICKETS: Ticket[] = [
  { id: 't1', projectId: 'p1', sprintId: 's1', num: 1, title: 'Set up project skeleton', description: 'Bootstrap repo, linting, CI.', status: 'done', priority: 'medium', resourceId: 'r1', storyPoints: 3, completedAt: '2026-06-10' },
  { id: 't2', projectId: 'p1', sprintId: 's1', num: 2, title: 'Design ticket board layout', description: 'Kanban columns with stub-style cards.', status: 'done', priority: 'high', resourceId: 'r2', storyPoints: 5, completedAt: '2026-06-13' },
  { id: 't3', projectId: 'p1', sprintId: 's2', num: 3, title: 'Wire up drag and drop', description: 'Move tickets between columns.', status: 'done', priority: 'urgent', resourceId: 'r1', storyPoints: 8, completedAt: '2026-06-25' },
  { id: 't4', projectId: 'p1', sprintId: 's2', num: 4, title: 'Add search and filtering', description: 'Filter board by title or assignee.', status: 'progress', priority: 'low', resourceId: null, storyPoints: 2, completedAt: null },
  { id: 't5', projectId: 'p2', sprintId: 's4', num: 1, title: 'Define auth endpoints', description: 'Spec login, refresh, logout.', status: 'backlog', priority: 'high', resourceId: 'r3', storyPoints: 5, completedAt: null },
  { id: 't6', projectId: 'p2', sprintId: 's4', num: 2, title: 'Rate limiting middleware', description: 'Per-key throttling.', status: 'progress', priority: 'medium', resourceId: 'r1', storyPoints: 3, completedAt: null },
];
