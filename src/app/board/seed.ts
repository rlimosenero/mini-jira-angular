import { Project, Resource, Ticket } from '../shared/models';

export const SEED_PROJECTS: Project[] = [
  { id: 'p1', key: 'MJ', name: 'Mini Jira' },
  { id: 'p2', key: 'API', name: 'API Platform' },
];

export const SEED_RESOURCES: Resource[] = [
  { id: 'r1', name: 'Sam Rivera', role: 'Engineer' },
  { id: 'r2', name: 'Priya Nair', role: 'Designer' },
  { id: 'r3', name: 'Jo Tanaka', role: 'PM' },
];

export const SEED_TICKETS: Ticket[] = [
  { id: 't1', projectId: 'p1', num: 1, title: 'Set up project skeleton', description: 'Bootstrap repo, linting, CI.', status: 'done', priority: 'medium', resourceId: 'r1' },
  { id: 't2', projectId: 'p1', num: 2, title: 'Design ticket board layout', description: 'Kanban columns with stub-style cards.', status: 'review', priority: 'high', resourceId: 'r2' },
  { id: 't3', projectId: 'p1', num: 3, title: 'Wire up drag and drop', description: 'Move tickets between columns.', status: 'progress', priority: 'urgent', resourceId: 'r1' },
  { id: 't4', projectId: 'p1', num: 4, title: 'Add search and filtering', description: 'Filter board by title or assignee.', status: 'backlog', priority: 'low', resourceId: null },
  { id: 't5', projectId: 'p2', num: 1, title: 'Define auth endpoints', description: 'Spec login, refresh, logout.', status: 'backlog', priority: 'high', resourceId: 'r3' },
  { id: 't6', projectId: 'p2', num: 2, title: 'Rate limiting middleware', description: 'Per-key throttling.', status: 'progress', priority: 'medium', resourceId: 'r1' },
];
