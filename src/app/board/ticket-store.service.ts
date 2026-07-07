import { Injectable, signal, inject } from '@angular/core';
import { Project, Resource, Sprint, Ticket, Status } from '../shared/models';
import { SEED_PROJECTS, SEED_RESOURCES, SEED_SPRINTS, SEED_TICKETS } from './seed';
import { keyFromName } from '../shared/utils';
import { TicketApiService } from '../core/ticket-api.service';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Holds all board state as signals.
 *
 * Data is loaded from the API on startup and kept in sync with it on every
 * mutation. The seed data is only used as a simple fallback until the API responds.
 */
@Injectable({ providedIn: 'root' })
export class TicketStoreService {
  private api = inject(TicketApiService);
  private refreshTimer: number | null = null;
  private refreshInFlight = false;

  readonly projects = signal<Project[]>(SEED_PROJECTS);
  readonly resources = signal<Resource[]>(SEED_RESOURCES);
  readonly tickets = signal<Ticket[]>(SEED_TICKETS);
  readonly sprints = signal<Sprint[]>(SEED_SPRINTS);

  /** Set when the most recent API call failed, so the UI can show a banner. */
  readonly apiError = signal<string | null>(null);

  constructor() {
    this.refreshFromApi();
    this.startPolling();
  }

  /** Re-fetch projects, resources, sprints, and tickets from the API and replace local state. */
  refreshFromApi(): void {
    void this.loadBoardData();
  }

  private startPolling(): void {
    this.refreshTimer = window.setInterval(() => {
      void this.loadBoardData();
    }, 5000);
  }

  private async loadBoardData(): Promise<void> {
    if (this.refreshInFlight) return;

    this.refreshInFlight = true;

    try {
      const [projects, resources, sprints, tickets] = await Promise.all([
        this.api.getProjects(),
        this.api.getResources(),
        this.api.getSprints(),
        this.api.getTickets(),
      ]);

      this.projects.set(projects);
      this.resources.set(resources);
      this.sprints.set(sprints);
      this.tickets.set(tickets);
      this.apiError.set(null);
    } catch {
      this.markApiUnreachable();
    } finally {
      this.refreshInFlight = false;
    }
  }

  private markApiUnreachable(): void {
    this.apiError.set('Could not reach the API. Please try again when the backend is available.');
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
    void this.api.addTicket(t).catch(() => this.markApiUnreachable());
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
    void this.api.updateTicket(id, patch).then((saved) => {
      // Reconcile with the server's authoritative completedAt in case it differs.
      this.tickets.update((prev) => prev.map((t) => (t.id === id ? { ...t, completedAt: saved.completedAt } : t)));
    }).catch(() => this.markApiUnreachable());
  }

  reassignProject(id: string, newProjectId: string): void {
    const newNum = this.nextNum(newProjectId);
    // A ticket's sprint belongs to its old project, so moving projects clears it.
    this.updateTicket(id, { projectId: newProjectId, num: newNum, sprintId: null });
  }

  deleteTicket(id: string): void {
    this.tickets.update((prev) => prev.filter((t) => t.id !== id));
    void this.api.deleteTicket(id).catch(() => this.markApiUnreachable());
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
    void this.api.addProject(p).catch(() => this.markApiUnreachable());
    return p;
  }

  removeProject(id: string): void {
    this.projects.update((prev) => prev.filter((p) => p.id !== id));
    this.tickets.update((prev) => prev.filter((t) => t.projectId !== id));
    this.sprints.update((prev) => prev.filter((s) => s.projectId !== id));
    void this.api.deleteProject(id).catch(() => this.markApiUnreachable());
  }

  addResource(name: string, role: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    const r: Resource = { id: 'r' + Date.now(), name: trimmed, role: role.trim() || 'Team member' };
    this.resources.update((prev) => [...prev, r]);
    void this.api.addResource(r).catch(() => this.markApiUnreachable());
  }

  removeResource(id: string): void {
    this.resources.update((prev) => prev.filter((r) => r.id !== id));
    this.tickets.update((prev) =>
      prev.map((t) => (t.resourceId === id ? { ...t, resourceId: null } : t))
    );
    void this.api.deleteResource(id).catch(() => this.markApiUnreachable());
  }

  addSprint(projectId: string): Sprint | null {
    if (!projectId) return null;
    const count = this.sprints().filter((s) => s.projectId === projectId).length;
    const start = todayIso();
    const end = new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const s: Sprint = { id: 's' + Date.now(), projectId, name: `Sprint ${count + 1}`, startDate: start, endDate: end };
    this.sprints.update((prev) => [...prev, s]);
    void this.api.addSprint(s).catch(() => this.markApiUnreachable());
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
    void this.api.updateSprint(id, updated).catch(() => this.markApiUnreachable());
  }

  removeSprint(id: string): void {
    this.sprints.update((prev) => prev.filter((s) => s.id !== id));
    this.tickets.update((prev) => prev.map((t) => (t.sprintId === id ? { ...t, sprintId: null } : t)));
    void this.api.deleteSprint(id).catch(() => this.markApiUnreachable());
  }
}
