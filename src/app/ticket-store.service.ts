import { Injectable, signal, effect } from '@angular/core';
import { Project, Resource, Ticket, Status } from './models';
import { SEED_PROJECTS, SEED_RESOURCES, SEED_TICKETS } from './seed';
import { keyFromName } from './utils';

const LS_KEYS = {
  projects: 'mini-jira-projects',
  resources: 'mini-jira-resources',
  tickets: 'mini-jira-tickets',
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore persistence failure silently; board still works this session
  }
}

@Injectable({ providedIn: 'root' })
export class TicketStoreService {
  readonly projects = signal<Project[]>(load(LS_KEYS.projects, SEED_PROJECTS));
  readonly resources = signal<Resource[]>(load(LS_KEYS.resources, SEED_RESOURCES));
  readonly tickets = signal<Ticket[]>(load(LS_KEYS.tickets, SEED_TICKETS));

  constructor() {
    effect(() => save(LS_KEYS.projects, this.projects()));
    effect(() => save(LS_KEYS.resources, this.resources()));
    effect(() => save(LS_KEYS.tickets, this.tickets()));
  }

  projectById(id: string | null | undefined): Project | undefined {
    if (!id) return undefined;
    return this.projects().find((p) => p.id === id);
  }

  resourceById(id: string | null | undefined): Resource | undefined {
    if (!id) return undefined;
    return this.resources().find((r) => r.id === id);
  }

  ticketKey(t: Ticket): string {
    const p = this.projectById(t.projectId);
    return (p ? p.key : '??') + '-' + t.num;
  }

  nextNum(projectId: string): number {
    return (
      (this.tickets()
        .filter((t) => t.projectId === projectId)
        .reduce((m, t) => Math.max(m, t.num), 0) || 0) + 1
    );
  }

  addTicket(projectId: string, status: Status, title: string): void {
    const trimmed = title.trim();
    if (!trimmed) return;
    const t: Ticket = {
      id: 't' + Date.now(),
      projectId,
      num: this.nextNum(projectId),
      title: trimmed,
      description: '',
      status,
      priority: 'medium',
      resourceId: null,
    };
    this.tickets.update((prev) => [...prev, t]);
  }

  updateTicket(id: string, patch: Partial<Ticket>): void {
    this.tickets.update((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  reassignProject(id: string, newProjectId: string): void {
    const newNum = this.nextNum(newProjectId);
    this.tickets.update((prev) =>
      prev.map((t) => (t.id === id ? { ...t, projectId: newProjectId, num: newNum } : t))
    );
  }

  deleteTicket(id: string): void {
    this.tickets.update((prev) => prev.filter((t) => t.id !== id));
  }

  moveTicket(id: string, status: Status): void {
    this.updateTicket(id, { status });
  }

  addProject(name: string): Project | null {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const key = keyFromName(trimmed, this.projects().map((p) => p.key));
    const p: Project = { id: 'p' + Date.now(), key, name: trimmed };
    this.projects.update((prev) => [...prev, p]);
    return p;
  }

  removeProject(id: string): void {
    this.projects.update((prev) => prev.filter((p) => p.id !== id));
    this.tickets.update((prev) => prev.filter((t) => t.projectId !== id));
  }

  addResource(name: string, role: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    const r: Resource = { id: 'r' + Date.now(), name: trimmed, role: role.trim() || 'Team member' };
    this.resources.update((prev) => [...prev, r]);
  }

  removeResource(id: string): void {
    this.resources.update((prev) => prev.filter((r) => r.id !== id));
    this.tickets.update((prev) =>
      prev.map((t) => (t.resourceId === id ? { ...t, resourceId: null } : t))
    );
  }
}
