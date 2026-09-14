import { Injectable, inject } from '@angular/core';
import { Project, Resource, Sprint, Ticket, TicketComment, User } from '../shared/models';
import { AuthResponse } from '../shared/models';
import { AppConfigService } from './app-config.service';

@Injectable({ providedIn: 'root' })
export class TicketApiService {
  private readonly appConfig = inject(AppConfigService);

  /**
   * Core request wrapper. Throws on non-2xx responses so callers can catch uniformly.
   * Handles 204 No Content (Spring Boot DELETE/PATCH with no body) gracefully.
   */
  private async request<T>(
    input: string | URL,
    init: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('jwt');
    const baseUrl = this.appConfig.apiBaseUrl.replace(/\/$/, '');
    const url = typeof input === 'string'
      ? `${baseUrl}${input.startsWith('/') ? input : `/${input}`}`
      : input;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...init,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : (undefined as T);
  }

  // ─── Auth ────────────────────────────────────────────────────────────────────
  async register(
    username: string,
    password: string
  ): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async login(
    username: string,
    password: string
  ): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  // ─── Projects ────────────────────────────────────────────────────────────────
  getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects');
  }

  addProject(project: Omit<Project, 'id'>): Promise<Project> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  deleteProject(id: string): Promise<void> {
    return this.request<void>(`/projects/${id}`, { method: 'DELETE' });
  }

  // ─── Resources ───────────────────────────────────────────────────────────────
  getResources(): Promise<Resource[]> {
    return this.request<Resource[]>('/resources');
  }

  addResource(resource: Omit<Resource, 'id'>): Promise<Resource> {
    return this.request<Resource>('/resources', {
      method: 'POST',
      body: JSON.stringify(resource),
    });
  }

  deleteResource(id: string): Promise<void> {
    return this.request<void>(`/resources/${id}`, { method: 'DELETE' });
  }

  // ─── Sprints ─────────────────────────────────────────────────────────────────
  getSprints(): Promise<Sprint[]> {
    return this.request<Sprint[]>('/sprints');
  }

  addSprint(sprint: Omit<Sprint, 'id'>): Promise<Sprint> {
    return this.request<Sprint>('/sprints', {
      method: 'POST',
      body: JSON.stringify(sprint),
    });
  }

  updateSprint(id: string, sprint: Sprint): Promise<Sprint> {
    return this.request<Sprint>(`/sprints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sprint),
    });
  }

  deleteSprint(id: string): Promise<void> {
    return this.request<void>(`/sprints/${id}`, { method: 'DELETE' });
  }

  // ─── Tickets ─────────────────────────────────────────────────────────────────
  getTickets(): Promise<Ticket[]> {
    return this.request<Ticket[]>('/tickets');
  }

  addTicket(ticket: Omit<Ticket, 'id'>): Promise<Ticket> {
    return this.request<Ticket>('/tickets', {
      method: 'POST',
      body: JSON.stringify(ticket),
    });
  }

  updateTicket(id: string, patch: Partial<Ticket>): Promise<Ticket> {
    return this.request<Ticket>(`/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }

  deleteTicket(id: string): Promise<void> {
    return this.request<void>(`/tickets/${id}`, { method: 'DELETE' });
  }

  // ─── Ticket Comments ────────────────────────────────────────────────────────
  getTicketComments(ticketId: string): Promise<TicketComment[]> {
    return this.request<TicketComment[]>(`/tickets/${ticketId}/comments`);
  }

  addTicketComment(
    ticketId: string,
    comment: Omit<TicketComment, 'id' | 'ticketId'>
  ): Promise<TicketComment> {
    const payload: Record<string, unknown> = {
      author: (comment as any).author,
      body: (comment as any).body,
    };
    if ((comment as any).createdAt) payload.createdAt = (comment as any).createdAt;

    return this.request<TicketComment>(`/tickets/${ticketId}/comments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}