import { Injectable } from '@angular/core';
import { Project, Resource, Sprint, Ticket, TicketComment, User } from '../shared/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TicketApiService {

  /**
   * Core request wrapper. Throws on non-2xx responses so callers can catch uniformly.
   * Handles 204 No Content (Spring Boot DELETE/PATCH with no body) gracefully.
   */
  private async request<T>(input: string | URL, init: RequestInit = {}): Promise<T> {
    const response = await fetch(input, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`[${response.status}] ${errText || response.statusText}`);
    }

    if (response.status === 204) return undefined as T;

    const text = await response.text();
    return text ? (JSON.parse(text) as T) : (undefined as T);
  }

  // ─── Auth ────────────────────────────────────────────────────────────────────
  // NOTE: JWT wiring is a later release.
  async login(username: string, password: string): Promise<User[]> {
    const url = new URL(`${environment.apiBaseUrl}/users`);
    url.searchParams.set('username', username);
    url.searchParams.set('password', password);
    return this.request<User[]>(url.toString());
  }

  // ─── Projects ────────────────────────────────────────────────────────────────
  getProjects(): Promise<Project[]> {
    return this.request<Project[]>(`${environment.apiBaseUrl}/projects`);
  }

  addProject(project: Omit<Project, 'id'>): Promise<Project> {
    return this.request<Project>(`${environment.apiBaseUrl}/projects`, {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  deleteProject(id: string): Promise<void> {
    return this.request<void>(`${environment.apiBaseUrl}/projects/${id}`, { method: 'DELETE' });
  }

  // ─── Resources ───────────────────────────────────────────────────────────────
  getResources(): Promise<Resource[]> {
    return this.request<Resource[]>(`${environment.apiBaseUrl}/resources`);
  }

  addResource(resource: Omit<Resource, 'id'>): Promise<Resource> {
    return this.request<Resource>(`${environment.apiBaseUrl}/resources`, {
      method: 'POST',
      body: JSON.stringify(resource),
    });
  }

  deleteResource(id: string): Promise<void> {
    return this.request<void>(`${environment.apiBaseUrl}/resources/${id}`, { method: 'DELETE' });
  }

  // ─── Sprints ─────────────────────────────────────────────────────────────────
  getSprints(): Promise<Sprint[]> {
    return this.request<Sprint[]>(`${environment.apiBaseUrl}/sprints`);
  }

  addSprint(sprint: Omit<Sprint, 'id'>): Promise<Sprint> {
    return this.request<Sprint>(`${environment.apiBaseUrl}/sprints`, {
      method: 'POST',
      body: JSON.stringify(sprint),
    });
  }

  updateSprint(id: string, sprint: Sprint): Promise<Sprint> {
    return this.request<Sprint>(`${environment.apiBaseUrl}/sprints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sprint),
    });
  }

  deleteSprint(id: string): Promise<void> {
    return this.request<void>(`${environment.apiBaseUrl}/sprints/${id}`, { method: 'DELETE' });
  }

  // ─── Tickets ─────────────────────────────────────────────────────────────────
  getTickets(): Promise<Ticket[]> {
    return this.request<Ticket[]>(`${environment.apiBaseUrl}/tickets`);
  }

  addTicket(ticket: Omit<Ticket, 'id'>): Promise<Ticket> {
    return this.request<Ticket>(`${environment.apiBaseUrl}/tickets`, {
      method: 'POST',
      body: JSON.stringify(ticket),
    });
  }

  updateTicket(id: string, patch: Partial<Ticket>): Promise<Ticket> {
    return this.request<Ticket>(`${environment.apiBaseUrl}/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }

  deleteTicket(id: string): Promise<void> {
    return this.request<void>(`${environment.apiBaseUrl}/tickets/${id}`, { method: 'DELETE' });
  }

  // ─── Ticket Comments ────────────────────────────────────────────────────────
  getTicketComments(ticketId: string): Promise<TicketComment[]> {
    return this.request<TicketComment[]>(`${environment.apiBaseUrl}/tickets/${ticketId}/comments`);
  }

  addTicketComment(
    ticketId: string,
    comment: Omit<TicketComment, 'id' | 'ticketId'>
  ): Promise<TicketComment> {
    // CreateTicketCommentRequest expects author, body, and optional createdAt.
    const payload: Record<string, unknown> = {
      author: (comment as any).author,
      body: (comment as any).body,
    };
    if ((comment as any).createdAt) payload.createdAt = (comment as any).createdAt;

    return this.request<TicketComment>(`${environment.apiBaseUrl}/tickets/${ticketId}/comments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}