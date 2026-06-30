import { Injectable, signal, effect, inject } from '@angular/core';
import { Project, Resource, Sprint, Ticket, Status } from '../shared/models';
import { SEED_PROJECTS, SEED_RESOURCES, SEED_SPRINTS, SEED_TICKETS } from './seed';
import { keyFromName } from '../shared/utils';
import { TicketApiService } from '../core/ticket-api.service';

const LS_KEYS = {
  projects: 'mini-jira-projects',
  resources: 'mini-jira-resources',
  tickets: 'mini-jira-tickets',
  sprints: 'mini-jira-sprints',
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

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Holds all board state as signals.
 *
 * Data is loaded from the API on startup and kept in sync with it on every
 * mutation. localStorage is used underneath as an offline cache: it's what
 * populates the signals instantly on load, and it's kept up to date so the
 * board still works (read-only, from the last known state) if the API is
 * unreachable.
 */
@Injectable({ providedIn: 'root' })
export class TicketStoreService {
  private api = inject(TicketApiService);

  readonly projects = signal<Project[]>(load(LS_KEYS.projects, SEED_PROJECTS));
  readonly resources = signal<Resource[]>(load(LS_KEYS.resources, SEED_RESOURCES));
  readonly tickets = signal<Ticket[]>(load(LS_KEYS.tickets, SEED_TICKETS));
  readonly sprints = signal<Sprint[]>(load(LS_KEYS.sprints, SEED_SPRINTS));

  /** Set when the most recent API call failed, so the UI can show a banner. */
  readonly apiError = signal<string | null>(null);

  constructor() {
    // Mirror every signal change into localStorage so it acts as an offline cache.
    effect(() => save(LS_KEYS.projects, this.projects()));
    effect(() => save(LS_KEYS.resources, this.resources()));
    effect(() => save(LS_KEYS.tickets, this.tickets()));
    effect(() => save(LS_KEYS.sprints, this.sprints()));

    this.refreshFromApi();
  }

  /** Re-fetch projects, resources, sprints, and tickets from the API and replace local state. */
  refreshFromApi(): void {
    this.api.getProjects().subscribe({
      next: (data) => this.projects.set(data),
      error: () => this.markApiUnreachable(),
    });
    this.api.getResources().subscribe({
      next: (data) => this.resources.set(data),
      error: () => this.markApiUnreachable(),
    });
    this.api.getSprints().subscribe({
      next: (data) => this.sprints.set(data),
      error: () => this.markApiUnreachable(),
    });
    this.api.getTickets().subscribe({
      next: (data) => {
        this.tickets.set(data);
        this.apiError.set(null);
      },
      error: () => this.markApiUnreachable(),
    });
  }

  private markApiUnreachable(): void {
    this.apiError.set('Could not reach the API — showing your last saved board.');
  }

  projectById(id: string | null | undefined): Project | undefined {
    if (!id) return undefined;
    return this.projects().find((p) => p.id === id);
  }

  resourceById(id: string | null | undefined): Resource | undefined {
    if (!id) return undefined;
    return this.resources().find((r) => r.id === id);
  }

  sprintById(id: string | null | undefined): Sprint | undefined {
    if (!id) return undefined;
    return this.sprints().find((s) => s.id === id);
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

  addTicket(projectId: string, status: Status, title: string, sprintId: string | null = null): void {
    const trimmed = title.trim();
    if (!trimmed) return;
    const t: Ticket = {
      id: 't' + Date.now(),
      projectId,
      sprintId,
      num: this.nextNum(projectId),
      title: trimmed,
      description: '',
      status,
      priority: 'medium',
      resourceId: null,
      storyPoints: null,
      completedAt: status === 'done' ? todayIso() : null,
    };
    // Optimistic: update the UI immediately, then persist to the API in the background.
    this.tickets.update((prev) => [...prev, t]);
    this.api.addTicket(t).subscribe({
      error: () => this.markApiUnreachable(),
    });
  }

  updateTicket(id: string, patch: Partial<Ticket>): void {
    this.tickets.update((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next = { ...t, ...patch };
        // Auto-stamp completedAt locally too, so velocity looks right even before
        // the API's response comes back (the backend does this authoritatively).
        if (patch.status === 'done' && t.status !== 'done') next.completedAt = todayIso();
        if (patch.status && patch.status !== 'done' && t.status === 'done') next.completedAt = null;
        return next;
      })
    );
    this.api.updateTicket(id, patch).subscribe({
      next: (saved) => {
        // Reconcile with the server's authoritative completedAt in case it differs.
        this.tickets.update((prev) => prev.map((t) => (t.id === id ? { ...t, completedAt: saved.completedAt } : t)));
      },
      error: () => this.markApiUnreachable(),
    });
  }

  reassignProject(id: string, newProjectId: string): void {
    const newNum = this.nextNum(newProjectId);
    // A ticket's sprint belongs to its old project, so moving projects clears it.
    this.updateTicket(id, { projectId: newProjectId, num: newNum, sprintId: null });
  }

  deleteTicket(id: string): void {
    this.tickets.update((prev) => prev.filter((t) => t.id !== id));
    this.api.deleteTicket(id).subscribe({
      error: () => this.markApiUnreachable(),
    });
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
    this.api.addProject(p).subscribe({
      error: () => this.markApiUnreachable(),
    });
    return p;
  }

  removeProject(id: string): void {
    this.projects.update((prev) => prev.filter((p) => p.id !== id));
    this.tickets.update((prev) => prev.filter((t) => t.projectId !== id));
    this.sprints.update((prev) => prev.filter((s) => s.projectId !== id));
    this.api.deleteProject(id).subscribe({
      error: () => this.markApiUnreachable(),
    });
  }

  addResource(name: string, role: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    const r: Resource = { id: 'r' + Date.now(), name: trimmed, role: role.trim() || 'Team member' };
    this.resources.update((prev) => [...prev, r]);
    this.api.addResource(r).subscribe({
      error: () => this.markApiUnreachable(),
    });
  }

  removeResource(id: string): void {
    this.resources.update((prev) => prev.filter((r) => r.id !== id));
    this.tickets.update((prev) =>
      prev.map((t) => (t.resourceId === id ? { ...t, resourceId: null } : t))
    );
    this.api.deleteResource(id).subscribe({
      error: () => this.markApiUnreachable(),
    });
  }

  addSprint(projectId: string): Sprint | null {
    if (!projectId) return null;
    const count = this.sprints().filter((s) => s.projectId === projectId).length;
    const start = todayIso();
    const end = new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const s: Sprint = { id: 's' + Date.now(), projectId, name: `Sprint ${count + 1}`, startDate: start, endDate: end };
    this.sprints.update((prev) => [...prev, s]);
    this.api.addSprint(s).subscribe({
      error: () => this.markApiUnreachable(),
    });
    return s;
  }

  updateSprint(id: string, patch: Partial<Sprint>): void {
    let updated: Sprint | undefined;
    this.sprints.update((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        updated = { ...s, ...patch };
        return updated;
      })
    );
    if (!updated) return;
    // PUT expects the full resource, so send the merged sprint rather than just the patch.
    this.api.updateSprint(id, updated).subscribe({
      error: () => this.markApiUnreachable(),
    });
  }

  removeSprint(id: string): void {
    this.sprints.update((prev) => prev.filter((s) => s.id !== id));
    this.tickets.update((prev) => prev.map((t) => (t.sprintId === id ? { ...t, sprintId: null } : t)));
    this.api.deleteSprint(id).subscribe({
      error: () => this.markApiUnreachable(),
    });
  }
}
