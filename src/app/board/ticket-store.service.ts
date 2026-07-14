import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { Project, Resource, Sprint, Status, Ticket, TicketComment } from '../shared/models';
import { keyFromName } from '../shared/utils';
import { TicketApiService } from '../core/ticket-api.service';
import { AuthService } from '../core/auth.service';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Prefix for optimistic inserts before the server returns the real UUID. */
const TEMP_PREFIX = '__temp__';
const REFRESH_INTERVAL_MS = 30000;

@Injectable({ providedIn: 'root' })
export class TicketStoreService {
  private api = inject(TicketApiService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private refreshInFlight = false;
  private readonly visibilityRefresh = () => {
    if (!document.hidden) void this.loadBoardData();
  };

  readonly projects  = signal<Project[]>([]);
  readonly resources = signal<Resource[]>([]);
  readonly tickets   = signal<Ticket[]>([]);
  readonly sprints   = signal<Sprint[]>([]);

  /** Non-null when the most recent API call failed. Shown as a banner in the UI. */
  readonly apiError = signal<string | null>(null);

  readonly ticketComments = signal<Map<string, TicketComment[]>>(new Map());

  constructor() {
    this.refreshFromApi();
    this.startPolling();

    this.destroyRef.onDestroy(() => {
      if (this.refreshTimer !== null) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }
      document.removeEventListener('visibilitychange', this.visibilityRefresh);
    });
  }

  refreshFromApi(): void {
    void this.loadBoardData();
  }

  private startPolling(): void {
    this.refreshTimer = setInterval(() => {
      if (!document.hidden) void this.loadBoardData();
    }, REFRESH_INTERVAL_MS);
    document.addEventListener('visibilitychange', this.visibilityRefresh);
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
      this.sprints.set(this.visibleSprintsFromSource(sprints));
      // Don't overwrite any in-flight ticket (temp ID) that hasn't been
      // confirmed by the server yet — avoids a race with slow POSTs.
      this.tickets.update((prev) => {
        const inFlight = prev.filter((t) => t.id.startsWith(TEMP_PREFIX));
        return inFlight.length ? [...tickets, ...inFlight] : tickets;
      });
      this.apiError.set(null);
    } catch {
      this.apiError.set('Could not reach the API. Working from last known state.');
    } finally {
      this.refreshInFlight = false;
    }
  }

  private visibleSprintsFromSource(sprints: Sprint[]): Sprint[] {
    return this.dedupSprintsById(sprints);
  }

  private dedupSprintsById(sprints: Sprint[]): Sprint[] {
    const seen = new Set<string>();
    return sprints.filter((sprint) => {
      if (seen.has(sprint.id)) return false;
      seen.add(sprint.id);
      return true;
    });
  }

  // ─── Comments ───────────────────────────────────────────────────────────────

  loadComments(ticketId: string): Promise<void> {
    return this.api.getTicketComments(ticketId)
      .then((entries) => {
        const sorted = entries.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        this.ticketComments.update((m) => new Map(m).set(ticketId, sorted));
      })
      .catch(() => {
        this.apiError.set('Could not load ticket comments.');
      });
  }

  commentsFor(ticketId: string): TicketComment[] {
    return this.ticketComments().get(ticketId) ?? [];
  }

  addComment(ticketId: string, body: string): void {
    const trimmed = body.trim();
    if (!trimmed) return;

    const optimistic: TicketComment = {
      id: TEMP_PREFIX + Date.now(),
      ticketId,
      author: this.auth.currentUser() ?? 'Unknown user',
      body: trimmed,
      createdAt: new Date().toISOString(),
    };

    const snapshot = this.ticketComments();
    this.ticketComments.update((m) => {
      const next = new Map(m);
      next.set(ticketId, [optimistic, ...(next.get(ticketId) ?? [])]);
      return next;
    });

    const { id: _id, ticketId: _ticketId, ...payload } = optimistic;
    void this.api.addTicketComment(ticketId, payload)
      .then((saved) => {
        this.ticketComments.update((m) => {
          const next = new Map(m);
          const entries = next.get(ticketId) ?? [];
          next.set(ticketId, entries.map((entry) => (entry.id === optimistic.id ? saved : entry)));
          return next;
        });
      })
      .catch((err: Error) => {
        this.ticketComments.set(snapshot);
        this.apiError.set(`Failed to add comment: ${err.message}`);
      });
  }

  // ─── Lookups ─────────────────────────────────────────────────────────────────

  visibleSprints(projectId: string): Sprint[] {
    return this.sprints().filter((s) => projectId === 'all' || s.projectId === projectId);
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
      this.tickets()
        .filter((t) => t.projectId === projectId)
        .reduce((m, t) => Math.max(m, t.num), 0) + 1
    );
  }

  // ─── Ticket mutations ────────────────────────────────────────────────────────

  addTicket(
    projectId: string,
    status: Status,
    title: string,
    sprintId: string | null = null,
    resourceId: string | null = null,
  ): void {
    const trimmed = title.trim();
    if (!trimmed) return;

    const tempId = TEMP_PREFIX + Date.now();
    const optimistic: Ticket = {
      id: tempId,
      projectId,
      sprintId,
      num: this.nextNum(projectId),
      title: trimmed,
      description: '',
      status,
      priority: 'medium',
      resourceId,
      storyPoints: null,
      completedAt: status === 'done' ? todayIso() : null,
      createdAt: null,
    };

    const snapshot = this.tickets();
    this.tickets.update((prev) => [...prev, optimistic]);

    const { id: _drop, ...payload } = optimistic;
    void this.api.addTicket(payload)
      .then((saved) => {
        // Swap temp ticket for the server's real version (UUID + createdAt)
        this.tickets.update((prev) => prev.map((t) => (t.id === tempId ? saved : t)));
      })
      .catch((err: Error) => {
        this.tickets.set(snapshot);
        this.apiError.set(`Failed to create ticket: ${err.message}`);
      });
  }

  updateTicket(id: string, patch: Partial<Ticket>): void {
    const snapshot = this.tickets();

    this.tickets.update((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next = { ...t, ...patch };
        if (patch.status === 'done' && t.status !== 'done') next.completedAt = todayIso();
        if (patch.status && patch.status !== 'done' && t.status === 'done') next.completedAt = null;
        return next;
      })
    );

    void this.api.updateTicket(id, patch)
      .then((saved) => {
        // Reconcile with the server's authoritative completedAt
        this.tickets.update((prev) =>
          prev.map((t) => (t.id === id ? { ...t, completedAt: saved.completedAt } : t))
        );
      })
      .catch((err: Error) => {
        this.tickets.set(snapshot);
        this.apiError.set(`Failed to update ticket: ${err.message}`);
      });
  }

  deleteTicket(id: string): void {
    const snapshot = this.tickets();
    this.tickets.update((prev) => prev.filter((t) => t.id !== id));

    void this.api.deleteTicket(id)
      .catch((err: Error) => {
        this.tickets.set(snapshot);
        this.apiError.set(`Failed to delete ticket: ${err.message}`);
      });
  }

  moveTicket(id: string, status: Status): void {
    this.updateTicket(id, { status });
  }

  reassignProject(id: string, newProjectId: string): void {
    this.updateTicket(id, { projectId: newProjectId, num: this.nextNum(newProjectId), sprintId: null });
  }

  // ─── Project mutations ───────────────────────────────────────────────────────

  addProject(name: string): Project | null {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const key = keyFromName(trimmed, this.projects().map((p) => p.key));
    const tempId = TEMP_PREFIX + Date.now();
    const optimistic: Project = { id: tempId, key, name: trimmed };

    const snapshot = this.projects();
    this.projects.update((prev) => [...prev, optimistic]);

    const { id: _drop, ...payload } = optimistic;
    void this.api.addProject(payload)
      .then((saved) => {
        this.projects.update((prev) => prev.map((p) => (p.id === tempId ? saved : p)));
      })
      .catch((err: Error) => {
        this.projects.set(snapshot);
        this.apiError.set(`Failed to create project: ${err.message}`);
      });

    return optimistic;
  }

  removeProject(id: string): void {
    const snapshotProjects = this.projects();
    const snapshotTickets  = this.tickets();
    const snapshotSprints  = this.sprints();

    this.projects.update((prev) => prev.filter((p) => p.id !== id));
    this.tickets.update((prev)  => prev.filter((t) => t.projectId !== id));
    this.sprints.update((prev)  => prev.filter((s) => s.projectId !== id));

    void this.api.deleteProject(id)
      .catch((err: Error) => {
        this.projects.set(snapshotProjects);
        this.tickets.set(snapshotTickets);
        this.sprints.set(snapshotSprints);
        this.apiError.set(`Failed to delete project: ${err.message}`);
      });
  }

  // ─── Resource mutations ──────────────────────────────────────────────────────

  addResource(name: string, role: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;

    const tempId = TEMP_PREFIX + Date.now();
    const optimistic: Resource = { id: tempId, name: trimmed, role: role.trim() || 'Team member' };

    const snapshot = this.resources();
    this.resources.update((prev) => [...prev, optimistic]);

    const { id: _drop, ...payload } = optimistic;
    void this.api.addResource(payload)
      .then((saved) => {
        this.resources.update((prev) => prev.map((r) => (r.id === tempId ? saved : r)));
      })
      .catch((err: Error) => {
        this.resources.set(snapshot);
        this.apiError.set(`Failed to add resource: ${err.message}`);
      });
  }

  removeResource(id: string): void {
    const snapshotResources = this.resources();
    const snapshotTickets   = this.tickets();

    this.resources.update((prev) => prev.filter((r) => r.id !== id));
    this.tickets.update((prev) =>
      prev.map((t) => (t.resourceId === id ? { ...t, resourceId: null } : t))
    );

    void this.api.deleteResource(id)
      .catch((err: Error) => {
        this.resources.set(snapshotResources);
        this.tickets.set(snapshotTickets);
        this.apiError.set(`Failed to remove resource: ${err.message}`);
      });
  }

  // ─── Sprint mutations ────────────────────────────────────────────────────────

  addSprint(projectId: string): Sprint | null {
    if (!projectId) return null;

    const count = this.sprints().filter((s) => s.projectId === projectId).length;
    const startDate = todayIso();
    const endDate   = new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const tempId = TEMP_PREFIX + Date.now();
    const optimistic: Sprint = { id: tempId, projectId, name: `Sprint ${count + 1}`, startDate, endDate };

    const snapshot = this.sprints();
    this.sprints.update((prev) => [...prev, optimistic]);

    const { id: _drop, ...payload } = optimistic;
    void this.api.addSprint(payload)
      .then((saved) => {
        this.sprints.update((prev) => prev.map((s) => (s.id === tempId ? saved : s)));
      })
      .catch((err: Error) => {
        this.sprints.set(snapshot);
        this.apiError.set(`Failed to create sprint: ${err.message}`);
      });

    return optimistic;
  }

  updateSprint(id: string, patch: Partial<Sprint>): void {
    const snapshot = this.sprints();
    let updated: Sprint | undefined;

    this.sprints.update((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        updated = { ...s, ...patch };
        return updated;
      })
    );

    if (!updated) return;

    void this.api.updateSprint(id, updated)
      .catch((err: Error) => {
        this.sprints.set(snapshot);
        this.apiError.set(`Failed to update sprint: ${err.message}`);
      });
  }

  removeSprint(id: string): void {
    const snapshotSprints = this.sprints();
    const snapshotTickets = this.tickets();

    this.sprints.update((prev) => prev.filter((s) => s.id !== id));
    this.tickets.update((prev) =>
      prev.map((t) => (t.sprintId === id ? { ...t, sprintId: null } : t))
    );

    void this.api.deleteSprint(id)
      .catch((err: Error) => {
        this.sprints.set(snapshotSprints);
        this.tickets.set(snapshotTickets);
        this.apiError.set(`Failed to delete sprint: ${err.message}`);
      });
  }
}
